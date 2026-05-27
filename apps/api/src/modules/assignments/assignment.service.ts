import type {
  AssignmentDetail,
  AssignmentStatus,
  AssignmentStatusEvent,
  AssignmentSummary,
  GeneratedPaper
} from "@vedaai/shared";
import { assignmentInputSchema, generatedPaperSchema } from "@vedaai/shared";

import { HttpError } from "../../lib/http.js";
import {
  enqueueGenerationJob,
  enqueuePdfJob,
  removeGenerationJob,
  removePdfJob
} from "../../lib/queue.js";
import { appRedis } from "../../lib/redis.js";
import { clearCachedPdf, getCachedPdfBuffer } from "../pdf/pdf-cache.js";
import {
  AssignmentModel,
  type AssignmentDocument
} from "./assignment.model.js";

type AssignmentRecord = AssignmentDocument & {
  _id: { toString(): string };
};

const ASSIGNMENT_LIST_CACHE_KEY = "assignments:list:v1";
const ASSIGNMENT_DETAIL_CACHE_PREFIX = "assignments:detail:v1:";
const ASSIGNMENT_CACHE_TTL_SECONDS = 60 * 2;

function getAssignmentDetailCacheKey(id: string): string {
  return `${ASSIGNMENT_DETAIL_CACHE_PREFIX}${id}`;
}

async function getCachedJson<T>(key: string): Promise<T | null> {
  const rawValue = await appRedis.get(key);
  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    await appRedis.del(key);
    return null;
  }
}

async function setCachedJson(key: string, value: unknown): Promise<void> {
  await appRedis.set(
    key,
    JSON.stringify(value),
    "EX",
    ASSIGNMENT_CACHE_TTL_SECONDS
  );
}

async function invalidateAssignmentCache(id?: string): Promise<void> {
  if (id) {
    await appRedis.del(ASSIGNMENT_LIST_CACHE_KEY, getAssignmentDetailCacheKey(id));
    return;
  }
  await appRedis.del(ASSIGNMENT_LIST_CACHE_KEY);
}

function mapSummary(record: AssignmentRecord): AssignmentSummary {
  return {
    id: record._id.toString(),
    title: record.title,
    subject: record.subject,
    className: record.className,
    dueDate: record.dueDate.toISOString(),
    createdAt: record.createdAt.toISOString(),
    status: record.status,
    totalQuestions: record.totalQuestions,
    totalMarks: record.totalMarks,
    errorMessage: record.errorMessage
  };
}

function mapDetail(record: AssignmentRecord): AssignmentDetail {
  return {
    ...mapSummary(record),
    questionTypes: record.questionTypes,
    additionalInstructions: record.additionalInstructions,
    paper: record.paper
  };
}

function getTotals(questionTypes: AssignmentDocument["questionTypes"]): {
  totalQuestions: number;
  totalMarks: number;
} {
  return questionTypes.reduce(
    (acc, item) => {
      acc.totalQuestions += item.questionCount;
      acc.totalMarks += item.questionCount * item.marksPerQuestion;
      return acc;
    },
    { totalQuestions: 0, totalMarks: 0 }
  );
}

export async function createAssignment(input: unknown): Promise<AssignmentSummary> {
  const parsed = assignmentInputSchema.parse(input);
  const totals = getTotals(parsed.questionTypes);

  const record = await AssignmentModel.create({
    ...parsed,
    dueDate: new Date(parsed.dueDate),
    material: {
      fileName: parsed.materialFileName,
      extractedText: parsed.materialText
    },
    totalQuestions: totals.totalQuestions,
    totalMarks: totals.totalMarks,
    status: "queued"
  });

  await enqueueGenerationJob(record.id);
  await invalidateAssignmentCache();
  return mapSummary(record.toObject() as AssignmentRecord);
}

export async function listAssignments(): Promise<AssignmentSummary[]> {
  const cachedAssignments = await getCachedJson<AssignmentSummary[]>(
    ASSIGNMENT_LIST_CACHE_KEY
  );
  if (cachedAssignments) {
    return cachedAssignments;
  }

  const records = (await AssignmentModel.find()
    .sort({ createdAt: -1 })
    .lean()
    .exec()) as AssignmentRecord[];
  const summaries = records.map(mapSummary);
  await setCachedJson(ASSIGNMENT_LIST_CACHE_KEY, summaries);
  return summaries;
}

