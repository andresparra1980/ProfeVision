/**
 * Exam Plan Schemas
 *
 * Zod schemas for exam planning and question specifications.
 * Used by the plan-exam-generation tool to create a structured plan
 * before generating individual questions.
 *
 * @see mddocs/ai_chat_mastra/TASKS_BY_PHASE.md - Tarea 1.1
 */

import { z } from "zod";

/**
 * Taxonomy levels based on Bloom's Taxonomy
 */
export const TaxonomyLevelEnum = z.enum([
  "remember",
  "understand",
  "apply",
  "analyze",
  "evaluate",
  "create",
]);

/**
 * Question difficulty levels
 */
export const DifficultyEnum = z.enum(["easy", "medium", "hard"]);

/**
 * Question types supported by the system
 */
export const QuestionTypeEnum = z.enum([
  "multiple_choice",
  "true_false",
  "short_answer",
  "essay",
]);

/**
 * Question Specification Schema
 *
 * Defines the specification for a single question to be generated.
 * This is NOT the final question, but rather a blueprint/plan.
 */
export const QuestionSpecSchema = z.object({
  /** Unique identifier (q1, q2, q3, etc.) */
  id: z.string().regex(/^q\d+$/, "ID must match pattern 'q{number}'"),

  /** Specific topic or subtopic for this question */
  topic: z.string().min(3).max(200),

  /** Example prompt or guidance for question generation */
  examplePrompt: z.string().min(10).max(500),

  /** Type of question to generate */
  type: QuestionTypeEnum,

  /** Difficulty level for this question */
  difficulty: DifficultyEnum,

  /** Bloom's taxonomy level (optional) */
  taxonomyLevel: TaxonomyLevelEnum.optional(),

  /** Additional metadata (optional) */
  metadata: z
    .object({
      /** Keywords or tags related to this question */
      keywords: z.array(z.string()).optional(),

      /** Target time to answer (in seconds) */
      targetTime: z.number().int().positive().optional(),

      /** Related document ID if this question is based on specific content */
      documentId: z.string().optional(),
    })
    .optional(),
});

/**
 * Exam Plan Schema
 *
 * The complete plan for exam generation, including all question specifications
 * and metadata about the overall exam structure.
 */
export const ExamPlanSchema = z.object({
  /** Total number of questions to generate */
  totalQuestions: z.number().int().min(1).max(40),

  /** Array of question specifications */
  questionSpecs: z.array(QuestionSpecSchema).min(1),

  /** Estimated generation time in seconds (optional) */
  estimatedGenerationTime: z.number().positive().optional(),

  /** Exam-level metadata (optional) */
  metadata: z
    .object({
      /** Main topics covered in the exam */
      topics: z.array(z.string()),

      /** Distribution of difficulty levels */
      difficultyDistribution: z
        .object({
          easy: z.number().int().nonnegative(),
          medium: z.number().int().nonnegative(),
          hard: z.number().int().nonnegative(),
        })
        .optional(),

      /** Distribution of taxonomy levels */
      taxonomyDistribution: z
        .object({
          remember: z.number().int().nonnegative().optional(),
          understand: z.number().int().nonnegative().optional(),
          apply: z.number().int().nonnegative().optional(),
          analyze: z.number().int().nonnegative().optional(),
          evaluate: z.number().int().nonnegative().optional(),
          create: z.number().int().nonnegative().optional(),
        })
        .optional(),

      /** Type distribution */
      typeDistribution: z
        .object({
          multiple_choice: z.number().int().nonnegative().optional(),
          true_false: z.number().int().nonnegative().optional(),
          short_answer: z.number().int().nonnegative().optional(),
          essay: z.number().int().nonnegative().optional(),
        })
        .optional(),

      /** Language of the exam */
      language: z.enum(["es", "en", "fr", "pt"]).default("en"),
    })
    .optional(),
});

/**
 * Type exports for TypeScript usage
 */
export type QuestionSpec = z.infer<typeof QuestionSpecSchema>;
export type ExamPlan = z.infer<typeof ExamPlanSchema>;
export type TaxonomyLevel = z.infer<typeof TaxonomyLevelEnum>;
export type Difficulty = z.infer<typeof DifficultyEnum>;
export type QuestionType = z.infer<typeof QuestionTypeEnum>;
