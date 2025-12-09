/**
 * Question Specification Schema
 *
 * Re-exports existing schemas for backward compatibility.
 *
 * @see mddocs/ai_chat_mastra/TASKS_BY_PHASE.md - Tarea 1.1
 */

// Re-export existing schemas for compatibility
export {
  ExamQuestionSchema,
  ExamSchema,
  type ExamQuestion,
  type Exam,
} from "@/lib/ai/chat/schemas";
