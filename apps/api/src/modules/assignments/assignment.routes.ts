import { Router } from "express";

import { asyncHandler } from "../../lib/http.js";
import {
  createAssignmentHandler,
  deleteAssignmentHandler,
  downloadAssignmentPdfHandler,
  getAssignmentHandler,
  listAssignmentsHandler,
  queueAssignmentPdfHandler,
  regenerateAssignmentHandler,
  uploadAssignmentMaterial
} from "./assignment.controller.js";

export const assignmentRouter = Router();

assignmentRouter.get("/", asyncHandler(listAssignmentsHandler));
assignmentRouter.get("/:id", asyncHandler(getAssignmentHandler));
assignmentRouter.post(
  "/",
  uploadAssignmentMaterial,
  asyncHandler(createAssignmentHandler)
);
assignmentRouter.post(
  "/:id/regenerate",
  asyncHandler(regenerateAssignmentHandler)
);
assignmentRouter.post("/:id/pdf", asyncHandler(queueAssignmentPdfHandler));
assignmentRouter.get("/:id/pdf/download", asyncHandler(downloadAssignmentPdfHandler));
assignmentRouter.delete("/:id", asyncHandler(deleteAssignmentHandler));
