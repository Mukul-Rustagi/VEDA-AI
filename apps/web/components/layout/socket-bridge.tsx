"use client";

import { assignmentStatusEventSchema } from "@vedaai/shared";
import { useEffect } from "react";

import { getSocketClient } from "@/lib/socket";
import { useAssignmentStore } from "@/store/use-assignment-store";

export function SocketBridge(): null {
  const applyStatusEvent = useAssignmentStore((state) => state.applyStatusEvent);

  useEffect(() => {
    const socket = getSocketClient();
    const handler = (payload: unknown): void => {
      const parsed = assignmentStatusEventSchema.safeParse(payload);
      if (!parsed.success) return;
      applyStatusEvent(parsed.data);
    };

    socket.on("assignment:updated", handler);

    return () => {
      socket.off("assignment:updated", handler);
    };
  }, [applyStatusEvent]);

  return null;
}
