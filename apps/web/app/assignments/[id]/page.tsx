"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SocketBridge } from "@/components/layout/socket-bridge";
import { ExamPaper } from "@/components/output/exam-paper";
import { getSocketClient } from "@/lib/socket";
import { useAssignmentStore } from "@/store/use-assignment-store";

export default function AssignmentOutputPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const assignmentId = params.id;

  const selectedAssignment = useAssignmentStore(
    (state) => state.selectedAssignment
  );
  const selectedLoading = useAssignmentStore((state) => state.selectedLoading);
  const selectedError = useAssignmentStore((state) => state.selectedError);
  const loadAssignmentById = useAssignmentStore(
    (state) => state.loadAssignmentById
  );
  const triggerRegeneration = useAssignmentStore(
    (state) => state.triggerRegeneration
  );

  useEffect(() => {
    loadAssignmentById(assignmentId).catch(() => undefined);
  }, [assignmentId, loadAssignmentById]);

  useEffect(() => {
    const socket = getSocketClient();
    socket.emit("assignment:subscribe", assignmentId);
    return () => {
      socket.emit("assignment:unsubscribe", assignmentId);
    };
  }, [assignmentId]);

  useEffect(() => {
    if (
      selectedAssignment?.id === assignmentId &&
      selectedAssignment.status === "ready" &&
      !selectedAssignment.paper
    ) {
      loadAssignmentById(assignmentId).catch(() => undefined);
    }
  }, [assignmentId, loadAssignmentById, selectedAssignment]);

  return (
    <DashboardShell pageTitle="Assignment Output">
      <SocketBridge />
      {selectedLoading ? <p className="mutedText">Loading assignment output...</p> : null}
      {selectedError ? <p className="inlineError">{selectedError}</p> : null}

      {selectedAssignment?.id === assignmentId ? (
        <ExamPaper assignment={selectedAssignment} onRegenerate={triggerRegeneration} />
      ) : null}
    </DashboardShell>
  );
}
