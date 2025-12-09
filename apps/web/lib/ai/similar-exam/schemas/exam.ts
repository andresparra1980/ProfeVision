import { z } from "zod";

// Reuse/align with /app/api/chat/route.ts ExamSchema
export const ExamQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["multiple_choice", "true_false", "short_answer", "essay"]),
  prompt: z.string(),
  options: z.array(z.string()).optional().default([]),
  answer: z.union([z.string(), z.number(), z.boolean(), z.array(z.any())]).nullable(),
  rationale: z.string().optional().default(""),
  difficulty: z.enum(["easy", "medium", "hard"]).optional().default("medium"),
  taxonomy: z
    .union([
      z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]),
      z.array(z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]))
    ])
    .optional()
    .default("understand"),
  tags: z.array(z.string()).optional().default([]),
  source: z
    .object({
      documentId: z.string().nullable(),
      spans: z.array(z.object({ start: z.number(), end: z.number() })),
    })
    .optional()
    .default({ documentId: null, spans: [] }),
});

export const ExamSchema = z.object({
  exam: z.object({
    title: z.string(),
    subject: z.string(),
    level: z.string(),
    language: z.string(),
    questions: z.array(ExamQuestionSchema).min(1),
  }),
});

export type Exam = z.infer<typeof ExamSchema>;
export type ExamQuestion = z.infer<typeof ExamQuestionSchema>;

// Sanitizer aligned with /app/api/chat/route.ts
export const sanitizeAIExamPayload = (obj: unknown): unknown => {
  try {
    if (!obj || typeof obj !== "object") return obj;
    const cloned: Record<string, unknown> = JSON.parse(JSON.stringify(obj));
    const exam = (cloned as { exam?: { questions?: Array<Record<string, unknown>> } }).exam;
    const allowed = new Set(["easy", "medium", "hard"]);
    if (exam && Array.isArray(exam.questions)) {
      for (let i = 0; i < exam.questions.length; i++) {
        const q = exam.questions[i];
        if (!q || typeof q !== "object") continue;
        const diff = (q as Record<string, unknown>).difficulty;
        if (typeof diff !== "string" || !allowed.has(diff)) {
          (q as Record<string, unknown>).difficulty = "medium";
        }
      }
    }
    return cloned;
  } catch {
    return obj;
  }
};
