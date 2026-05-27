import { QueueEvents } from "bullmq";

import { GENERATION_QUEUE_NAME } from "../../config/constants.js";
import { emitAssignmentStatus } from "../../lib/socket.js";
import {
  getStatusEvent,
  setAssignmentStatus
} from "../assignments/assignment.service.js";
import { createRedisConnection } from "../../lib/redis.js";

export async function setupQueueEvents(): Promise<QueueEvents> {
  const queueEvents = new QueueEvents(GENERATION_QUEUE_NAME, {
    connection: createRedisConnection()
  });

  await queueEvents.waitUntilReady();

  queueEvents.on("progress", async ({ jobId }) => {
    if (!jobId) return;
    const event = await getStatusEvent(jobId);
    if (event) {
      emitAssignmentStatus(event);
    }
  });

  queueEvents.on("completed", async ({ jobId }) => {
    if (!jobId) return;
    const event = await getStatusEvent(jobId);
    if (event) {
      emitAssignmentStatus(event);
    }
  });

  queueEvents.on("failed", async ({ jobId, failedReason }) => {
    if (!jobId) return;

    await setAssignmentStatus(jobId, "failed", {
      errorMessage: failedReason
    });

    const event =
      (await getStatusEvent(jobId)) ??
      ({
        assignmentId: jobId,
        status: "failed",
        errorMessage: failedReason,
        updatedAt: new Date().toISOString()
      } as const);

    emitAssignmentStatus(event);
  });

  return queueEvents;
}
