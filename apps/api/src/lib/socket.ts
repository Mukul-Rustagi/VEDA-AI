import type { Server as HttpServer } from "node:http";

import type { AssignmentStatusEvent } from "@vedaai/shared";
import { Server } from "socket.io";

let io: Server | null = null;

function getRoom(assignmentId: string): string {
  return `assignment:${assignmentId}`;
}

export function initializeSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.on("assignment:subscribe", (assignmentId: string) => {
      if (typeof assignmentId === "string" && assignmentId.trim().length > 0) {
        socket.join(getRoom(assignmentId));
      }
    });

    socket.on("assignment:unsubscribe", (assignmentId: string) => {
      if (typeof assignmentId === "string" && assignmentId.trim().length > 0) {
        socket.leave(getRoom(assignmentId));
      }
    });
  });

  return io;
}

export function emitAssignmentStatus(event: AssignmentStatusEvent): void {
  if (!io) return;
  io.emit("assignment:updated", event);
  io.to(getRoom(event.assignmentId)).emit("assignment:updated", event);
}
