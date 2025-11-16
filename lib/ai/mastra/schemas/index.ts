/**
 * Mastra Schemas - Index
 *
 * Centralized exports for all Zod schemas used in Mastra tools.
 *
 * @see mddocs/ai_chat_mastra/TASKS_BY_PHASE.md - Tarea 1.1
 */

// TODO: Export schemas when implemented (Tarea 1.1)

// Re-export existing schemas for compatibility
export {
  ExamQuestionSchema,
  ExamSchema,
  type ExamQuestion,
  type Exam,
} from "@/lib/ai/chat/schemas";

// export { ExamPlanSchema, QuestionSpecSchema } from "./exam-plan";
// export type { ExamPlan, QuestionSpec } from "./exam-plan";
