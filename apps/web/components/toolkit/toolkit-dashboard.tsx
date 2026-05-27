"use client";

import type { ToolkitMode, ToolkitResponse } from "@vedaai/shared";
import { TOOLKIT_MODE_OPTIONS } from "@vedaai/shared";
import { Bot, LoaderCircle, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { generateToolkitContent } from "@/lib/api";

interface ToolkitFormState {
  mode: ToolkitMode;
  topic: string;
  subject: string;
  className: string;
  objective: string;
  context: string;
  questionCount: number;
}

const MODE_HELP_TEXT: Record<ToolkitMode, string> = {
  "Quick Explainer":
    "Generate concise teaching notes with examples and exit-check prompts.",
  "Practice Questions":
    "Generate a ready-to-use question set with increasing difficulty.",
  "Activity Ideas":
    "Generate interactive classroom activity ideas with execution steps."
};

const INITIAL_STATE: ToolkitFormState = {
  mode: "Quick Explainer",
  topic: "",
  subject: "Science",
  className: "5th",
  objective: "",
  context: "",
  questionCount: 5
};

export function ToolkitDashboard(): JSX.Element {
  const [form, setForm] = useState<ToolkitFormState>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ToolkitResponse | null>(null);

  const modeHelp = useMemo(() => MODE_HELP_TEXT[form.mode], [form.mode]);
  const isPracticeMode = form.mode === "Practice Questions";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);

    if (!form.topic.trim()) {
      setError("Please enter a topic.");
      return;
    }

    if (!form.subject.trim() || !form.className.trim()) {
      setError("Please enter both subject and class.");
      return;
    }

    setLoading(true);

    try {
      const data = await generateToolkitContent({
        mode: form.mode,
        topic: form.topic.trim(),
        subject: form.subject.trim(),
        className: form.className.trim(),
        objective: form.objective.trim(),
        context: form.context.trim(),
        questionCount: form.questionCount
      });

      setResult(data);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to generate toolkit output"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panelSection toolkitPanel">
      <header className="panelHeading">
        <div className="assignmentsHeadingWrap">
          <span className="assignmentsHeadingDot" aria-hidden="true" />
          <div>
            <h2>AI Teacher&apos;s Toolkit</h2>
            <p>Generate explainers, activities, and practice sets instantly.</p>
          </div>
        </div>
      </header>

      <div className="toolkitGrid">
        <form className="toolkitFormCard" onSubmit={handleSubmit}>
          <label className="toolkitField">
            <span>Toolkit Mode</span>
            <select
              value={form.mode}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  mode: event.target.value as ToolkitMode
                }))
              }
            >
              {TOOLKIT_MODE_OPTIONS.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </label>

          <p className="toolkitModeHelp">{modeHelp}</p>

          <div className="toolkitMetaGrid">
            <label className="toolkitField">
              <span>Subject</span>
              <input
                value={form.subject}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, subject: event.target.value }))
                }
                placeholder="Science"
                maxLength={80}
              />
            </label>
            <label className="toolkitField">
              <span>Class</span>
              <input
                value={form.className}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, className: event.target.value }))
                }
                placeholder="5th"
                maxLength={60}
              />
            </label>
          </div>

          <label className="toolkitField">
            <span>Topic</span>
            <input
              value={form.topic}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, topic: event.target.value }))
              }
              placeholder="e.g., Chemical Effects of Electric Current"
              maxLength={120}
              required
            />
          </label>

          <label className="toolkitField">
            <span>Learning Objective (optional)</span>
            <input
              value={form.objective}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, objective: event.target.value }))
              }
              placeholder="What should students learn by end of class?"
              maxLength={200}
            />
          </label>

          <label className="toolkitField">
            <span>Additional Context (optional)</span>
            <textarea
              rows={3}
              value={form.context}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, context: event.target.value }))
              }
              placeholder="Mention syllabus constraints, class level, or preferred format"
              maxLength={1000}
            />
          </label>

          <label className="toolkitField">
            <span>Question Count</span>
            <input
              type="number"
              min={3}
              max={12}
              value={form.questionCount}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  questionCount: Math.min(
                    12,
                    Math.max(3, Number(event.target.value) || 5)
                  )
                }))
              }
              disabled={!isPracticeMode}
            />
          </label>

          {error ? <p className="inlineError">{error}</p> : null}

          <div className="toolkitFormActions">
            <button className="primaryAction compact" type="submit" disabled={loading}>
              {loading ? <LoaderCircle size={14} /> : <Sparkles size={14} />}
              {loading ? "Generating..." : "Generate Toolkit Output"}
            </button>
          </div>
        </form>

        <article className="toolkitOutputCard">
          {result ? (
            <>
              <div className="toolkitOutputHead">
                <h3>{result.heading}</h3>
                <p>{result.summary}</p>
              </div>

              <div className="toolkitSections">
                {result.sections.map((section) => (
                  <section className="toolkitSectionCard" key={section.id}>
                    <h4>{section.title}</h4>
                    <ul>
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>

              {result.teacherTips.length > 0 ? (
                <section className="toolkitTipsCard">
                  <h4>Teacher Tips</h4>
                  <ul>
                    {result.teacherTips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          ) : (
            <div className="toolkitEmptyState">
              <Bot size={18} />
              <h3>No output yet</h3>
              <p>Fill the form and generate AI content for your classroom workflow.</p>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
