import type { Request, Response } from "express";
import multer from "multer";
import { QUESTION_TYPE_OPTIONS } from "@vedaai/shared";

import { HttpError } from "../../lib/http.js";
import {
  createAssignment,
  deleteAssignment,
  getAssignmentById,
  listAssignments,
  queueAssignmentPdf,
  regenerateAssignment
} from "./assignment.service.js";
import { extractMaterialText } from "./material.js";
import { getCachedPdfBuffer } from "../pdf/pdf-cache.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (["application/pdf", "text/plain"].includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(
      new HttpError(
        400,
        "Only PDF and text files are supported for upload material."
      )
    );
  }
});

export const uploadAssignmentMaterial = upload.single("materialFile");

type QuestionTypeOption = (typeof QUESTION_TYPE_OPTIONS)[number];

const questionTypeAliases: Record<string, QuestionTypeOption> = {
  multiple_choice_questions: "Multiple Choice Questions",
  short_questions: "Short Questions",
  long_questions: "Long Questions",
  diagram_graph_based_questions: "Diagram/Graph-Based Questions",
  numerical_problems: "Numerical Problems",
  true_false: "True/False",
  very_short_questions: "Very Short Questions"
};

function normalizeQuestionType(value: unknown): QuestionTypeOption | undefined {
  if (typeof value !== "string") return undefined;

  if (QUESTION_TYPE_OPTIONS.includes(value as QuestionTypeOption)) {
    return value as QuestionTypeOption;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return questionTypeAliases[normalized];
}

function parseQuestionTypes(rawValue: unknown): unknown {
  let parsedValue = rawValue;

  if (typeof rawValue === "string") {
    try {
      parsedValue = JSON.parse(rawValue);
    } catch {
      throw new HttpError(400, "Invalid questionTypes payload");
    }
  }

  if (!Array.isArray(parsedValue)) {
    return parsedValue;
  }

  return parsedValue.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      return entry;
    }

    const row = entry as Record<string, unknown>;
    const normalizedType = normalizeQuestionType(row.type) ?? row.type;

    return {
      id:
        typeof row.id === "string" && row.id.trim().length > 0
          ? row.id
          : `qt-${index + 1}`,
      type: normalizedType,
      questionCount:
        row.questionCount ??
        row.count ??
        row.noOfQuestions ??
        row.numberOfQuestions,
      marksPerQuestion:
        row.marksPerQuestion ?? row.marks ?? row.mark ?? row.points
    };
  });
}

export async function createAssignmentHandler(req: Request, res: Response): Promise<void> {
  const file = req.file;
  const fileText = file ? await extractMaterialText(file) : "";
  const directMaterial = typeof req.body.materialText === "string" ? req.body.materialText : "";

  const mergedMaterialText = [directMaterial, fileText]
    .map((value) => value.trim())
    .filter(Boolean)
    .join("\n\n");

  const payload = {
    title: req.body.title,
    subject: req.body.subject,
    className: req.body.className,
    dueDate: req.body.dueDate,
    additionalInstructions: req.body.additionalInstructions ?? "",
    questionTypes: parseQuestionTypes(req.body.questionTypes),
    materialText: mergedMaterialText,
    materialFileName: file?.originalname
  };

  const data = await createAssignment(payload);
  res.status(201).json({ data });
}

export async function listAssignmentsHandler(_req: Request, res: Response): Promise<void> {
  const data = await listAssignments();
  res.json({ data });
}

export async function getAssignmentHandler(req: Request, res: Response): Promise<void> {
  const assignmentId = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;
  const data = await getAssignmentById(assignmentId);
  res.json({ data });
}

export async function regenerateAssignmentHandler(
  req: Request,
  res: Response
): Promise<void> {
  const assignmentId = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;
  const data = await regenerateAssignment(assignmentId);
  res.json({ data });
}

export async function deleteAssignmentHandler(req: Request, res: Response): Promise<void> {
  const assignmentId = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;
  const data = await deleteAssignment(assignmentId);
  res.json({ data });
}

export async function queueAssignmentPdfHandler(
  req: Request,
  res: Response
): Promise<void> {
  const assignmentId = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  const status = await queueAssignmentPdf(assignmentId);
  res.json({
    data: {
      status,
      downloadPath: `/api/assignments/${assignmentId}/pdf/download`
    }
  });
}

export async function downloadAssignmentPdfHandler(
  req: Request,
  res: Response
): Promise<void> {
  const assignmentId = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  const pdfBuffer = await getCachedPdfBuffer(assignmentId);
  if (!pdfBuffer) {
    throw new HttpError(404, "PDF is not ready yet. Please retry shortly.");
  }

  const assignment = await getAssignmentById(assignmentId);
  const sanitizedTitle = assignment.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

  const filename = `${sanitizedTitle || "assignment"}-${assignmentId.slice(-6)}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(pdfBuffer);
}
