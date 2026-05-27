export const QUESTION_TYPE_OPTIONS = [
  "Multiple Choice Questions",
  "Short Questions",
  "Long Questions",
  "Diagram/Graph-Based Questions",
  "Numerical Problems",
  "True/False",
  "Very Short Questions"
] as const;

export const DIFFICULTY_OPTIONS = ["easy", "medium", "hard"] as const;

export const ASSIGNMENT_STATUS = [
  "draft",
  "queued",
  "generating",
  "ready",
  "failed"
] as const;

export const TOOLKIT_MODE_OPTIONS = [
  "Quick Explainer",
  "Practice Questions",
  "Activity Ideas"
] as const;
