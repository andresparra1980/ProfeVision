import { describe, it, expect } from 'vitest'
import {
  fisherYatesShuffle,
  hasSameElements,
  shuffleInSync,
} from '@/lib/ai/mastra/utils/fisher-yates'

describe('fisherYatesShuffle', () => {
  it('throws error for non-array input', () => {
    expect(() => fisherYatesShuffle(null as unknown as unknown[])).toThrow('Input must be an array')
    expect(() => fisherYatesShuffle('string' as unknown as unknown[])).toThrow('Input must be an array')
  })

  it('returns empty array for empty input', () => {
    expect(fisherYatesShuffle([])).toEqual([])
  })

  it('returns copy of single element array', () => {
    const arr = [1]
    const result = fisherYatesShuffle(arr)
    expect(result).toEqual([1])
    expect(result).not.toBe(arr) // Should be a new array
  })

  it('does not mutate original array', () => {
    const original = [1, 2, 3, 4, 5]
    const copy = [...original]
    fisherYatesShuffle(original)
    expect(original).toEqual(copy)
  })

  it('preserves all elements after shuffle', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const shuffled = fisherYatesShuffle(arr)
    expect(hasSameElements(arr, shuffled)).toBe(true)
  })

  it('produces same result with same seed', () => {
    const arr = ['A', 'B', 'C', 'D', 'E']
    const seed = 12345
    const result1 = fisherYatesShuffle(arr, seed)
    const result2 = fisherYatesShuffle(arr, seed)
    expect(result1).toEqual(result2)
  })

  it('produces different results with different seeds', () => {
    const arr = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const result1 = fisherYatesShuffle(arr, 111)
    const result2 = fisherYatesShuffle(arr, 222)
    // Very unlikely to be the same with different seeds
    expect(result1).not.toEqual(result2)
  })

  it('produces different results without seed (random)', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const results = new Set<string>()

    // Run multiple times and check we get different results
    for (let i = 0; i < 10; i++) {
      results.add(JSON.stringify(fisherYatesShuffle(arr)))
    }

    // Should have multiple different results
    expect(results.size).toBeGreaterThan(1)
  })

  it('works with different types', () => {
    const strings = ['a', 'b', 'c']
    const numbers = [1, 2, 3]
    const objects = [{ id: 1 }, { id: 2 }, { id: 3 }]

    expect(hasSameElements(strings, fisherYatesShuffle(strings))).toBe(true)
    expect(hasSameElements(numbers, fisherYatesShuffle(numbers))).toBe(true)
    expect(fisherYatesShuffle(objects)).toHaveLength(3)
  })
})

describe('hasSameElements', () => {
  it('returns true for identical arrays', () => {
    expect(hasSameElements([1, 2, 3], [1, 2, 3])).toBe(true)
  })

  it('returns true for same elements in different order', () => {
    expect(hasSameElements([1, 2, 3], [3, 1, 2])).toBe(true)
  })

  it('returns false for different lengths', () => {
    expect(hasSameElements([1, 2], [1, 2, 3])).toBe(false)
  })

  it('returns false for different elements', () => {
    expect(hasSameElements([1, 2, 3], [1, 2, 4])).toBe(false)
  })

  it('returns true for empty arrays', () => {
    expect(hasSameElements([], [])).toBe(true)
  })
})

describe('shuffleInSync', () => {
  it('returns empty array for empty input', () => {
    expect(shuffleInSync([])).toEqual([])
  })

  it('throws error when arrays have different lengths', () => {
    expect(() => shuffleInSync([[1, 2], [1, 2, 3]])).toThrow('same length')
  })

  it('shuffles all arrays with same permutation', () => {
    const questions = ['Q1', 'Q2', 'Q3']
    const answers = ['A1', 'A2', 'A3']
    const scores = [1, 2, 3]

    const [shuffledQ, shuffledA, shuffledS] = shuffleInSync(
      [questions, answers, scores],
      42 // Use seed for reproducibility
    )

    // Verify correspondence is maintained
    for (let i = 0; i < questions.length; i++) {
      const qIndex = questions.indexOf(shuffledQ[i])
      expect(shuffledA[i]).toBe(answers[qIndex])
      expect(shuffledS[i]).toBe(scores[qIndex])
    }
  })

  it('produces same result with same seed', () => {
    const arr1 = [1, 2, 3, 4]
    const arr2 = ['a', 'b', 'c', 'd']

    const result1 = shuffleInSync([arr1, arr2], 999)
    const result2 = shuffleInSync([arr1, arr2], 999)

    expect(result1).toEqual(result2)
  })

  it('preserves all elements in each array', () => {
    const arr1 = [1, 2, 3]
    const arr2 = ['a', 'b', 'c']

    const [shuffled1, shuffled2] = shuffleInSync([arr1, arr2])

    expect(hasSameElements(arr1, shuffled1)).toBe(true)
    expect(hasSameElements(arr2, shuffled2)).toBe(true)
  })
})
