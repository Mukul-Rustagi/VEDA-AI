import type { Request, Response } from "express";
import { toolkitRequestSchema } from "@vedaai/shared";

import { generateToolkitContent } from "./toolkit.service.js";

export async function generateToolkitContentHandler(
  req: Request,
  res: Response
): Promise<void> {
  const payload = toolkitRequestSchema.parse(req.body);
  const data = await generateToolkitContent(payload);
  res.json({ data });
}
