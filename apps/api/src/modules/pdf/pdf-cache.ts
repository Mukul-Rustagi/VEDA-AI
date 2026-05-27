import { appRedis } from "../../lib/redis.js";

const PDF_CACHE_PREFIX = "assignment:pdf:v1:";
const PDF_CACHE_TTL_SECONDS = 60 * 60 * 6;

function getPdfCacheKey(assignmentId: string): string {
  return `${PDF_CACHE_PREFIX}${assignmentId}`;
}

export async function getCachedPdfBuffer(
  assignmentId: string
): Promise<Buffer | null> {
  const encoded = await appRedis.get(getPdfCacheKey(assignmentId));
  if (!encoded) return null;

  try {
    return Buffer.from(encoded, "base64");
  } catch {
    await appRedis.del(getPdfCacheKey(assignmentId));
    return null;
  }
}

export async function cachePdfBuffer(
  assignmentId: string,
  pdfBuffer: Buffer
): Promise<void> {
  await appRedis.set(
    getPdfCacheKey(assignmentId),
    pdfBuffer.toString("base64"),
    "EX",
    PDF_CACHE_TTL_SECONDS
  );
}

export async function clearCachedPdf(assignmentId: string): Promise<void> {
  await appRedis.del(getPdfCacheKey(assignmentId));
}
