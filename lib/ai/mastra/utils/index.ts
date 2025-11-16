/**
 * Mastra Utilities - Index
 *
 * Centralized exports for utility functions.
 *
 * @see mddocs/ai_chat_mastra/TASKS_BY_PHASE.md - Tarea 1.2
 */

export {
  chunkQuestionSpecs,
  calculateOptimalChunkSize,
  estimateGenerationTime,
} from "./chunk-questions";

export {
  fisherYatesShuffle,
  hasSameElements,
  shuffleInSync,
} from "./fisher-yates";
