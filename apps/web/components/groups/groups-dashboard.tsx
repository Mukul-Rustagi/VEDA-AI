"use client";

import dayjs from "dayjs";
import {
  ArrowRight,
  CalendarClock,
  GraduationCap,
  Plus,
  Search,
  SlidersHorizontal,
  Users2
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAssignmentStore } from "@/store/use-assignment-store";

type GroupStage = "Primary" | "Middle";

interface GroupItem {
  id: string;
  name: string;
  section: string;
  grade: string;
  stage: GroupStage;
  subject: string;
  students: number;
  mentor: string;
  nextClassOn: string;
}

const GROUPS: GroupItem[] = [
  {
    id: "g-5a-sci",
    name: "Class 5A - Science",
    section: "A",
    grade: "5",
    stage: "Primary",
    subject: "Science",
    students: 38,
    mentor: "Ritika Sharma",
    nextClassOn: dayjs().add(1, "day").toISOString()
  },
  {
    id: "g-5b-sci",
    name: "Class 5B - Science",
    section: "B",
    grade: "5",
    stage: "Primary",
    subject: "Science",
    students: 36,
    mentor: "Aman Verma",
    nextClassOn: dayjs().add(2, "day").toISOString()
  },
  {
    id: "g-6a-math",
    name: "Class 6A - Mathematics",
    section: "A",
    grade: "6",
    stage: "Middle",
    subject: "Mathematics",
    students: 34,
    mentor: "Pooja Singh",
    nextClassOn: dayjs().add(1, "day").toISOString()
  },
  {
    id: "g-6b-math",
    name: "Class 6B - Mathematics",
    section: "B",
    grade: "6",
    stage: "Middle",
    subject: "Mathematics",
    students: 35,
    mentor: "Harsh Joshi",
    nextClassOn: dayjs().add(3, "day").toISOString()
  },
  {
    id: "g-7a-eng",
    name: "Class 7A - English",
    section: "A",
    grade: "7",
    stage: "Middle",
    subject: "English",
    students: 32,
    mentor: "Ananya Das",
    nextClassOn: dayjs().add(1, "week").toISOString()
  },
  {
    id: "g-7b-eng",
    name: "Class 7B - English",
    section: "B",
    grade: "7",
    stage: "Middle",
    subject: "English",
    students: 31,
    mentor: "Neha Roy",
    nextClassOn: dayjs().add(5, "day").toISOString()
  }
];

const STAGE_OPTIONS = ["All", "Primary", "Middle"] as const;
type StageFilter = (typeof STAGE_OPTIONS)[number];

function formatNextClass(value: string): string {
  const nextDate = dayjs(value);
  const days = nextDate.startOf("day").diff(dayjs().startOf("day"), "day");
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return nextDate.format("DD MMM");
}

export function GroupsDashboard(): JSX.Element {
  const assignments = useAssignmentStore((state) => state.assignments);
  const loadAssignments = useAssignmentStore((state) => state.loadAssignments);
  const loading = useAssignmentStore((state) => state.loading);

  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<StageFilter>("All");

  useEffect(() => {
    loadAssignments().catch(() => undefined);
  }, [loadAssignments]);

  const totalStudents = useMemo(
    () => GROUPS.reduce((sum, item) => sum + item.students, 0),
    []
  );

  const groupsWithAssignments = useMemo(() => {
    return GROUPS.map((group) => {
      const assignmentCount = assignments.filter(
        (assignment) =>
          assignment.subject.toLowerCase() === group.subject.toLowerCase() &&
          assignment.className.startsWith(group.grade)
      ).length;

      const readyCount = assignments.filter(
        (assignment) =>
          assignment.subject.toLowerCase() === group.subject.toLowerCase() &&
          assignment.className.startsWith(group.grade) &&
          assignment.status === "ready"
      ).length;

      return { ...group, assignmentCount, readyCount };
    });
  }, [assignments]);

  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return groupsWithAssignments.filter((group) => {
      if (stageFilter !== "All" && group.stage !== stageFilter) return false;
      if (!normalized) return true;
      return (
        group.name.toLowerCase().includes(normalized) ||
        group.subject.toLowerCase().includes(normalized) ||
        group.mentor.toLowerCase().includes(normalized)
      );
    });
  }, [groupsWithAssignments, query, stageFilter]);

  return (
    <section className="panelSection groupsPanel">
      <header className="panelHeading">
        <div>
          <h2>My Groups</h2>
          <p>Manage sections, students, and assignment mapping for each class.</p>
        </div>
        <Link className="primaryAction compact desktopOnly" href="/assignments/new">
          <Plus size={14} />
          Create Assignment
        </Link>
      </header>

      <div className="groupsStatsRow">
        <article className="groupsStatCard">
          <Users2 size={15} />
          <div>
            <h4>{GROUPS.length}</h4>
            <p>Total Groups</p>
          </div>
        </article>
        <article className="groupsStatCard">
          <GraduationCap size={15} />
          <div>
            <h4>{totalStudents}</h4>
            <p>Total Students</p>
          </div>
        </article>
        <article className="groupsStatCard">
          <CalendarClock size={15} />
          <div>
            <h4>{assignments.length}</h4>
            <p>Linked Assignments</p>
          </div>
        </article>
      </div>

      <div className="groupsToolbar">
        <div className="groupsStageTabs">
          {STAGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={option === stageFilter ? "active" : ""}
              onClick={() => setStageFilter(option)}
            >
              <SlidersHorizontal size={12} />
              {option}
            </button>
          ))}
        </div>
        <div className="searchBox groupsSearchBox">
          <Search size={14} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search group, subject or mentor"
          />
        </div>
      </div>

      {loading ? <p className="mutedText">Loading groups data...</p> : null}

      <div className="groupsGrid">
        {filteredGroups.map((group) => (
          <article className="groupCard" key={group.id}>
            <div className="groupCardHead">
              <div className="groupAvatar">{`${group.grade}${group.section}`}</div>
              <div>
                <h3>{group.name}</h3>
                <p>
                  {group.subject} · Mentor: {group.mentor}
                </p>
              </div>
              <span className="groupStageBadge">{group.stage}</span>
            </div>

            <div className="groupMetaGrid">
              <div>
                <p className="label">Students</p>
                <p className="value">{group.students}</p>
              </div>
              <div>
                <p className="label">Assignments</p>
                <p className="value">{group.assignmentCount}</p>
              </div>
              <div>
                <p className="label">Ready</p>
                <p className="value">{group.readyCount}</p>
              </div>
              <div>
                <p className="label">Next Class</p>
                <p className="value">{formatNextClass(group.nextClassOn)}</p>
              </div>
            </div>

            <div className="groupCardActions">
              <Link className="secondaryBtn" href="/assignments">
                View Assignments
              </Link>
              <Link className="groupActionLink" href="/assignments/new">
                Assign New <ArrowRight size={13} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
