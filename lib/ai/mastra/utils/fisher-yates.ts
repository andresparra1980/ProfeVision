/**
 * Fisher-Yates Shuffle Algorithm
 *
 * Implementation of Fisher-Yates shuffle for randomizing answer options.
 * Supports optional seeding for reproducible randomization.
 *
 * The Fisher-Yates shuffle is an unbiased shuffling algorithm that ensures
 * every permutation has equal probability. This is critical for exam fairness.
 *
 * @see https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
 * @see mddocs/ai_chat_mastra/TASKS_BY_PHASE.md - Tarea 1.2
 */

/**
 * Shuffles an array using the Fisher-Yates algorithm
 *
 * This is an in-place shuffle that runs in O(n) time and guarantees
 * uniform distribution of permutations.
 *
 * @param array - The array to shuffle (will not be modified)
 * @param seed - Optional seed for reproducible randomization
 * @returns A new shuffled array
 *
 * @example
 * ```typescript
 * const options = ["A", "B", "C", "D"];
 * const shuffled = fisherYatesShuffle(options);
 * // Result: ["C", "A", "D", "B"] (random order)
 *
 * // With seed for reproducibility
 * const shuffled1 = fisherYatesShuffle(options, 12345);
 * const shuffled2 = fisherYatesShuffle(options, 12345);
 * // shuffled1 and shuffled2 will be identical
 * ```
 */
export function fisherYatesShuffle<T>(array: T[], seed?: number): T[] {
  // Validate input
  if (!Array.isArray(array)) {
    throw new Error("Input must be an array");
  }

  // Empty or single-element arrays don't need shuffling
  if (array.length <= 1) {
    return [...array];
  }

  // Create a copy to avoid mutating the original
  const shuffled = [...array];

  // Use seeded RNG if seed is provided, otherwise use Math.random
  const rng = seed !== undefined ? seedRandom(seed) : Math.random;

  // Fisher-Yates shuffle algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Generate random index from 0 to i (inclusive)
    const j = Math.floor(rng() * (i + 1));

    // Swap elements at positions i and j
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Creates a seeded random number generator using Linear Congruential Generator (LCG)
 *
 * LCG formula: Xn+1 = (a * Xn + c) mod m
 * Parameters chosen for good distribution (common LCG values):
 * - a = 1664525
 * - c = 1013904223
 * - m = 2^32
 *
 * Note: This is NOT cryptographically secure, but sufficient for shuffling exam questions.
 *
 * @param seed - Initial seed value
 * @returns A function that returns a pseudo-random number between 0 and 1
 *
 * @example
 * ```typescript
 * const rng = seedRandom(12345);
 * console.log(rng()); // 0.39675...
 * console.log(rng()); // 0.78234...
 * ```
 */
function seedRandom(seed: number): () => number {
  let state = seed;

  return () => {
    // LCG formula
    state = (state * 1664525 + 1013904223) % Math.pow(2, 32);

    // Normalize to [0, 1)
    return state / Math.pow(2, 32);
  };
}

/**
 * Utility function to check if two arrays contain the same elements
 * (useful for testing shuffle correctness)
 *
 * @param arr1 - First array
 * @param arr2 - Second array
 * @returns True if arrays contain same elements (order-independent)
 */
export function hasSameElements<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) return false;

  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();

  return sorted1.every((val, idx) => val === sorted2[idx]);
}

/**
 * Shuffles multiple arrays in sync (same permutation applied to all)
 *
 * Useful when you need to shuffle parallel arrays while maintaining
 * their correspondence. For example, shuffling questions and their answers together.
 *
 * @param arrays - Arrays to shuffle in sync
 * @param seed - Optional seed for reproducibility
 * @returns Shuffled arrays
 *
 * @example
 * ```typescript
 * const questions = ["Q1", "Q2", "Q3"];
 * const answers = ["A1", "A2", "A3"];
 * const [shuffledQ, shuffledA] = shuffleInSync([questions, answers], 123);
 * // Both arrays shuffled with same permutation
 * ```
 */
export function shuffleInSync<T>(
  arrays: T[][],
  seed?: number
): T[][] {
  if (arrays.length === 0) return [];

  const length = arrays[0].length;

  // Validate all arrays have same length
  if (!arrays.every((arr) => arr.length === length)) {
    throw new Error("All arrays must have the same length for sync shuffle");
  }

  // Generate shuffle indices
  const indices = Array.from({ length }, (_, i) => i);
  const shuffledIndices = fisherYatesShuffle(indices, seed);

  // Apply same permutation to all arrays
  return arrays.map((arr) => shuffledIndices.map((i) => arr[i]));
}
