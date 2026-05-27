import type { AssignmentInput, QuestionTypeInput } from "@vedaai/shared";

interface PromptPayload {
  title: string;
  subject: string;
  className: string;
  dueDate: string;
  questionTypes: QuestionTypeInput[];
  additionalInstructions: string;
  materialText: string;
  totalMarks: number;
}

function formatQuestionTypeLines(questionTypes: QuestionTypeInput[]): string {
  return questionTypes
    .map(
      (entry, index) =>
        `${index + 1}. ${entry.type}: ${entry.questionCount} questions x ${
          entry.marksPerQuestion
        } marks`
    )
    .join("\n");
}

export function buildQuestionPaperPrompt(payload: PromptPayload): string {
  const materialChunk =
    payload.materialText.trim().length > 0
      ? payload.materialText.trim().slice(0, 9000)
      : "No source material provided.";

  const instructionChunk =
    payload.additionalInstructions.trim().length > 0
      ? payload.additionalInstructions.trim()
      : "No additional instructions.";

  return `
You are generating a school assessment paper in strict JSON format.

CONTEXT
- Assignment title: ${payload.title}
- Subject: ${payload.subject}
- Class: ${payload.className}
- Due date: ${payload.dueDate}
- Total marks target: ${payload.totalMarks}

QUESTION DISTRIBUTION
${formatQuestionTypeLines(payload.questionTypes)}

ADDITIONAL INSTRUCTIONS
${instructionChunk}

SOURCE MATERIAL
${materialChunk}

OUTPUT RULES
1. Return only valid JSON object.
2. Do not include markdown, backticks, or prose outside JSON.
3. Output JSON keys exactly:
{
  "title": string,
  "schoolName": string,
  "schoolAddress": string,
  "subject": string,
  "className": string,
  "durationMinutes": number,
  "maxMarks": number,
  "generalInstructions": string[],
  "sections": [
    {
      "id": string,
      "title": string,
      "instruction": string,
      "questions": [
        {
          "id": string,
          "text": string,
          "difficulty": "easy" | "medium" | "hard",
          "marks": number
        }
      ]
    }
  ],
  "answerKey": string[]
}
4. Respect the requested number of questions and marks per question per type.
5. Group related question types in separate sections (Section A, Section B, ...).
6. Keep questions clear and exam-appropriate.
`;
}

export function inputFromRecord(input: AssignmentInput): PromptPayload {
  const totalMarks = input.questionTypes.reduce(
    (total: number, row: QuestionTypeInput) =>
      total + row.questionCount * row.marksPerQuestion,
    0
  );

  return {
    ...input,
    totalMarks
  };
}
