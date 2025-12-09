/**
 * Parse Question References Utility
 *
 * Parses user input to extract question IDs from natural language references.
 * Supports:
 * - Direct numbers: "5" → ["q5"]
 * - Written numbers: "cinco" / "five" → ["q5"]
 * - Ranges: "3 al 7" / "3 to 7" / "3-7" → ["q3", "q4", "q5", "q6", "q7"]
 * - Relative positions: "última" / "last" → last question ID
 *
 * @see mddocs/ai_chat_mastra/TASKS_BY_PHASE.md - Question Modification Tools
 */

import type { Exam } from "../schemas";
import { logger } from "@/lib/utils/logger";

/**
 * Number word mappings for Spanish and English (1-20)
 */
const NUMBER_WORDS: Record<string, number> = {
  // Spanish
  uno: 1,
  una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  once: 11,
  doce: 12,
  trece: 13,
  catorce: 14,
  quince: 15,
  dieciséis: 16,
  dieciseis: 16,
  diecisiete: 17,
  dieciocho: 18,
  diecinueve: 19,
  veinte: 20,
  // English
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
};

/**
 * Relative position keywords
 */
const POSITION_KEYWORDS = {
  first: ["primera", "primero", "first"],
  last: ["última", "ultimo", "última", "last"],
};

/**
 * Parse result
 */
export interface ParseResult {
  success: boolean;
  questionIds?: string[];
  error?: string;
  availableIds?: string[];
  invalidIds?: string[];
}

/**
 * Normalize question ID to qN format
 */
function normalizeQuestionId(id: string | number): string {
  if (typeof id === "number") {
    return `q${id}`;
  }
  // If already in qN format, return as-is
  if (/^q\d+$/i.test(id)) {
    return id.toLowerCase();
  }
  // If just a number string, add q prefix
  if (/^\d+$/.test(id)) {
    return `q${id}`;
  }
  return id;
}

/**
 * Extract numbers from user input
 * Handles:
 * - Direct numbers: "5", "pregunta 5", "question 5"
 * - Written numbers: "cinco", "five"
 * - Lists: "3, 7 y 12", "3, 7, and 12"
 * - Ranges: "3 al 7", "3 to 7", "3-7"
 */
function extractNumbers(input: string): number[] {
  const normalizedInput = input.toLowerCase().trim();
  const numbers: number[] = [];

  // Check for range patterns (highest priority)
  // Pattern: "N al M", "N to M", "N-M", "de N a M", "from N to M"
  const rangePatterns = [
    /(\d+)\s*(?:al|a|to|-|hasta)\s*(\d+)/g, // "3 al 7", "3 to 7", "3-7"
    /(?:de|from)\s*(\d+)\s*(?:a|al|to)\s*(\d+)/g, // "de 3 a 7", "from 3 to 7"
  ];

  for (const pattern of rangePatterns) {
    let match;
    while ((match = pattern.exec(normalizedInput)) !== null) {
      const start = parseInt(match[1], 10);
      const end = parseInt(match[2], 10);
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
          numbers.push(i);
        }
      }
    }
  }

  // If ranges found, return them
  if (numbers.length > 0) {
    return numbers;
  }

  // Check for written numbers (medium priority)
  for (const [word, num] of Object.entries(NUMBER_WORDS)) {
    // Match word boundaries to avoid partial matches
    const wordRegex = new RegExp(`\\b${word}\\b`, "g");
    if (wordRegex.test(normalizedInput)) {
      numbers.push(num);
    }
  }

  // Check for direct numbers (lowest priority, but most common)
  const directNumberMatches = normalizedInput.match(/\b\d+\b/g);
  if (directNumberMatches) {
    for (const match of directNumberMatches) {
      const num = parseInt(match, 10);
      if (!isNaN(num)) {
        numbers.push(num);
      }
    }
  }

  // Remove duplicates and sort
  return Array.from(new Set(numbers)).sort((a, b) => a - b);
}

/**
 * Check if input refers to a relative position (first, last)
 */
function extractRelativePosition(
  input: string,
  exam: Exam
): { position: "first" | "last" | null; questionId?: string } {
  const normalizedInput = input.toLowerCase().trim();

  // Check for "first" keywords
  if (POSITION_KEYWORDS.first.some((kw) => normalizedInput.includes(kw))) {
    const firstQuestion = exam.exam.questions[0];
    return {
      position: "first",
      questionId: firstQuestion?.id,
    };
  }

  // Check for "last" keywords
  if (POSITION_KEYWORDS.last.some((kw) => normalizedInput.includes(kw))) {
    const lastQuestion = exam.exam.questions[exam.exam.questions.length - 1];
    return {
      position: "last",
      questionId: lastQuestion?.id,
    };
  }

  return { position: null };
}

