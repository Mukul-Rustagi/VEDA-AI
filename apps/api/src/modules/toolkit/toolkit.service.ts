import type { ToolkitRequest, ToolkitResponse } from "@vedaai/shared";
import { toolkitResponseSchema } from "@vedaai/shared";
import OpenAI from "openai";

import { env } from "../../config/env.js";
import { buildToolkitPrompt } from "./prompt-builder.js";

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!env.OPENAI_API_KEY) return null;

  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  return openaiClient;
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function buildPracticeQuestions(input: ToolkitRequest): string[] {
  return Array.from({ length: input.questionCount }).map((_, index) => {
    const number = index + 1;

    if (number <= Math.ceil(input.questionCount / 3)) {
      return `Q${number}. Define a basic concept of ${input.topic} in ${input.subject}. [1 mark]`;
    }

    if (number <= Math.ceil((input.questionCount * 2) / 3)) {
      return `Q${number}. Solve an application-based ${input.subject} question on ${input.topic}. [2 marks]`;
    }

    return `Q${number}. Write a higher-order response connecting ${input.topic} to real-life context. [3 marks]`;
  });
}

function buildFallbackContent(input: ToolkitRequest): ToolkitResponse {
  const commonTips = [
    `Start with a 2-minute recap before teaching ${input.topic}.`,
    "Use think-pair-share after each section to improve participation.",
    "End with one quick formative check before moving ahead."
  ];

  if (input.mode === "Practice Questions") {
    return toolkitResponseSchema.parse({
      mode: input.mode,
      heading: `${input.topic} Practice Set (${input.subject})`,
      summary: `A structured set of ${input.questionCount} questions for Class ${input.className} with increasing difficulty.`,
      sections: [
        {
          id: "S1",
          title: "Question Bank",
          items: buildPracticeQuestions(input)
        },
        {
          id: "S2",
          title: "Answering Strategy",
          items: [
            "Read the command words carefully before writing.",
            "Show steps for problem-solving questions.",
            "Underline final answers in long responses."
          ]
        }
      ],
      teacherTips: commonTips
    });
  }

  if (input.mode === "Activity Ideas") {
    return toolkitResponseSchema.parse({
      mode: input.mode,
      heading: `${input.topic} Classroom Activity Kit`,
      summary: `Hands-on activity ideas to teach ${input.topic} for Class ${input.className} in an engaging way.`,
      sections: [
        {
          id: "S1",
          title: "Core Activities",
          items: [
            `Mini demo: show one visual example of ${input.topic} and ask prediction questions.`,
            "Group challenge: divide class into 4 groups and assign one sub-problem each.",
            "Board relay: each student adds one step to build the full solution."
          ]
        },
        {
          id: "S2",
          title: "Materials Needed",
          items: [
            "Whiteboard/chart paper and marker pens.",
            "3-4 printed prompt cards per group.",
            "Timer for short activity rounds."
          ]
        },
        {
          id: "S3",
          title: "Assessment Signals",
          items: [
            "Students explain concept in their own words.",
            "Students correctly solve one unseen variation.",
            "Students identify one common mistake and fix it."
          ]
        }
      ],
      teacherTips: commonTips
    });
  }

  return toolkitResponseSchema.parse({
    mode: input.mode,
    heading: `${input.topic} Quick Explainer`,
    summary: `Concise explanation notes for ${input.subject}, Class ${input.className}, ready to teach immediately.`,
    sections: [
      {
        id: "S1",
        title: "Concept in Simple Terms",
        items: [
          `${input.topic} means understanding the core rule and how it behaves in common classroom examples.`,
          `In ${input.subject}, begin with the base definition, then move to one numerical or real-life application.`,
          "Highlight one misconception and correct it using a short counterexample."
        ]
      },
      {
        id: "S2",
        title: "Classroom Examples",
        items: [
          `Example 1: A direct textbook-style question on ${input.topic}.`,
          `Example 2: A real-life application linked to ${input.topic}.`,
          "Example 3: A quick oral check students can answer in one line."
        ]
      },
      {
        id: "S3",
        title: "Exit Check Questions",
        items: [
          `What is the key rule behind ${input.topic}?`,
          "Where do students usually make mistakes here?",
          "How would you explain this idea to a younger class?"
        ]
      }
    ],
    teacherTips: commonTips
  });
}

async function tryAiToolkitContent(input: ToolkitRequest): Promise<ToolkitResponse | null> {
  const client = getOpenAIClient();
  if (!client) return null;

  const completion = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    temperature: 0.35,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You produce strictly valid JSON for teacher toolkit content."
      },
      {
        role: "user",
        content: buildToolkitPrompt(input)
      }
    ]
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) return null;

  const parsed = safeJsonParse(content);
  if (!parsed) return null;

  const result = toolkitResponseSchema.safeParse(parsed);
  if (!result.success) return null;
  return result.data;
}

export async function generateToolkitContent(
  input: ToolkitRequest
): Promise<ToolkitResponse> {
  const aiResult = await tryAiToolkitContent(input).catch(() => null);
  if (aiResult) return aiResult;
  return buildFallbackContent(input);
}
