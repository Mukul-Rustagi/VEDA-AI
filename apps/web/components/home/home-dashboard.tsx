"use client";

import dayjs from "dayjs";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
  Plus
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo } from "react";

import { formatDate } from "@/lib/format";
import { useAssignmentStore } from "@/store/use-assignment-store";
import { useUiPrefsStore } from "@/store/use-ui-prefs-store";

function dueLabel(dueDate: string): string {
  const daysDiff = dayjs(dueDate).startOf("day").diff(dayjs().startOf("day"), "day");

  if (daysDiff < 0) return `Overdue by ${Math.abs(daysDiff)} day${Math.abs(daysDiff) > 1 ? "s" : ""}`;
  if (daysDiff === 0) return "Due today";
  if (daysDiff === 1) return "Due tomorrow";
  return `Due in ${daysDiff} days`;
}

export function HomeDashboard(): JSX.Element {
  const assignments = useAssignmentStore((state) => state.assignments);
  const loading = useAssignmentStore((state) => state.loading);
  const error = useAssignmentStore((state) => state.error);
  const loadAssignments = useAssignmentStore((state) => state.loadAssignments);

  const userName = useUiPrefsStore((state) => state.userName);
  const school = useUiPrefsStore((state) => state.school);

  useEffect(() => {
    loadAssignments().catch(() => undefined);
  }, [loadAssignments]);

  const stats = useMemo(() => {
    const total = assignments.length;
    const ready = assignments.filter((item) => item.status === "ready").length;
    const generating = assignments.filter(
      (item) => item.status === "queued" || item.status === "generating"
    ).length;
    const failed = assignments.filter((item) => item.status === "failed").length;
    const dueThisWeek = assignments.filter((item) => {
      const daysDiff = dayjs(item.dueDate).startOf("day").diff(dayjs().startOf("day"), "day");
      return daysDiff >= 0 && daysDiff <= 7;
    }).length;

    return { total, ready, generating, failed, dueThisWeek };
  }, [assignments]);

  const upcoming = useMemo(() => {
    return [...assignments]
      .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf())
      .slice(0, 6);
  }, [assignments]);

  const recent = useMemo(() => {
    return [...assignments]
      .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
      .slice(0, 6);
  }, [assignments]);

  return (
    <section className="panelSection homePanel">
      <header className="panelHeading">
        <div>
          <h2>Home</h2>
          <p>Overview for {school.name}</p>
        </div>
        <Link className="primaryAction compact desktopOnly" href="/assignments/new">
          <Plus size={14} />
          Create Assignment
        </Link>
      </header>

      <div className="homeLayout">
        <section className="homeStrip">
          <div>
            <p className="homeStripEyebrow">{school.location}</p>
            <h3>Welcome back, {userName}</h3>
            <p className="homeStripDate">{dayjs().format("dddd, DD MMMM YYYY")}</p>
          </div>
          <div className="homeStripActions">
            <Link className="secondaryBtn" href="/assignments">
              <ClipboardList size={14} />
              Open Assignments
            </Link>
            <Link className="secondaryBtn" href="/assignments/new">
              <Plus size={14} />
              New Assignment
            </Link>
          </div>
        </section>

        <section className="homeStatsGrid">
          <article className="homeStatCard">
            <div className="homeStatHead">
              <ClipboardList size={16} />
              <span>Total</span>
            </div>
            <h4>{stats.total}</h4>
            <p>All assignments</p>
          </article>

          <article className="homeStatCard">
            <div className="homeStatHead success">
              <CheckCircle2 size={16} />
              <span>Ready</span>
            </div>
            <h4>{stats.ready}</h4>
            <p>Generated successfully</p>
          </article>

          <article className="homeStatCard">
            <div className="homeStatHead warn">
              <LoaderCircle size={16} />
              <span>Processing</span>
            </div>
            <h4>{stats.generating}</h4>
            <p>Queued / generating</p>
          </article>

          <article className="homeStatCard">
            <div className="homeStatHead danger">
              <AlertTriangle size={16} />
              <span>Due Soon</span>
            </div>
            <h4>{stats.dueThisWeek}</h4>
            <p>Within next 7 days</p>
          </article>
        </section>

        <section className="homeSplitGrid">
          <article className="homePane">
            <div className="homePaneHead">
              <h4>Upcoming Deadlines</h4>
              <CalendarClock size={15} />
            </div>

            {loading ? <p className="mutedText">Loading assignments...</p> : null}
            {error ? <p className="inlineError">{error}</p> : null}
            {!loading && upcoming.length === 0 ? (
              <p className="mutedText">No assignments available.</p>
            ) : null}

            <ul className="homeList">
              {upcoming.map((item) => (
                <li key={`upcoming-${item.id}`}>
                  <div>
                    <p className="homeListTitle">{item.title}</p>
                    <p className="homeListSub">
                      Due: {formatDate(item.dueDate)} · {dueLabel(item.dueDate)}
                    </p>
                  </div>
                  <Link className="homeListLink" href={`/assignments/${item.id}`}>
                    View <ArrowRight size={13} />
                  </Link>
                </li>
              ))}
            </ul>
          </article>

          <article className="homePane">
            <div className="homePaneHead">
              <h4>Recent Assignments</h4>
              <ClipboardList size={15} />
            </div>

            {!loading && recent.length === 0 ? (
              <p className="mutedText">No recent activity.</p>
            ) : null}

            <ul className="homeList">
              {recent.map((item) => (
                <li key={`recent-${item.id}`}>
                  <div>
                    <p className="homeListTitle">{item.title}</p>
                    <p className="homeListSub">
                      Assigned: {formatDate(item.createdAt)} · Status:{" "}
                      {item.status === "ready"
                        ? "Ready"
                        : item.status === "failed"
                          ? "Failed"
                          : "In Progress"}
                    </p>
                  </div>
                  <Link className="homeListLink" href={`/assignments/${item.id}`}>
                    Open <ArrowRight size={13} />
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </section>
  );
}
