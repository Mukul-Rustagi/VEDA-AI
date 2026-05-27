import type { AssignmentStatus, GeneratedPaper, QuestionTypeInput } from "@vedaai/shared";
import { ASSIGNMENT_STATUS, QUESTION_TYPE_OPTIONS } from "@vedaai/shared";
import { Schema, model } from "mongoose";

interface AssignmentMaterial {
  fileName?: string;
  extractedText?: string;
}

export interface AssignmentDocument {
  title: string;
  subject: string;
  className: string;
  dueDate: Date;
  questionTypes: QuestionTypeInput[];
  additionalInstructions: string;
  status: AssignmentStatus;
  material: AssignmentMaterial;
  totalQuestions: number;
  totalMarks: number;
  errorMessage?: string;
  paper?: GeneratedPaper;
  createdAt: Date;
  updatedAt: Date;
}

const questionTypeSchema = new Schema<QuestionTypeInput>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: QUESTION_TYPE_OPTIONS
    },
    questionCount: { type: Number, required: true, min: 1 },
    marksPerQuestion: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const assignmentSchema = new Schema<AssignmentDocument>(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    className: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    questionTypes: { type: [questionTypeSchema], required: true },
    additionalInstructions: { type: String, default: "" },
    status: {
      type: String,
      required: true,
      enum: ASSIGNMENT_STATUS,
      default: "queued"
    },
    material: {
      fileName: { type: String },
      extractedText: { type: String, default: "" }
    },
    totalQuestions: { type: Number, required: true, min: 1 },
    totalMarks: { type: Number, required: true, min: 1 },
    errorMessage: { type: String },
    paper: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true
  }
);

assignmentSchema.index({ createdAt: -1 });
assignmentSchema.index({ status: 1, createdAt: -1 });

export const AssignmentModel = model<AssignmentDocument>(
  "Assignment",
  assignmentSchema
);
