/**
 * Question Chunking Utilities
 *
 * Functions for dividing question specifications into optimal chunks
 * for parallel generation. This enables efficient parallel processing
 * while maintaining quality and avoiding rate limits.
 *
 * @see mddocs/ai_chat_mastra/TASKS_BY_PHASE.md - Tarea 1.2
 */

import type { QuestionSpec } from "../schemas";

/**
 * Divides an array of question specs into chunks for parallel generation
 *
 * @param specs - Array of question specifications to chunk
 * @param chunkSize - Desired size of each chunk (default: 3)
 * @returns Array of chunks, where each chunk is an array of QuestionSpec
 *
 * @example
 * ```typescript
 * const specs = [q1, q2, q3, q4, q5, q6, q7];
 * const chunks = chunkQuestionSpecs(specs, 3);
 * // Result: [[q1, q2, q3], [q4, q5, q6], [q7]]
 * ```
 */
export function chunkQuestionSpecs(
  specs: QuestionSpec[],
  chunkSize: number = 3
): QuestionSpec[][] {
  // Validate input
  if (!Array.isArray(specs)) {
    throw new Error("specs must be an array");
  }

  if (specs.length === 0) {
    return [];
  }

  if (chunkSize < 1) {
    throw new Error("chunkSize must be at least 1");
  }

  const chunks: QuestionSpec[][] = [];

  for (let i = 0; i < specs.length; i += chunkSize) {
    chunks.push(specs.slice(i, i + chunkSize));
  }

  return chunks;
}

/**
 * Calculates the optimal chunk size based on total number of questions
 *
 * Strategy:
 * - Very small exams (≤5): Generate all at once
 * - Small exams (6-10): Chunks of 3 questions
 * - Medium exams (11-20): Chunks of 4 questions
 * - Large exams (21-50): Chunks of 5 questions
 *
 * This heuristic balances:
 * - Parallelization benefits (smaller chunks = more parallel requests)
 * - Context quality (larger chunks = better coherence between questions)
 * - Rate limits (avoiding too many concurrent requests)
 * - Cost efficiency (fewer requests = less overhead)
 *
 * @param totalQuestions - Total number of questions to generate
 * @returns Optimal chunk size
 *
 * @example
 * ```typescript
 * calculateOptimalChunkSize(3);   // Returns 3
 * calculateOptimalChunkSize(8);   // Returns 3
 * calculateOptimalChunkSize(15);  // Returns 4
 * calculateOptimalChunkSize(30);  // Returns 5
 * ```
 */
export function calculateOptimalChunkSize(totalQuestions: number): number {
  if (!Number.isInteger(totalQuestions) || totalQuestions < 1) {
    throw new Error("totalQuestions must be a positive integer");
  }

  if (totalQuestions <= 5) return totalQuestions;
  if (totalQuestions <= 10) return 3;
  if (totalQuestions <= 20) return 4;
  return 5;
}

/**
 * Estimates total generation time based on number of questions and chunk size
 *
 * Assumptions:
 * - Average time per chunk: 8 seconds (sequential within chunk)
 * - Parallel execution across chunks
 * - Network overhead: 2 seconds per chunk
 *
 * @param totalQuestions - Total number of questions
 * @param chunkSize - Size of each chunk (optional, auto-calculated if not provided)
 * @returns Estimated time in seconds
 *
 * @example
 * ```typescript
 * estimateGenerationTime(10);  // ~26 seconds (4 chunks of 3, parallel)
 * estimateGenerationTime(20);  // ~50 seconds (5 chunks of 4, parallel)
 * ```
 */
export function estimateGenerationTime(
  totalQuestions: number,
  chunkSize?: number
): number {
  const optimalChunkSize = chunkSize || calculateOptimalChunkSize(totalQuestions);
  const numChunks = Math.ceil(totalQuestions / optimalChunkSize);

  // Time estimates (in seconds)
  const timePerQuestionInChunk = 2; // Sequential generation within chunk
  const networkOverheadPerChunk = 2;

  // Longest chunk determines total time (since chunks run in parallel)
  const questionsInLongestChunk = Math.ceil(totalQuestions / numChunks);
  const timeForLongestChunk =
    questionsInLongestChunk * timePerQuestionInChunk + networkOverheadPerChunk;

  return timeForLongestChunk;
}
