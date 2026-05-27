"use client";

import type { AssignmentSummary } from "@vedaai/shared";
import { EllipsisVertical } from "lucide-react";
import { useState } from "react";

import { formatDate } from "@/lib/format";

interface AssignmentCardProps {
  assignment: AssignmentSummary;
  onOpen: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}

export function AssignmentCard({
  assignment,
  onOpen,
  onDelete
}: AssignmentCardProps): JSX.Element {
  const [openMenu, setOpenMenu] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <article className="assignmentCard">
      <div className="assignmentCardHead">
        <h3>{assignment.title}</h3>
        <button
          className="plainIconBtn"
          onClick={() => setOpenMenu((current) => !current)}
          aria-label="Open assignment actions"
        >
          <EllipsisVertical size={16} />
        </button>
        {openMenu ? (
          <div className="assignmentMenu">
            <button
              onClick={() => {
                setOpenMenu(false);
                onOpen(assignment.id);
              }}
            >
              View Assignment
            </button>
            <button
              className="dangerAction"
              disabled={busy}
              onClick={async () => {
                const confirmed = window.confirm(
                  "Delete this assignment permanently?"
                );
                if (!confirmed) {
                  setOpenMenu(false);
                  return;
                }

                setBusy(true);
                try {
                  await onDelete(assignment.id);
                } finally {
                  setBusy(false);
                  setOpenMenu(false);
                }
              }}
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>

      <div className="assignmentMeta">
        <p>
          <strong>Assigned on:</strong> {formatDate(assignment.createdAt)}
        </p>
        <p>
          <strong>Due:</strong> {formatDate(assignment.dueDate)}
        </p>
      </div>

      {assignment.errorMessage ? (
        <p className="inlineError">{assignment.errorMessage}</p>
      ) : null}
    </article>
  );
}
