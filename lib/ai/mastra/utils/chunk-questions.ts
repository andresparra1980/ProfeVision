/**
 * Question Chunking Utilities
 *
 * Functions for dividing question specifications into optimal chunks
 * for parallel generation.
 *
 * @see mddocs/ai_chat_mastra/TASKS_BY_PHASE.md - Tarea 1.2
 */

// TODO: Implement chunking utilities (Tarea 1.2)
// Phase 1: Core Implementation

// export function chunkQuestionSpecs<T>(
//   specs: T[],
//   chunkSize: number = 3
// ): T[][] {
//   const chunks: T[][] = [];
//   for (let i = 0; i < specs.length; i += chunkSize) {
//     chunks.push(specs.slice(i, i + chunkSize));
//   }
//   return chunks;
// }

// export function calculateOptimalChunkSize(totalQuestions: number): number {
//   if (totalQuestions <= 5) return totalQuestions;
//   if (totalQuestions <= 10) return 3;
//   if (totalQuestions <= 20) return 4;
//   return 5;
// }
