/**
 * Validate and Organize Exam Tool
 *
 * Validates exam schema and corrects common errors.
 * Normalizes question IDs and applies sanitization.
 *
 * This tool ensures data quality and consistency before finalizing exams.
 * It catches and repairs common AI generation mistakes like numeric answer
 * indices, invalid difficulty levels, and non-sequential question IDs.
 *
 * @see mddocs/ai_chat_mastra/TASKS_BY_PHASE.md - Tarea 1.5
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { ExamSchema, ExamQuestionSchema, type Exam } from "../schemas";
import { sanitizeAIExamPayload } from "@/lib/ai/chat/json-parser";

/**
 * Correction type for tracking fixes applied
 */
const CorrectionSchema = z.object({
  questionId: z.string(),
  issue: z.string(),
  correction: z.string(),
  severity: z.enum(["info", "warning", "error"]).default("info"),
});

/**
 * Input schema for validate and organize tool
 */
const inputSchema = z.object({
  /** Array of questions (raw, potentially invalid) */
  questions: z.array(z.any()),

  /** Optional exam metadata */
  metadata: z
    .object({
      title: z.string().default(""),
      subject: z.string().default(""),
      level: z.string().default(""),
      language: z.string().default("es"),
    })
    .optional(),

  /** Whether to normalize question IDs to sequential q1, q2, q3... */
  normalizeIds: z.boolean().default(true),

  /** Whether to apply sanitization (fix common AI errors) */
  applySanitization: z.boolean().default(true),
});

/**
 * Output schema for validate and organize tool
 */
const outputSchema = z.object({
  /** The validated and organized exam */
  exam: ExamSchema,

  /** List of corrections applied */
  corrections: z.array(CorrectionSchema),

  /** Validation metadata */
  metadata: z.object({
    totalQuestions: z.number(),
    validQuestions: z.number(),
    correctionsApplied: z.number(),
    sanitizationApplied: z.boolean(),
  }),
});

type Correction = z.infer<typeof CorrectionSchema>;

/**
 * Validate and Organize Exam Tool
 *
 * Validates exam structure, normalizes question IDs, and applies
 * sanitization to fix common AI generation errors.
 */
export const validateAndOrganizeExamTool = createTool({
  id: "validate-organize-exam",
  description:
    "Validates exam schema and corrects common errors. " +
    "Normalizes question IDs to sequential format (q1, q2, q3...), " +
    "fixes numeric answer indices, invalid difficulty levels, and other AI generation mistakes. " +
    "Returns a clean, validated exam ready for use.",
  inputSchema,
  outputSchema,

  execute: async ({ context }) => {
    const { questions, metadata, normalizeIds, applySanitization } = context;

    const corrections: Correction[] = [];
    const defaultMetadata = {
      title: "",
      subject: "",
      level: "",
      language: "es" as const,
    };

    // Construct initial exam payload
    const examPayload = {
      exam: {
        ...defaultMetadata,
        ...metadata,
        questions,
      },
    };

    // Apply sanitization if enabled
    let sanitized = examPayload;
    if (applySanitization) {
      sanitized = sanitizeAIExamPayload(examPayload) as typeof examPayload;
    }

    // Normalize question IDs if enabled
    if (normalizeIds && sanitized.exam.questions) {
      sanitized.exam.questions = sanitized.exam.questions.map((q: any, index: number) => {
        const oldId = q.id;
        const newId = `q${index + 1}`;

        if (oldId !== newId) {
          corrections.push({
            questionId: newId,
            issue: "Non-sequential question ID",
            correction: `Renamed from "${oldId}" to "${newId}"`,
            severity: "info",
          });
        }

        return {
          ...q,
          id: newId,
        };
      });
    }

    // Validate each question and collect issues
    const validatedQuestions: any[] = [];
    let validQuestions = 0;

    for (const question of sanitized.exam.questions || []) {
      try {
        // Try to validate with schema
        const validated = ExamQuestionSchema.parse(question);
        validatedQuestions.push(validated);
        validQuestions++;
      } catch (error) {
        // Log validation error but try to include the question anyway
        const questionId = question?.id || `q${validatedQuestions.length + 1}`;
        corrections.push({
          questionId,
          issue: "Schema validation warning",
          correction: error instanceof Error ? error.message : "Unknown validation error",
          severity: "warning",
        });

        // Try to repair and re-validate
        const repaired = repairQuestion(question, questionId);
        try {
          const validated = ExamQuestionSchema.parse(repaired);
          validatedQuestions.push(validated);
          validQuestions++;
          corrections.push({
            questionId,
            issue: "Question repaired",
            correction: "Applied auto-repair and validation passed",
            severity: "info",
          });
        } catch {
          // If repair fails, skip this question
          corrections.push({
            questionId,
            issue: "Question skipped",
            correction: "Could not repair - question excluded from final exam",
            severity: "error",
          });
        }
      }
    }

    // Construct final validated exam
    const validatedExam: Exam = {
      exam: {
        ...defaultMetadata,
        ...metadata,
        questions: validatedQuestions,
      },
    };

    // Final schema validation
    const finalExam = ExamSchema.parse(validatedExam);

    return {
      exam: finalExam,
      corrections,
      metadata: {
        totalQuestions: questions.length,
        validQuestions,
        correctionsApplied: corrections.length,
        sanitizationApplied: applySanitization,
      },
    };
  },
});

/**
 * Attempts to repair a malformed question
 */
function repairQuestion(question: any, questionId: string): any {
  const repaired = { ...question };

  // Ensure required fields exist
  if (!repaired.id) repaired.id = questionId;
  if (!repaired.type) repaired.type = "multiple_choice";
  if (!repaired.prompt) repaired.prompt = "";
  if (!repaired.answer) repaired.answer = null;

  // Ensure optional fields have defaults
  if (!repaired.options) repaired.options = [];
  if (!repaired.rationale) repaired.rationale = "";
  if (!repaired.difficulty) repaired.difficulty = "medium";
  if (!repaired.tags) repaired.tags = [];

  // Fix common issues
  // 1. Ensure taxonomy is a single value, not array
  if (Array.isArray(repaired.taxonomy) && repaired.taxonomy.length > 0) {
    repaired.taxonomy = repaired.taxonomy[0];
  }

  // 2. Ensure options is array for multiple choice
  if (repaired.type === "multiple_choice" && !Array.isArray(repaired.options)) {
    repaired.options = [];
  }

  // 3. Convert numeric answer to string if needed
  if (
    repaired.type === "multiple_choice" &&
    typeof repaired.answer === "number" &&
    Array.isArray(repaired.options)
  ) {
    const idx = Math.floor(repaired.answer);
    if (idx >= 0 && idx < repaired.options.length) {
      repaired.answer = repaired.options[idx];
    }
  }

  return repaired;
}
