import type {
  AssignmentDetail,
  AssignmentSummary,
  ToolkitRequest,
  ToolkitResponse
} from "@vedaai/shared";
import {
  assignmentDetailSchema,
  assignmentSummarySchema,
  toolkitResponseSchema
} from "@vedaai/shared";

import { API_BASE_URL } from "./env";

class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface ApiEnvelope<T> {
  data: T;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | { message?: string }
    | null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      body && "message" in body && typeof body.message === "string"
        ? body.message
        : "Request failed"
    );
  }

  if (!body || typeof body !== "object" || !("data" in body)) {
    throw new ApiError(500, "Unexpected server response");
  }

  return body.data;
}

export async function fetchAssignments(): Promise<AssignmentSummary[]> {
  const response = await fetch(`${API_BASE_URL}/assignments`, {
    cache: "no-store"
  });
  const data = await parseResponse<unknown[]>(response);
  return data.map((item) => assignmentSummarySchema.parse(item));
}

export async function fetchAssignmentById(id: string): Promise<AssignmentDetail> {
  const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
    cache: "no-store"
  });
  const data = await parseResponse<unknown>(response);
  return assignmentDetailSchema.parse(data);
}

interface CreateAssignmentPayload {
  title: string;
  subject: string;
  className: string;
  dueDate: string;
  additionalInstructions: string;
  materialText?: string;
  questionTypes: string;
  materialFile?: File;
}

export async function createAssignment(
  payload: CreateAssignmentPayload
): Promise<AssignmentSummary> {
  const formData = new FormData();
  formData.set("title", payload.title);
  formData.set("subject", payload.subject);
  formData.set("className", payload.className);
  formData.set("dueDate", payload.dueDate);
  formData.set("additionalInstructions", payload.additionalInstructions);
  formData.set("questionTypes", payload.questionTypes);

  if (payload.materialText) {
    formData.set("materialText", payload.materialText);
  }

  if (payload.materialFile) {
    formData.set("materialFile", payload.materialFile);
  }

  const response = await fetch(`${API_BASE_URL}/assignments`, {
    method: "POST",
    body: formData
  });
  const data = await parseResponse<unknown>(response);
  return assignmentSummarySchema.parse(data);
}

export async function regenerateAssignment(id: string): Promise<AssignmentSummary> {
  const response = await fetch(`${API_BASE_URL}/assignments/${id}/regenerate`, {
    method: "POST"
  });
  const data = await parseResponse<unknown>(response);
  return assignmentSummarySchema.parse(data);
}

export async function deleteAssignment(
  id: string
): Promise<{
  id: string;
}> {
  const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
    method: "DELETE"
  });
  const data = await parseResponse<{ id: string }>(response);
  return data;
}

interface PdfExportStatus {
  status: "queued" | "ready";
  downloadPath: string;
}

export async function queueAssignmentPdf(id: string): Promise<PdfExportStatus> {
  const response = await fetch(`${API_BASE_URL}/assignments/${id}/pdf`, {
    method: "POST"
  });
  return parseResponse<PdfExportStatus>(response);
}

export async function downloadAssignmentPdf(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/assignments/${id}/pdf/download`);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new ApiError(
      response.status,
      body?.message ?? "Unable to download generated PDF"
    );
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const disposition = response.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename="([^"]+)"/i);
  const filename = match?.[1] ?? `assignment-${id}.pdf`;

  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}

export async function generateToolkitContent(
  payload: ToolkitRequest
): Promise<ToolkitResponse> {
  const response = await fetch(`${API_BASE_URL}/toolkit/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await parseResponse<unknown>(response);
  return toolkitResponseSchema.parse(data);
}

export { ApiError };
