import dayjs from "dayjs";

export function formatDate(value: string): string {
  return dayjs(value).format("DD-MM-YYYY");
}

export function formatStatus(status: string): string {
  if (status === "ready") return "Ready";
  if (status === "queued") return "Queued";
  if (status === "generating") return "Generating";
  if (status === "failed") return "Failed";
  return "Draft";
}
