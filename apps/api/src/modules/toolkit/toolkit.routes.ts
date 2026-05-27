import { Router } from "express";

import { asyncHandler } from "../../lib/http.js";
import { generateToolkitContentHandler } from "./toolkit.controller.js";

export const toolkitRouter = Router();

toolkitRouter.post("/generate", asyncHandler(generateToolkitContentHandler));
