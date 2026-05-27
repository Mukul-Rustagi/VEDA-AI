import { z } from "zod";

import {
  ASSIGNMENT_STATUS,
  DIFFICULTY_OPTIONS,
  QUESTION_TYPE_OPTIONS,
  TOOLKIT_MODE_OPTIONS
} from "./constants";

const nonEmptyTrimmedString = z
  .string()
  .trim()
  .min(1, "This field is required");

const positiveInt = z
  .number({ coerce: true })
  .int("Must be a whole number")
  .positive("Must be greater than 0");

export const questionTypeSchema = z.object({
  id: nonEmptyTrimmedString,
  type: z.enum(QUESTION_TYPE_OPTIONS),
  questionCount: positiveInt,
  marksPerQuestion: positiveInt
});

export const assignmentInputSchema = z.object({
  title: nonEmptyTrimmedString.max(120),
  subject: nonEmptyTrimmedString.max(80),
  className: nonEmptyTrimmedString.max(60),
  dueDate: z.string().date(),
  questionTypes: z
    .array(questionTypeSchema)
    .min(1, "At least one question type is required"),
  additionalInstructions: z.string().max(1000).default(""),
  materialText: z.string().max(30000).optional().default(""),
  materialFileName: z.string().optional()
});

export const difficultySchema = z.enum(DIFFICULTY_OPTIONS);

export const generatedQuestionSchema = z.object({
  id: nonEmptyTrimmedString,
  text: nonEmptyTrimmedString,
  difficulty: difficultySchema,
  marks: positiveInt
});

export const generatedSectionSchema = z.object({
  id: nonEmptyTrimmedString,
  title: nonEmptyTrimmedString,
  instruction: nonEmptyTrimmedString,
  questions: z.array(generatedQuestionSchema).min(1)
});

export const generatedPaperSchema = z.object({
  title: nonEmptyTrimmedString,
  schoolName: nonEmptyTrimmedString.default("Delhi Public School"),
  schoolAddress: nonEmptyTrimmedString.default("Bokaro Steel City"),
  subject: nonEmptyTrimmedString,
  className: nonEmptyTrimmedString,
  durationMinutes: positiveInt.default(45),
  maxMarks: positiveInt,
  generalInstructions: z.array(nonEmptyTrimmedString).default([]),
  sections: z.array(generatedSectionSchema).min(1),
  answerKey: z.array(nonEmptyTrimmedString).default([])
});

export const assignmentStatusSchema = z.enum(ASSIGNMENT_STATUS);

export const assignmentSummarySchema = z.object({
  id: nonEmptyTrimmedString,
  title: nonEmptyTrimmedString,
  subject: nonEmptyTrimmedString,
  className: nonEmptyTrimmedString,
  dueDate: z.string(),
  createdAt: z.string(),
  status: assignmentStatusSchema,
  totalQuestions: positiveInt,
  totalMarks: positiveInt,
  errorMessage: z.string().optional()
});

export const assignmentDetailSchema = assignmentSummarySchema.extend({
  questionTypes: z.array(questionTypeSchema),
  additionalInstructions: z.string().default(""),
  paper: generatedPaperSchema.optional()
});

export const assignmentStatusEventSchema = z.object({
  assignmentId: nonEmptyTrimmedString,
  status: assignmentStatusSchema,
  errorMessage: z.string().optional(),
  updatedAt: z.string()
});

export const toolkitModeSchema = z.enum(TOOLKIT_MODE_OPTIONS);

export const toolkitRequestSchema = z.object({
  mode: toolkitModeSchema,
  topic: nonEmptyTrimmedString.max(120),
  subject: nonEmptyTrimmedString.max(80),
  className: nonEmptyTrimmedString.max(60),
  objective: z.string().trim().max(200).optional().default(""),
  context: z.string().trim().max(1000).optional().default(""),
  questionCount: z
    .number({ coerce: true })
    .int("Must be a whole number")
    .min(3, "Minimum 3 questions")
    .max(12, "Maximum 12 questions")
    .default(5)
});

export const toolkitSectionSchema = z.object({
  id: nonEmptyTrimmedString,
  title: nonEmptyTrimmedString,
  items: z.array(nonEmptyTrimmedString).min(1)
});

export const toolkitResponseSchema = z.object({
  mode: toolkitModeSchema,
  heading: nonEmptyTrimmedString,
  summary: nonEmptyTrimmedString,
  sections: z.array(toolkitSectionSchema).min(1),
  teacherTips: z.array(nonEmptyTrimmedString).default([])
});

export type QuestionTypeInput = z.infer<typeof questionTypeSchema>;
export type AssignmentInput = z.infer<typeof assignmentInputSchema>;
export type Difficulty = z.infer<typeof difficultySchema>;
export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
export type GeneratedSection = z.infer<typeof generatedSectionSchema>;
export type GeneratedPaper = z.infer<typeof generatedPaperSchema>;
export type AssignmentStatus = z.infer<typeof assignmentStatusSchema>;
export type AssignmentSummary = z.infer<typeof assignmentSummarySchema>;
export type AssignmentDetail = z.infer<typeof assignmentDetailSchema>;
export type AssignmentStatusEvent = z.infer<typeof assignmentStatusEventSchema>;
export type ToolkitMode = z.infer<typeof toolkitModeSchema>;
export type ToolkitRequest = z.infer<typeof toolkitRequestSchema>;
export type ToolkitSection = z.infer<typeof toolkitSectionSchema>;
export type ToolkitResponse = z.infer<typeof toolkitResponseSchema>;
