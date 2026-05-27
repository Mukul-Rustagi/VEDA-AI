"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { QUESTION_TYPE_OPTIONS } from "@vedaai/shared";
import { ArrowLeft, ArrowRight, CirclePlus, Minus, Plus, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { createAssignment } from "@/lib/api";
import { useAssignmentStore } from "@/store/use-assignment-store";

const rowSchema = z.object({
  id: z.string().min(1),
  type: z.enum(QUESTION_TYPE_OPTIONS),
  questionCount: z.coerce.number().int().min(1).max(100),
  marksPerQuestion: z.coerce.number().int().min(1).max(100)
});

const formSchema = z.object({
  title: z.string().trim().min(1, "Assignment name is required").max(120),
  subject: z.string().trim().min(2).max(80),
  className: z.string().trim().min(1).max(60),
  dueDate: z.string().date(),
  materialText: z.string().max(30000).optional().default(""),
  additionalInstructions: z.string().max(1000).optional().default(""),
  questionTypes: z.array(rowSchema).min(1)
});

type FormValues = z.infer<typeof formSchema>;

function defaultRow(type: (typeof QUESTION_TYPE_OPTIONS)[number]): FormValues["questionTypes"][number] {
  return {
    id: crypto.randomUUID(),
    type,
    questionCount: 4,
    marksPerQuestion: 1
  };
}

export function AssignmentForm(): JSX.Element {
  const router = useRouter();
  const upsertAssignment = useAssignmentStore((state) => state.upsertAssignment);
  const [file, setFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      subject: "Science",
      className: "5th",
      dueDate: "",
      materialText: "",
      additionalInstructions: "",
      questionTypes: [
        defaultRow("Multiple Choice Questions"),
        {
          ...defaultRow("Short Questions"),
          questionCount: 3,
          marksPerQuestion: 2
        },
        {
          ...defaultRow("Diagram/Graph-Based Questions"),
          questionCount: 5,
          marksPerQuestion: 5
        },
        {
          ...defaultRow("Numerical Problems"),
          questionCount: 5,
          marksPerQuestion: 5
        }
      ]
    }
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "questionTypes"
  });

  const rows = useWatch({
    control: form.control,
    name: "questionTypes"
  }) as FormValues["questionTypes"];
  const dueDateValue = useWatch({
    control: form.control,
    name: "dueDate"
  });
  const additionalInstructionsValue = useWatch({
    control: form.control,
    name: "additionalInstructions"
  });

  const totals = useMemo(() => {
    return (rows ?? []).reduce(
      (acc: { totalQuestions: number; totalMarks: number }, row) => {
        acc.totalQuestions += Number(row.questionCount);
        acc.totalMarks += Number(row.questionCount) * Number(row.marksPerQuestion);
        return acc;
      },
      { totalQuestions: 0, totalMarks: 0 }
    );
  }, [rows]);

  const progressPercent = useMemo(() => {
    const questionSetupReady =
      (rows ?? []).length > 0 &&
      (rows ?? []).every(
        (row) =>
          Number.isFinite(Number(row.questionCount)) &&
          Number(row.questionCount) > 0 &&
          Number.isFinite(Number(row.marksPerQuestion)) &&
          Number(row.marksPerQuestion) > 0
      );
    const dueDateReady = typeof dueDateValue === "string" && dueDateValue.length > 0;
    const optionalContextReady =
      (additionalInstructionsValue ?? "").trim().length > 0 || Boolean(file);

    let score = 0;
    if (questionSetupReady) score += 50;
    if (dueDateReady) score += 30;
    if (optionalContextReady) score += 20;
    return Math.min(100, Math.max(0, score));
  }, [additionalInstructionsValue, dueDateValue, file, rows]);

  const submitting = form.formState.isSubmitting;

  async function onSubmit(values: FormValues): Promise<void> {
    setSubmitError(null);
    try {
      const summary = await createAssignment({
        title: values.title,
        subject: values.subject,
        className: values.className,
        dueDate: values.dueDate,
        additionalInstructions: values.additionalInstructions ?? "",
        materialText: values.materialText ?? "",
        questionTypes: JSON.stringify(values.questionTypes),
        materialFile: file ?? undefined
      });

      upsertAssignment(summary);
      router.push("/assignments");
      router.refresh();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to create assignment"
      );
    }
  }

  return (
    <form className="assignmentForm" onSubmit={form.handleSubmit(onSubmit)}>
      <input type="hidden" {...form.register("subject")} />
      <input type="hidden" {...form.register("className")} />
      <input type="hidden" {...form.register("materialText")} />

      <div className="assignmentIntro">
        <div className="assignmentIntroTitle">
          <span className="assignmentIntroDot" aria-hidden="true" />
          <div>
            <h2>Create Assignment</h2>
            <p>Set up a new assignment for your students</p>
          </div>
        </div>
        <div
          className="assignmentProgress"
          role="progressbar"
          aria-label="Assignment form completion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
        >
          <span
            className="active"
            style={{
              flexGrow: progressPercent,
              flexBasis: 0
            }}
          />
          <span
            style={{
              flexGrow: Math.max(8, 100 - progressPercent),
              flexBasis: 0
            }}
          />
        </div>
      </div>

      <section className="assignmentDetailsCard">
        <div className="assignmentDetailsHead">
          <h3>Assignment Details</h3>
          <p>Basic information about your assignment</p>
        </div>
        <label className="assignmentDueField">
          <span>Assignment Name *</span>
          <input
            type="text"
            {...form.register("title")}
            placeholder="Enter assignment name"
            required
          />
        </label>
        {form.formState.errors.title ? (
          <p className="inlineError">
            {form.formState.errors.title.message ?? "Assignment name is required."}
          </p>
        ) : null}
        <div
          className="uploadDropzone"
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <Upload size={18} />
          <p>{file ? file.name : "Choose a file or drag & drop it here"}</p>
          <span>PDF or TXT, up to 10MB</span>
          <button type="button" className="secondaryBtn">
            Browse Files
          </button>
        </div>
        <p className="assignmentUploadHint">
          Upload source material in PDF or plain text format
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          hidden
          onChange={(event) => {
            const selected = event.target.files?.[0] ?? null;
            setFile(selected);
          }}
        />
        <label className="assignmentDueField">
          <span>Due Date</span>
          <input type="date" {...form.register("dueDate")} placeholder="DD-MM-YYYY" />
        </label>
        {form.formState.errors.dueDate ? (
          <p className="inlineError">Please select a valid due date.</p>
        ) : null}

        <div className="questionColumnsHead">
          <span>Question Type</span>
          <span>No. of Questions</span>
          <span>Marks</span>
        </div>
        <div className="questionRows">
          {fields.map((field, index) => {
            const current = form.getValues(`questionTypes.${index}`);
            if (!current) return null;
            return (
              <div className="questionTypeRow" key={field.id}>
                <div className="questionTypeSelectWrap">
                  <select {...form.register(`questionTypes.${index}.type`)}>
                    {QUESTION_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <button
                    className="rowDeleteBtn"
                    type="button"
                    onClick={() => (fields.length > 1 ? remove(index) : undefined)}
                    disabled={fields.length <= 1}
                    aria-label={`Remove ${current.type}`}
                  >
                    x
                  </button>
                </div>

                <div className="stepperGroup">
                  <div className="stepper">
                    <button
                      type="button"
                      onClick={() =>
                        update(index, {
                          ...current,
                          questionCount: Math.max(1, current.questionCount - 1)
                        })
                      }
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      {...form.register(`questionTypes.${index}.questionCount`, {
                        valueAsNumber: true
                      })}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        update(index, {
                          ...current,
                          questionCount: current.questionCount + 1
                        })
                      }
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="stepperGroup">
                  <div className="stepper">
                    <button
                      type="button"
                      onClick={() =>
                        update(index, {
                          ...current,
                          marksPerQuestion: Math.max(1, current.marksPerQuestion - 1)
                        })
                      }
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      {...form.register(`questionTypes.${index}.marksPerQuestion`, {
                        valueAsNumber: true
                      })}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        update(index, {
                          ...current,
                          marksPerQuestion: current.marksPerQuestion + 1
                        })
                      }
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="addRowBtn"
          onClick={() => append(defaultRow("Very Short Questions"))}
        >
          <CirclePlus size={16} />
          Add Question Type
        </button>

        <div className="totalsBar">
          <p>Total Questions: {totals.totalQuestions}</p>
          <p>Total Marks: {totals.totalMarks}</p>
        </div>
        <label className="instructionsField">
          <span>Additional Information (For better output)</span>
          <textarea
            rows={4}
            {...form.register("additionalInstructions")}
            placeholder="e.g Generate a question paper for 3 hour exam duration..."
          />
        </label>
      </section>

      {submitError ? <p className="inlineError">{submitError}</p> : null}

      <div className="formActions">
        <button
          className="secondaryBtn"
          type="button"
          onClick={() => router.push("/assignments")}
        >
          <ArrowLeft size={14} />
          Previous
        </button>
        <button className="primaryAction compact" type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Next"}
          {!submitting ? <ArrowRight size={14} /> : null}
        </button>
      </div>
    </form>
  );
}
