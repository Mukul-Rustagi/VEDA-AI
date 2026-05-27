import type {
  AssignmentInput,
  GeneratedPaper,
  QuestionTypeInput
} from "@vedaai/shared";
import { generatedPaperSchema } from "@vedaai/shared";
import OpenAI from "openai";

import { env } from "../../config/env.js";
import { buildQuestionPaperPrompt } from "./prompt-builder.js";

const DIFFICULTY_ROTATION: Array<"easy" | "medium" | "hard"> = [
  "easy",
  "medium",
  "hard"
];

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!env.OPENAI_API_KEY) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return openaiClient;
}

function safeJsonParse(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function getTotals(questionTypes: QuestionTypeInput[]): {
  totalQuestions: number;
  totalMarks: number;
} {
  return questionTypes.reduce(
    (acc, row) => {
      acc.totalQuestions += row.questionCount;
      acc.totalMarks += row.questionCount * row.marksPerQuestion;
      return acc;
    },
    { totalQuestions: 0, totalMarks: 0 }
  );
}

function hasTotalsMismatch(
  paper: GeneratedPaper,
  questionTypes: QuestionTypeInput[]
): boolean {
  const expected = getTotals(questionTypes);
  const actualQuestions = paper.sections.reduce(
    (sum: number, section) => sum + section.questions.length,
    0
  );
  const actualMarks = paper.sections.reduce(
    (sum: number, section) =>
      sum +
      section.questions.reduce(
        (qSum: number, question) => qSum + question.marks,
        0
      ),
    0
  );

  return (
    actualQuestions !== expected.totalQuestions ||
    actualMarks !== expected.totalMarks ||
    paper.maxMarks !== expected.totalMarks
  );
}

function toTopicPool(materialText: string): string[] {
  const words = materialText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 5);

  const frequency = new Map<string, number>();
  for (const word of words) {
    frequency.set(word, (frequency.get(word) ?? 0) + 1);
  }

  return [...frequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([word]) => word);
}

function questionTemplate(args: {
  type: string;
  subject: string;
  className: string;
  index: number;
  topic: string;
}): string {
  const qNo = args.index + 1;
  const topicText = args.topic ? ` related to ${args.topic}` : "";

  if (args.type.includes("Multiple Choice")) {
    return `Q${qNo}. In ${args.subject}, choose the correct option for a concept${topicText} taught in Class ${args.className}.`;
  }
  if (args.type.includes("True/False")) {
    return `Q${qNo}. State whether the following statement about ${args.subject}${topicText} is true or false, and justify in one line.`;
  }
  if (args.type.includes("Numerical")) {
    return `Q${qNo}. Solve a numerical problem from ${args.subject}${topicText}. Show all steps clearly.`;
  }
  if (args.type.includes("Diagram") || args.type.includes("Graph")) {
    return `Q${qNo}. Draw/interpret an appropriate diagram or graph in ${args.subject}${topicText}, then answer the related question.`;
  }
  if (args.type.includes("Long")) {
    return `Q${qNo}. Write a detailed answer on a key concept of ${args.subject}${topicText}, with examples from Class ${args.className} syllabus.`;
  }
  if (args.type.includes("Very Short")) {
    return `Q${qNo}. Write a very short answer (1-2 lines) for ${args.subject}${topicText}.`;
  }
  return `Q${qNo}. Answer the following ${args.subject} question${topicText} in concise form.`;
}

function buildFallbackPaper(input: AssignmentInput): GeneratedPaper {
  const totals = getTotals(input.questionTypes);
  const topics = toTopicPool(input.materialText ?? "");

  const sections = input.questionTypes.map(
    (row: QuestionTypeInput, sectionIndex: number) => {
      const sectionCode = String.fromCharCode(65 + sectionIndex);
      return {
        id: sectionCode,
        title: `Section ${sectionCode}: ${row.type}`,
        instruction: row.type.includes("Multiple Choice")
          ? "Attempt all questions. Select the most suitable answer."
          : "Attempt all questions.",
        questions: Array.from({ length: row.questionCount }).map((_, idx) => ({
          id: `${sectionCode}${idx + 1}`,
          text: questionTemplate({
            type: row.type,
            subject: input.subject,
            className: input.className,
            index: idx,
            topic: topics[(sectionIndex + idx) % Math.max(topics.length, 1)] ?? ""
          }),
          difficulty: DIFFICULTY_ROTATION[(sectionIndex + idx) % 3],
          marks: row.marksPerQuestion
        }))
      };
    }
  );

  const answerKey = sections.flatMap((section) =>
    section.questions.map(
      (question) =>
        `${question.id}: Sample marking rubric - reward concept clarity, correct method, and correct final answer.`
    )
  );

  return generatedPaperSchema.parse({
    title: input.title,
    schoolName: "Delhi Public School",
    schoolAddress: "Sector-4, Bokaro",
    subject: input.subject,
    className: input.className,
    durationMinutes: 45,
    maxMarks: totals.totalMarks,
    generalInstructions: [
      "All questions are compulsory unless stated otherwise.",
      "Write neatly and show all steps wherever required.",
      "Read each question carefully before answering."
    ],
    sections,
    answerKey
  });
}

async function tryAiGeneration(input: AssignmentInput): Promise<GeneratedPaper | null> {
  const client = getOpenAIClient();
  if (!client) return null;

  const prompt = buildQuestionPaperPrompt({
    ...input,
    totalMarks: getTotals(input.questionTypes).totalMarks
  });

  const completion = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a strict JSON generator for school assessments. Never output markdown."
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) return null;

  const parsed = safeJsonParse(content);
  if (!parsed) return null;

  const candidate = generatedPaperSchema.safeParse(parsed);
  if (!candidate.success) return null;
  return candidate.data;
}

export async function generateQuestionPaper(
  input: AssignmentInput
): Promise<GeneratedPaper> {
  const aiPaper = await tryAiGeneration(input).catch(() => null);

  if (aiPaper && !hasTotalsMismatch(aiPaper, input.questionTypes)) {
    return aiPaper;
  }

  return buildFallbackPaper(input);
}
