/**
 * Mastra Schemas - Index
 *
 * Centralized exports for all Zod schemas used in Mastra tools.
 *
 * @see mddocs/ai_chat_mastra/TASKS_BY_PHASE.md - Tarea 1.1
 */

// Re-export existing schemas for compatibility
export {
  ExamQuestionSchema,
  ExamSchema,
  type ExamQuestion,
  type Exam,
  ChatContextSchema,
  TopicSummarySchema,
  type ChatContext,
  type TopicSummary,
} from "@/lib/ai/chat/schemas";

// Export new Mastra-specific schemas
export {
  QuestionSpecSchema,
  ExamPlanSchema,
  TaxonomyLevelEnum,
  DifficultyEnum,
  QuestionTypeEnum,
  type QuestionSpec,
  type ExamPlan,
  type TaxonomyLevel,
  type Difficulty,
  type QuestionType,
} from "./exam-plan";
