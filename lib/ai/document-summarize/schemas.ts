import { z } from "zod";

// ===== Topic Summary Schemas =====

export const microTopicSchema = z.object({
  name: z.string(),
  description: z.string(),
  keyTerms: z.array(z.string()),
  concepts: z.array(z.string()),
});

export const macroTopicSchema = z.object({
  name: z.string(),
  description: z.string(),
  importance: z.enum(["high", "medium", "low"]),
  microTopics: z.array(microTopicSchema).min(0),
});

export const summarySchema = z.object({
  generalOverview: z.string(),
  academicLevel: z.string(),
  macroTopics: z.array(macroTopicSchema).min(0),
});

export type MicroTopic = z.infer<typeof microTopicSchema>;
export type MacroTopic = z.infer<typeof macroTopicSchema>;
export type TopicSummaryResult = z.infer<typeof summarySchema>;

// ===== Request Options Schema =====

export const SummarizeOptionsSchema = z.object({
  model: z.string().optional(),
  temperature: z.number().optional(),
  maxOutputTokens: z.number().optional(),
  maxTokens: z.number().optional(),
  maxChars: z.number().optional(),
  imageData: z.string().optional(),
});

export type SummarizeOptions = z.infer<typeof SummarizeOptionsSchema>;

// ===== Request Body Schema =====

export const SummarizeRequestSchema = z.object({
  text: z.string().optional(),
  imageData: z.string().optional(),
  options: SummarizeOptionsSchema.optional(),
});

export type SummarizeRequest = z.infer<typeof SummarizeRequestSchema>;
