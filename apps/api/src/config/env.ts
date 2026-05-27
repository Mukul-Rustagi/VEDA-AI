import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

import { config } from "dotenv";
import { z } from "zod";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(moduleDir, "..", "..");
const repoRoot = path.resolve(apiRoot, "..", "..");

const explicitEnvPath = process.env.ENV_FILE;
const candidateEnvPaths = [
  explicitEnvPath,
  path.resolve(process.cwd(), ".env"),
  path.resolve(apiRoot, ".env"),
  path.resolve(repoRoot, ".env")
].filter((value): value is string => typeof value === "string" && value.length > 0);

for (const envPath of candidateEnvPaths) {
  if (existsSync(envPath)) {
    config({ path: envPath });
    break;
  }
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  CLIENT_URL: z.string().url().default("http://localhost:3000"),
  CORS_ORIGINS: z.string().optional(),
  MONGODB_URI: z.string().min(1),
  REDIS_URL: z.string().min(1),
  QUEUE_MODE: z.enum(["auto", "enabled", "disabled"]).default("auto"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  UPLOADS_DIR: z.string().default("./apps/api/uploads")
});

export const env = envSchema.parse(process.env);