/**
 * Parse question references from user input
 *
 * @param input - User input (e.g., "pregunta 5", "questions 3 to 7", "the last one")
 * @param exam - Current exam structure
 * @returns Parse result with question IDs or error
 *
 * @example
 * ```typescript
 * parseQuestionReferences("haz la pregunta 5 más difícil", exam)
 * // Returns: { success: true, questionIds: ["q5"] }
 *
 * parseQuestionReferences("mejora preguntas 3, 7 y 12", exam)
 * // Returns: { success: true, questionIds: ["q3", "q7", "q12"] }
 *
 * parseQuestionReferences("modifica de la 2 a la 5", exam)
 * // Returns: { success: true, questionIds: ["q2", "q3", "q4", "q5"] }
 *
 * parseQuestionReferences("cambia la última pregunta", exam)
 * // Returns: { success: true, questionIds: ["q15"] } // if exam has 15 questions
 *
 * parseQuestionReferences("modifica pregunta 50", exam) // exam has 20 questions
 * // Returns: { success: false, error: "...", availableIds: ["q1", "q2", ..., "q20"], invalidIds: ["q50"] }
 * ```
 */
export function parseQuestionReferences(
  input: string,
  exam: Exam
): ParseResult {
  try {
    const availableIds = exam.exam.questions.map((q) => q.id);
    const questionIds: string[] = [];

    logger.log("[parseQuestionReferences] Input:", input);

    // Step 1: Check for relative positions (first, last)
    const relativePosition = extractRelativePosition(input, exam);
    if (relativePosition.position && relativePosition.questionId) {
      logger.log(
        `[parseQuestionReferences] Detected ${relativePosition.position} position:`,
        relativePosition.questionId
      );
      questionIds.push(relativePosition.questionId);
    }

    // Step 2: Extract numbers (direct, written, ranges, lists)
    if (questionIds.length === 0) {
      const numbers = extractNumbers(input);
      logger.log("[parseQuestionReferences] Extracted numbers:", numbers);

      if (numbers.length === 0) {
        return {
          success: false,
          error:
            "Could not extract question numbers from input. Please specify question numbers (e.g., 'question 5', '3 to 7', 'the last one').",
          availableIds,
        };
      }

      // Convert numbers to question IDs
      for (const num of numbers) {
        questionIds.push(normalizeQuestionId(num));
      }
    }

    logger.log("[parseQuestionReferences] Parsed question IDs:", questionIds);

    // Step 3: Validate all IDs exist in exam
    const invalidIds: string[] = [];
    for (const id of questionIds) {
      if (!availableIds.includes(id)) {
        invalidIds.push(id);
      }
    }

    if (invalidIds.length > 0) {
      const invalidIdsStr = invalidIds.join(", ");
      const availableIdsStr = availableIds.join(", ");
      return {
        success: false,
        error: `Question(s) ${invalidIdsStr} not found in exam. Available IDs: ${availableIdsStr}`,
        availableIds,
        invalidIds,
      };
    }

    // Success!
    return {
      success: true,
      questionIds,
    };
  } catch (error) {
    logger.error("[parseQuestionReferences] Error parsing references:", error);
    return {
      success: false,
      error: `Error parsing question references: ${error instanceof Error ? error.message : String(error)}`,
      availableIds: exam.exam.questions.map((q) => q.id),
    };
  }
}

/**
 * Validate a single question ID exists in exam
 *
 * @param questionId - Question ID to validate
 * @param exam - Current exam structure
 * @returns Validation result
 *
 * @example
 * ```typescript
 * validateQuestionId("q5", exam)
 * // Returns: { valid: true }
 *
 * validateQuestionId("q50", exam) // exam has 20 questions
 * // Returns: { valid: false, error: "...", availableIds: ["q1", ..., "q20"] }
 * ```
 */
export function validateQuestionId(
  questionId: string,
  exam: Exam
): { valid: boolean; error?: string; availableIds?: string[] } {
  const availableIds = exam.exam.questions.map((q) => q.id);

  if (!availableIds.includes(questionId)) {
    const availableIdsStr = availableIds.join(", ");
    return {
      valid: false,
      error: `Question ${questionId} not found in exam. Available IDs: ${availableIdsStr}`,
      availableIds,
    };
  }

  return { valid: true };
}
