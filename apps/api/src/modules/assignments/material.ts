import pdfParse from "pdf-parse";

import { HttpError } from "../../lib/http.js";

export async function extractMaterialText(
  file: Express.Multer.File
): Promise<string> {
  if (!file) return "";

  if (file.mimetype === "text/plain") {
    return file.buffer.toString("utf-8").trim();
  }

  if (file.mimetype === "application/pdf") {
    const parsed = await pdfParse(file.buffer);
    return parsed.text.trim();
  }

  throw new HttpError(
    400,
    "Unsupported file format. Please upload a PDF or text file."
  );
}
