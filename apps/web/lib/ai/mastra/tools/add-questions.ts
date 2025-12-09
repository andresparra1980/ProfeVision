/**
 * Add Questions Tool
 *
 * Adds new questions to an existing exam with continuous ID numbering.
 * Combines planning and generation in a single operation.
 *
 * This tool is a convenience wrapper that generates additional questions
 * and ensures ID numbering continues from the existing exam.
 *
 * @see mddocs/ai_chat_mastra/TASKS_BY_PHASE.md - Tarea 1.8
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  ExamQuestionSchema,
  QuestionTypeEnum,
  TaxonomyLevelEnum,
  TopicSummarySchema,
} from "../schemas";
import { planExamGenerationTool } from "./plan-exam-generation";
import { generateQuestionsInBulkTool } from "./generate-questions-bulk";
import { logger } from "@/lib/utils/logger";

/**
 * Input schema for add questions tool
 */
const inputSchema = z.object({
  /** Number of questions to add */
  numQuestions: z.number().int().min(1).max(20),

  /** Current highest question ID (for continuous numbering) */
  currentMaxId: z.string().regex(/^q\d+$/),

  /** Topics for new questions */
  topics: z.array(z.string()).min(1),

  /** Difficulty level */
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]),

  /** Allowed question types */
  questionTypes: z.array(QuestionTypeEnum).min(1),

  /** Optional taxonomy levels */
  taxonomyLevels: z.array(TaxonomyLevelEnum).optional(),

  /** Language for generation */
  language: z.enum(["es", "en"]).default("es"),

  /** Optional document summaries */
  documentSummaries: z
    .array(
      z.object({
        documentId: z.string(),
        summary: TopicSummarySchema,
      })
    )
    .optional(),

  /** Additional instructions */
  additionalInstructions: z.string().optional(),
});

/**
 * Output schema for add questions tool
 */
const outputSchema = z.object({
  /** New questions generated */
  questions: z.array(ExamQuestionSchema),

  /** Metadata about the addition */
  metadata: z.object({
    /** Number of questions requested */
    requested: z.number(),

    /** Number of questions generated */
    generated: z.number(),

    /** Starting ID */
    startId: z.string(),

    /** Ending ID */
    endId: z.string(),
  }),
});

/**
 * Add Questions Tool
 *
 * Generates additional questions for an existing exam,
 * ensuring continuous ID numbering.
 */
export const addQuestionsTool = createTool({
  id: "add-questions",
  description:
    "Adds new questions to an existing exam with continuous ID numbering. " +
    "Takes the current max ID (e.g., 'q10') and generates new questions " +
    "starting from the next ID (e.g., 'q11', 'q12', ...).",
  inputSchema,
  outputSchema,

  execute: async ({ context, runtimeContext }) => {
    const {
      numQuestions,
      currentMaxId,
      topics,
      difficulty,
      questionTypes,
      taxonomyLevels,
      language,
      documentSummaries,
      additionalInstructions,
    } = context;

    // Extract number from current max ID
    const currentNum = parseInt(currentMaxId.replace("q", ""), 10);
    const startNum = currentNum + 1;

    logger.log(
      `Adding ${numQuestions} questions starting from q${startNum}`
    );

    try {
      // Step 1: Generate plan for new questions
      const planResult = await planExamGenerationTool.execute({
        context: {
          numQuestions,
          topics,
          difficulty,
          questionTypes,
          taxonomyLevels,
          language,
          documentSummaries,
        },
        runtimeContext,
      });

      // Update IDs to continue from current max
      const updatedSpecs = planResult.questionSpecs.map((spec, index) => ({
        ...spec,
        id: `q${startNum + index}`,
      }));

      // Step 2: Generate questions from plan
      const generateResult = await generateQuestionsInBulkTool.execute({
        context: {
          questionSpecs: updatedSpecs,
          context: {
            language,
            documentSummaries,
            additionalInstructions,
          },
        },
        runtimeContext,
      });

      const endNum = startNum + generateResult.questions.length - 1;

      return {
        questions: generateResult.questions,
        metadata: {
          requested: numQuestions,
          generated: generateResult.questions.length,
          startId: `q${startNum}`,
          endId: `q${endNum}`,
        },
      };
    } catch (error) {
      logger.error("Error adding questions:", error);
      throw new Error(
        `Failed to add questions: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
});
