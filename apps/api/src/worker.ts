import { Worker } from "bullmq";

import type { AssignmentInput } from "@vedaai/shared";
import { assignmentInputSchema } from "@vedaai/shared";

import {
  GENERATION_JOB_NAME,
  GENERATION_QUEUE_NAME,
  PDF_JOB_NAME,
  PDF_QUEUE_NAME
} from "./config/constants.js";
import { connectMongo, disconnectMongo } from "./db/mongoose.js";
import { createRedisConnection } from "./lib/redis.js";
import { generateQuestionPaper } from "./modules/ai/paper-generator.js";
import {
  getAssignmentForGeneration,
  setAssignmentStatus
} from "./modules/assignments/assignment.service.js";
import { cachePdfBuffer } from "./modules/pdf/pdf-cache.js";
import { createQuestionPaperPdf } from "./modules/pdf/pdf-generator.js";

interface GenerationJobPayload {
  assignmentId: string;
}

interface PdfJobPayload {
  assignmentId: string;
}

async function bootstrapWorker(): Promise<void> {
  await connectMongo();

  const worker = new Worker<GenerationJobPayload>(
    GENERATION_QUEUE_NAME,
    async (job) => {
      if (job.name !== GENERATION_JOB_NAME) {
        return;
      }

      const assignmentId = job.data.assignmentId;
      if (!assignmentId) return;

      await setAssignmentStatus(assignmentId, "generating");
      await job.updateProgress({ stage: "generating", assignmentId });

      try {
        const record = await getAssignmentForGeneration(assignmentId);

        const payload: AssignmentInput = assignmentInputSchema.parse({
          title: record.title,
          subject: record.subject,
          className: record.className,
          dueDate: record.dueDate.toISOString().slice(0, 10),
          questionTypes: record.questionTypes,
          additionalInstructions: record.additionalInstructions ?? "",
          materialText: record.material?.extractedText ?? "",
          materialFileName: record.material?.fileName
        });

        const paper = await generateQuestionPaper(payload);

        await setAssignmentStatus(assignmentId, "ready", { paper });

        return {
          assignmentId,
          status: "ready"
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Paper generation failed";

        await setAssignmentStatus(assignmentId, "failed", {
          errorMessage: message
        });
        throw error;
      }
    },
    {
      connection: createRedisConnection(),
      concurrency: 3
    }
  );

  worker.on("completed", (job) => {
    if (!job) return;
    // eslint-disable-next-line no-console
    console.log(`Generation completed for assignment ${job.id}`);
  });

  worker.on("failed", (job, error) => {
    // eslint-disable-next-line no-console
    console.error(`Generation failed for assignment ${job?.id}`, error?.message);
  });

  const pdfWorker = new Worker<PdfJobPayload>(
    PDF_QUEUE_NAME,
    async (job) => {
      if (job.name !== PDF_JOB_NAME) {
        return;
      }

      const assignmentId = job.data.assignmentId;
      if (!assignmentId) return;

      const record = await getAssignmentForGeneration(assignmentId);
      if (!record.paper || record.status !== "ready") {
        throw new Error("Question paper is not ready for PDF export.");
      }

      const pdfBuffer = await createQuestionPaperPdf(record.paper, {
        assignmentTitle: record.title,
        className: record.className,
        dueDate: record.dueDate.toISOString()
      });

      await cachePdfBuffer(assignmentId, pdfBuffer);
      await job.updateProgress({ stage: "ready", assignmentId });

      return {
        assignmentId,
        status: "ready"
      };
    },
    {
      connection: createRedisConnection(),
      concurrency: 2
    }
  );

  pdfWorker.on("completed", (job) => {
    if (!job) return;
    // eslint-disable-next-line no-console
    console.log(`PDF generated for assignment ${job.id}`);
  });

  pdfWorker.on("failed", (job, error) => {
    // eslint-disable-next-line no-console
    console.error(`PDF generation failed for assignment ${job?.id}`, error?.message);
  });

  const shutdown = async (): Promise<void> => {
    await Promise.allSettled([worker.close(), pdfWorker.close()]);
    await disconnectMongo();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrapWorker().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Worker boot failed", error);
  process.exit(1);
});
