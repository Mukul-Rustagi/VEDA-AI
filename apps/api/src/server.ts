import { createServer } from "node:http";

import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { connectMongo, disconnectMongo } from "./db/mongoose.js";
import { errorHandler, notFoundHandler } from "./lib/http.js";
import { generationQueue, pdfQueue } from "./lib/queue.js";
import { appRedis } from "./lib/redis.js";
import { initializeSocket } from "./lib/socket.js";
import { assignmentRouter } from "./modules/assignments/assignment.routes.js";
import { setupQueueEvents } from "./modules/jobs/queue-events.js";
import { toolkitRouter } from "./modules/toolkit/toolkit.routes.js";

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, "");
}

function getAllowedOrigins(): Set<string> {
  const origins = new Set<string>([normalizeOrigin(env.CLIENT_URL)]);

  if (env.CORS_ORIGINS) {
    for (const value of env.CORS_ORIGINS.split(",")) {
      const trimmed = value.trim();
      if (trimmed) {
        origins.add(normalizeOrigin(trimmed));
      }
    }
  }

  if (env.NODE_ENV === "development") {
    const localOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3005",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "http://127.0.0.1:3005"
    ];

    for (const origin of localOrigins) {
      origins.add(origin);
    }
  }

  return origins;
}

async function bootstrapServer(): Promise<void> {
  await connectMongo();

  const app = express();
  const allowedOrigins = getAllowedOrigins();

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        if (allowedOrigins.has(normalizeOrigin(origin))) {
          callback(null, true);
          return;
        }

        callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true
    })
  );
  app.use(helmet());
  app.use(morgan("dev"));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      service: "vedaai-api",
      now: new Date().toISOString()
    });
  });

  app.use("/api/assignments", assignmentRouter);
  app.use("/api/toolkit", toolkitRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  const httpServer = createServer(app);
  initializeSocket(httpServer);
  const queueEvents = await setupQueueEvents();

  httpServer.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async (): Promise<void> => {
    await Promise.allSettled([
      queueEvents.close(),
      generationQueue.close(),
      pdfQueue.close(),
      appRedis.quit(),
      disconnectMongo()
    ]);

    httpServer.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrapServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("API boot failed", error);
  process.exit(1);
});
