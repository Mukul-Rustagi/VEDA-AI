import { Queue } from "bullmq";

import {
  GENERATION_JOB_NAME,
  GENERATION_QUEUE_NAME,
  PDF_JOB_NAME,
  PDF_QUEUE_NAME
} from "../config/constants.js";
import { createRedisConnection } from "./redis.js";

const queueConnection = createRedisConnection();

export const generationQueue = new Queue(GENERATION_QUEUE_NAME, {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1500
    },
    removeOnComplete: {
      age: 60 * 60 * 24,
      count: 250
    },
    removeOnFail: {
      age: 60 * 60 * 24 * 2,
      count: 500
    }
  }
});

export const pdfQueue = new Queue(PDF_QUEUE_NAME, {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1500
    },
    removeOnComplete: {
      age: 60 * 60 * 24,
      count: 250
    },
    removeOnFail: {
      age: 60 * 60 * 24 * 2,
      count: 500
    }
  }
});

export async function enqueueGenerationJob(assignmentId: string): Promise<void> {
  const existingJob = await generationQueue.getJob(assignmentId);
  if (existingJob) {
    try {
      await existingJob.remove();
    } catch {
      // If the existing job is active/locked, keep it and let queue dedupe.
    }
  }

  await generationQueue.add(
    GENERATION_JOB_NAME,
    { assignmentId },
    {
      jobId: assignmentId
    }
  );
}

export async function enqueuePdfJob(assignmentId: string): Promise<void> {
  const existingJob = await pdfQueue.getJob(assignmentId);
  if (existingJob) {
    const state = await existingJob.getState();
    if (state === "waiting" || state === "active" || state === "delayed") {
      return;
    }
    try {
      await existingJob.remove();
    } catch {
      return;
    }
  }

  await pdfQueue.add(
    PDF_JOB_NAME,
    { assignmentId },
    {
      jobId: assignmentId
    }
  );
}

export async function removeGenerationJob(assignmentId: string): Promise<void> {
  const existingJob = await generationQueue.getJob(assignmentId);
  if (!existingJob) return;

  try {
    await existingJob.remove();
  } catch {
    // If the job is active/locked, leave it. Worker handles missing records safely.
  }
}

export async function removePdfJob(assignmentId: string): Promise<void> {
  const existingJob = await pdfQueue.getJob(assignmentId);
  if (!existingJob) return;

  try {
    await existingJob.remove();
  } catch {
    // If the job is active/locked, leave it.
  }
}
