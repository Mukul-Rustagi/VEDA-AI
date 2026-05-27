import type { ToolkitRequest } from "@vedaai/shared";

function modeSpecificInstruction(mode: ToolkitRequest["mode"]): string {
  if (mode === "Quick Explainer") {
    return "Focus on clarity, intuition, and short class-friendly checkpoints.";
  }

  if (mode === "Practice Questions") {
    return "Generate question sets with a clear difficulty ramp from easy to hard.";
  }

  return "Generate classroom-ready activity ideas with execution steps and outcomes.";
}

export function buildToolkitPrompt(input: ToolkitRequest): string {
  return [
    "Generate AI Toolkit output as strict JSON only.",
    "",
    "Input:",
    `- Mode: ${input.mode}`,
    `- Topic: ${input.topic}`,
    `- Subject: ${input.subject}`,
    `- Class: ${input.className}`,
    `- Learning objective: ${input.objective || "Not provided"}`,
    `- Additional context: ${input.context || "Not provided"}`,
    `- Question count preference: ${input.questionCount}`,
    "",
    "Instruction:",
    modeSpecificInstruction(input.mode),
    "",
    "Output JSON shape:",
    "{",
    '  "mode": "Quick Explainer | Practice Questions | Activity Ideas",',
    '  "heading": "string",',
    '  "summary": "string",',
    '  "sections": [',
    '    { "id": "S1", "title": "string", "items": ["string"] }',
    "  ],",
    '  "teacherTips": ["string"]',
    "}",
    "",
    "Rules:",
    "- Keep language school-appropriate and concise.",
    "- Sections must be practical and directly usable in class.",
    "- Never include markdown, code fences, or extra keys."
  ].join("\n");
}
