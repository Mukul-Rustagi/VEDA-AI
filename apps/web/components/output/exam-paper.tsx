"use client";

import type { AssignmentDetail } from "@vedaai/shared";
import clsx from "clsx";
import { AlertCircle, Download, RotateCcw } from "lucide-react";
import { useState } from "react";

import { downloadAssignmentPdf, queueAssignmentPdf } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface ExamPaperProps {
  assignment: AssignmentDetail;
  onRegenerate: (assignmentId: string) => Promise<void>;
}

export function ExamPaper({
  assignment,
  onRegenerate
}: ExamPaperProps): JSX.Element {
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  async function handleDownloadPdf(): Promise<void> {
    if (pdfBusy) return;
    setPdfError(null);
    setPdfBusy(true);

    try {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const result = await queueAssignmentPdf(assignment.id);
        if (result.status === "ready") {
          await downloadAssignmentPdf(assignment.id);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      throw new Error("PDF generation is taking longer than expected.");
    } catch (error) {
      setPdfError(error instanceof Error ? error.message : "Unable to generate PDF");
    } finally {
      setPdfBusy(false);
    }
  }

  if (assignment.status !== "ready" || !assignment.paper) {
    return (
      <section className="paperPendingCard">
        <AlertCircle size={18} />
        <div>
          <h3>Paper is {assignment.status}</h3>
          <p>
            We are preparing a structured question paper. You will see live updates
            once generation is complete.
          </p>
        </div>
      </section>
    );
  }

  const paper = assignment.paper;

  return (
    <div className="paperWrapper">
      <div className="outputActionBar">
        <div>
          <h2>{assignment.title}</h2>
          <p>
            Due date: {formatDate(assignment.dueDate)} | Class {assignment.className}
          </p>
        </div>
        <div className="actionBtns">
          <button
            className="secondaryBtn"
            onClick={() => onRegenerate(assignment.id)}
            type="button"
          >
            <RotateCcw size={14} />
            Regenerate
          </button>
          <button
            className="secondaryBtn"
            type="button"
            onClick={() => {
              handleDownloadPdf().catch(() => undefined);
            }}
            disabled={pdfBusy}
          >
            <Download size={14} />
            {pdfBusy ? "Preparing PDF..." : "Download PDF"}
          </button>
        </div>
      </div>
      {pdfError ? <p className="inlineError">{pdfError}</p> : null}

      <article className="examPaper">
        <header className="examHeader">
          <h1>{paper.schoolName}</h1>
          <p>{paper.schoolAddress}</p>
          <h2>{paper.title}</h2>
          <p>
            Subject: {paper.subject} | Class: {paper.className}
          </p>
        </header>

        <div className="studentInfoGrid">
          <div className="studentInfoField">
            <span className="studentInfoLabel">Name:</span>
            <span className="studentInfoLine" />
          </div>
          <div className="studentInfoField">
            <span className="studentInfoLabel">Roll Number:</span>
            <span className="studentInfoLine" />
          </div>
          <div className="studentInfoField">
            <span className="studentInfoLabel">Section:</span>
            <span className="studentInfoLine" />
          </div>
        </div>

        <div className="examMeta">
          <p>Time Allowed: {paper.durationMinutes} minutes</p>
          <p>Maximum Marks: {paper.maxMarks}</p>
        </div>

        <section className="instructionBlock">
          <h3>General Instructions</h3>
          <ol>
            {paper.generalInstructions.map((instruction, index) => (
              <li key={`${instruction}-${index}`}>{instruction}</li>
            ))}
          </ol>
        </section>

        {paper.sections.map((section) => (
          <section key={section.id} className="paperSection">
            <h3>{section.title}</h3>
            <p>{section.instruction}</p>
            <ol>
              {section.questions.map((question) => (
                <li key={question.id}>
                  <div className="paperQuestionRow">
                    <span>{question.text}</span>
                    <div className="paperQuestionMeta">
                      <span
                        className={clsx("difficultyBadge", {
                          easy: question.difficulty === "easy",
                          medium: question.difficulty === "medium",
                          hard: question.difficulty === "hard"
                        })}
                      >
                        {question.difficulty}
                      </span>
                      <strong>[{question.marks} Marks]</strong>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}

        <section className="instructionBlock">
          <h3>Answer Key</h3>
          <ol>
            {paper.answerKey.map((answer, index) => (
              <li key={`${answer}-${index}`}>{answer}</li>
            ))}
          </ol>
        </section>
      </article>
    </div>
  );
}
