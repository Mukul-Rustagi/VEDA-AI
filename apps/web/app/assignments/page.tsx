"use client";

import { Plus, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AssignmentCard } from "@/components/assignments/assignment-card";
import { EmptyAssignmentState } from "@/components/assignments/empty-state";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SocketBridge } from "@/components/layout/socket-bridge";
import { useAssignmentStore } from "@/store/use-assignment-store";

export default function AssignmentsPage(): JSX.Element {
  const router = useRouter();
  const assignments = useAssignmentStore((state) => state.assignments);
  const loading = useAssignmentStore((state) => state.loading);
  const error = useAssignmentStore((state) => state.error);
  const loadAssignments = useAssignmentStore((state) => state.loadAssignments);
  const deleteAssignmentById = useAssignmentStore(
    (state) => state.deleteAssignmentById
  );

  const [query, setQuery] = useState("");

  useEffect(() => {
    loadAssignments().catch(() => undefined);
  }, [loadAssignments]);

  const filteredAssignments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return assignments;
    return assignments.filter((assignment) =>
      `${assignment.title} ${assignment.subject} ${assignment.className}`
        .toLowerCase()
        .includes(normalized)
    );
  }, [assignments, query]);

  const isEmptyState = !loading && assignments.length === 0;

  return (
    <DashboardShell pageTitle="Assignment">
      <SocketBridge />
      {isEmptyState ? (
        <section className="zeroStateCanvas">
          <EmptyAssignmentState />
        </section>
      ) : (
        <section className="panelSection assignmentsPanel">
          <header className="panelHeading">
            <div className="assignmentsHeadingWrap">
              <span className="assignmentsHeadingDot" aria-hidden="true" />
              <div>
              <h2>Assignments</h2>
              <p>Manage and create assignments for your classes.</p>
              </div>
            </div>
          </header>

          <div className="toolbarRow assignmentsToolbar">
            <button className="filterBtn assignmentsFilterBtn" type="button">
              <SlidersHorizontal size={14} />
              Filter By
            </button>
            <div className="searchBox assignmentsSearchBox">
              <Search size={14} />
              <input
                placeholder="Search Assignment"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>

          {loading ? <p className="mutedText">Loading assignments...</p> : null}
          {error ? <p className="mutedText">Could not load from API. Showing local UI.</p> : null}

          <div className="assignmentGrid">
            {filteredAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                onOpen={(id) => router.push(`/assignments/${id}`)}
                onDelete={deleteAssignmentById}
              />
            ))}
          </div>
        </section>
      )}

      <Link
        href="/assignments/new"
        className="desktopCreateBar desktopOnly"
        aria-label="Create assignment"
      >
        <Plus size={14} />
        Create Assignment
      </Link>

      <Link href="/assignments/new" className="fab mobileOnly" aria-label="Create assignment">
        <Plus size={18} />
      </Link>
    </DashboardShell>
  );
}
