import { z } from "zod";

// ============================================================================
// Response Contract Schemas (per DOC_preguntas_ia.md)
// ============================================================================

export const ExamQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["multiple_choice", "true_false", "short_answer", "essay"]),
  prompt: z.string(),
  options: z.array(z.string()).optional().default([]),
  answer: z
    .union([z.string(), z.number(), z.boolean(), z.array(z.string())])
    .nullable(),
  rationale: z.string().optional().default(""),
  difficulty: z.enum(["easy", "medium", "hard"]).optional().default("medium"),
  taxonomy: z
    .union([
      z.enum([
        "remember",
        "understand",
        "apply",
        "analyze",
        "evaluate",
        "create",
      ]),
      z.array(
        z.enum([
          "remember",
          "understand",
          "apply",
          "analyze",
          "evaluate",
          "create",
        ])
      ),
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

// ============================================================================
// Request Schemas
// ============================================================================

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "system", "assistant"]),
  content: z.string().min(1),
});

export const TopicSummarySchema = z.object({
  generalOverview: z.string(),
  academicLevel: z.string(),
  macroTopics: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        importance: z.enum(["high", "medium", "low"]),
        microTopics: z
          .array(
            z.object({
              name: z.string(),
              description: z.string(),
              keyTerms: z.array(z.string()),
              concepts: z.array(z.string()),
            })
          )
          .default([]),
      })
    )
    .default([]),
});

export const ChatContextSchema = z.object({
  documentIds: z.array(z.string()).max(5).optional().default([]),
  language: z.string().min(2).default("es"),
  numQuestions: z.number().int().min(1).max(40).optional(),
  questionTypes: z
    .array(z.enum(["multiple_choice", "true_false", "short_answer", "essay"]))
    .nonempty()
    .default(["multiple_choice"]),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]).default("mixed"),
  taxonomy: z
    .array(
      z.enum([
        "remember",
        "understand",
        "apply",
        "analyze",
        "evaluate",
        "create",
      ])
    )
    .optional()
    .default([]),
  topicSummaries: z
    .array(z.object({ documentId: z.string(), summary: TopicSummarySchema }))
    .optional()
    .default([]),
  existingExam: ExamSchema.nullable().optional(),
});

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
  context: ChatContextSchema,
});

// ============================================================================
// Type Exports
// ============================================================================

export type ExamQuestion = z.infer<typeof ExamQuestionSchema>;
export type Exam = z.infer<typeof ExamSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type TopicSummary = z.infer<typeof TopicSummarySchema>;
export type ChatContext = z.infer<typeof ChatContextSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

// ============================================================================
// OpenRouter Stats Interface
// ============================================================================

export interface OpenRouterStats {
  id?: string;
  usage?: number;
  total_cost?: number;
  tokens_prompt?: number;
  tokens_completion?: number;
  native_tokens_prompt?: number;
  native_tokens_completion?: number;
  generation_time?: number;
  latency?: number;
  model?: string;
  provider_name?: string;
  finish_reason?: string;
  streamed?: boolean;
}