export async function getAssignmentById(id: string): Promise<AssignmentDetail> {
  const cachedAssignment = await getCachedJson<AssignmentDetail>(
    getAssignmentDetailCacheKey(id)
  );
  if (cachedAssignment) {
    return cachedAssignment;
  }

  const record = (await AssignmentModel.findById(id).lean().exec()) as
    | AssignmentRecord
    | null;

  if (!record) {
    throw new HttpError(404, "Assignment not found");
  }

  const detail = mapDetail(record);
  await setCachedJson(getAssignmentDetailCacheKey(id), detail);
  return detail;
}

export async function regenerateAssignment(id: string): Promise<AssignmentSummary> {
  const record = (await AssignmentModel.findByIdAndUpdate(
    id,
    {
      status: "queued",
      paper: undefined,
      errorMessage: undefined
    },
    { new: true }
  )
    .lean()
    .exec()) as AssignmentRecord | null;

  if (!record) {
    throw new HttpError(404, "Assignment not found");
  }

  await enqueueGenerationJob(id);
  await clearCachedPdf(id);
  await invalidateAssignmentCache(id);
  return mapSummary(record);
}

export async function deleteAssignment(id: string): Promise<{ id: string }> {
  const record = (await AssignmentModel.findByIdAndDelete(id)
    .select("_id")
    .lean()
    .exec()) as { _id: { toString(): string } } | null;

  if (!record) {
    throw new HttpError(404, "Assignment not found");
  }

  await Promise.all([
    removeGenerationJob(id),
    removePdfJob(id),
    clearCachedPdf(id),
    invalidateAssignmentCache(id)
  ]);
  return { id: record._id.toString() };
}

export async function queueAssignmentPdf(
  assignmentId: string
): Promise<"ready" | "queued"> {
  const record = (await AssignmentModel.findById(assignmentId)
    .select("status paper")
    .lean()
    .exec()) as
    | Pick<AssignmentRecord, "status" | "paper">
    | null;

  if (!record) {
    throw new HttpError(404, "Assignment not found");
  }

  if (record.status !== "ready" || !record.paper) {
    throw new HttpError(409, "Question paper is not ready for PDF export yet.");
  }

  const cachedPdf = await getCachedPdfBuffer(assignmentId);
  if (cachedPdf) {
    return "ready";
  }

  await enqueuePdfJob(assignmentId);
  return "queued";
}

export async function getAssignmentForGeneration(id: string): Promise<AssignmentRecord> {
  const record = (await AssignmentModel.findById(id).lean().exec()) as
    | AssignmentRecord
    | null;

  if (!record) {
    throw new HttpError(404, "Assignment not found");
  }

  return record;
}

export async function setAssignmentStatus(
  id: string,
  status: AssignmentStatus,
  payload?: {
    errorMessage?: string;
    paper?: GeneratedPaper;
  }
): Promise<void> {
  const update: Partial<AssignmentDocument> = {
    status
  };

  if (status === "failed") {
    update.errorMessage = payload?.errorMessage ?? "Failed to generate paper";
  } else if (status === "ready" && payload?.paper) {
    update.paper = generatedPaperSchema.parse(payload.paper);
    update.errorMessage = undefined;
  } else {
    update.errorMessage = undefined;
  }

  await AssignmentModel.findByIdAndUpdate(id, update).exec();
  await clearCachedPdf(id);
  await invalidateAssignmentCache(id);
}

export async function getStatusEvent(
  assignmentId: string
): Promise<AssignmentStatusEvent | null> {
  const record = (await AssignmentModel.findById(assignmentId)
    .select("status errorMessage updatedAt")
    .lean()
    .exec()) as
    | (Pick<AssignmentRecord, "status" | "errorMessage" | "updatedAt"> & {
        _id: { toString(): string };
      })
    | null;

  if (!record) return null;

  return {
    assignmentId: record._id.toString(),
    status: record.status,
    errorMessage: record.errorMessage,
    updatedAt: record.updatedAt.toISOString()
  };
}
