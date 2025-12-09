/**
 * Randomize Options Tool
 *
 * Randomizes answer options using Fisher-Yates shuffle.
 * Supports seeded randomization for reproducibility.
 *
 * This tool ensures exam fairness by randomizing the order of answer options
 * in multiple-choice questions, preventing answer pattern memorization.
 *
 * @see mddocs/ai_chat_mastra/TASKS_BY_PHASE.md - Tarea 1.6
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { ExamSchema, type Exam } from "../schemas";
import { fisherYatesShuffle } from "../utils";
import { logger } from "@/lib/utils/logger";

/**
 * Input schema for randomize options tool
 */
const inputSchema = z.object({
  /** The exam with questions to randomize */
  exam: ExamSchema,

  /** Optional seed for reproducible randomization */
  seed: z.number().optional(),

  /** Whether to randomize all question types or only multiple choice */
  multipleChoiceOnly: z.boolean().default(true),
});

/**
 * Output schema for randomize options tool
 */
const outputSchema = z.object({
  /** The exam with randomized options */
  exam: ExamSchema,

  /** Metadata about the randomization */
  metadata: z.object({
    /** Number of questions that were randomized */
    questionsRandomized: z.number(),

    /** Whether a seed was used */
    seeded: z.boolean(),

    /** The seed value if one was used */
    seedValue: z.number().optional(),
  }),
});

/**
 * Randomize Options Tool
 *
 * Randomizes the order of answer options in exam questions using
 * the Fisher-Yates shuffle algorithm. Updates the correct answer
 * to reflect the new position.
 */
export const randomizeOptionsTool = createTool({
  id: "randomize-options",
  description:
    "Randomizes the order of answer options in exam questions using Fisher-Yates shuffle. " +
    "Ensures exam fairness by preventing answer pattern memorization. " +
    "Supports seeded randomization for reproducible results.",
  inputSchema,
  outputSchema,

  execute: async ({ context }) => {
    const { exam, seed, multipleChoiceOnly } = context;

    let questionsRandomized = 0;

    // Process each question
    const randomizedQuestions = exam.exam.questions.map((question) => {
      // Skip if not multiple choice and multipleChoiceOnly is true
      if (multipleChoiceOnly && question.type !== "multiple_choice") {
        return question;
      }

      // Skip if question doesn't have options
      if (!question.options || question.options.length === 0) {
        return question;
      }

      // Skip if answer is not a string (edge case)
      if (typeof question.answer !== "string") {
        logger.warn(
          `Question ${question.id} has non-string answer, skipping randomization`
        );
        return question;
      }

      // Find the index of the correct answer before shuffling
      const correctAnswerIndex = question.options.indexOf(question.answer);

      if (correctAnswerIndex === -1) {
        logger.warn(
          `Question ${question.id}: answer "${question.answer}" not found in options, skipping randomization`
        );
        return question;
      }

      // Shuffle the options
      const shuffledOptions = fisherYatesShuffle(question.options, seed);

      // Find the new index of the correct answer after shuffling
      const newCorrectAnswer = shuffledOptions[shuffledOptions.indexOf(question.answer)];

      // Verify the answer is still in the shuffled options
      if (!shuffledOptions.includes(newCorrectAnswer)) {
        logger.error(
          `Question ${question.id}: lost correct answer during shuffle, returning original`
        );
        return question;
      }

      questionsRandomized++;

      return {
        ...question,
        options: shuffledOptions,
        answer: newCorrectAnswer,
      };
    });

    // Construct the randomized exam
    const randomizedExam: Exam = {
      exam: {
        ...exam.exam,
        questions: randomizedQuestions,
      },
    };

    return {
      exam: randomizedExam,
      metadata: {
        questionsRandomized,
        seeded: seed !== undefined,
        seedValue: seed,
      },
    };
  },
});
