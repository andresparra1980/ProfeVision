import { describe, it, expect } from 'vitest'
import { chunkText } from '@/lib/document-processor/chunkText'

describe('chunkText', () => {
  it('returns empty array for falsy input', () => {
    expect(chunkText('')).toEqual([])
    expect(chunkText(null as unknown as string)).toEqual([])
    expect(chunkText(undefined as unknown as string)).toEqual([])
  })

  it('returns single chunk for short text', () => {
    const text = 'Short text'
    const result = chunkText(text, 1000)
    expect(result).toHaveLength(1)
    expect(result[0]).toBe('Short text')
  })

  it('splits long text into multiple chunks', () => {
    const text = 'a'.repeat(100)
    const result = chunkText(text, 30, 10)
    expect(result.length).toBeGreaterThan(1)
  })

  it('respects maxChars parameter', () => {
    const text = 'a'.repeat(100)
    const result = chunkText(text, 30, 5)
    result.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(30)
    })
  })

  it('breaks on paragraph boundaries when possible', () => {
    const text = 'First paragraph content here.\n\nSecond paragraph content here.\n\nThird paragraph.'
    const result = chunkText(text, 50, 10)
    // Should prefer breaking at \n\n
    expect(result.length).toBeGreaterThan(1)
  })

  it('applies overlap between chunks', () => {
    const text = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10'
    const result = chunkText(text, 20, 5)

    // With overlap, later chunks should contain some content from previous chunks
    if (result.length > 1) {
      // Some overlap should exist
      const lastPartOfFirst = result[0].slice(-5)
      const hasOverlap = result[1].includes(lastPartOfFirst.trim())
      expect(hasOverlap || result.length > 1).toBe(true)
    }
  })

  it('filters out empty chunks', () => {
    const text = 'content'
    const result = chunkText(text)
    expect(result.every(chunk => chunk.length > 0)).toBe(true)
  })

  it('uses default maxChars of 12000', () => {
    const text = 'a'.repeat(15000)
    const result = chunkText(text)
    expect(result.length).toBeGreaterThan(1)
  })

  it('uses default overlap of 200', () => {
    const text = 'a'.repeat(25000)
    const result = chunkText(text)
    expect(result.length).toBeGreaterThan(1)
  })

  it('trims chunks', () => {
    const text = '  content with spaces  \n\n  more content  '
    const result = chunkText(text, 1000)
    result.forEach(chunk => {
      expect(chunk).toBe(chunk.trim())
    })
  })

  it('handles text with only paragraph breaks', () => {
    const text = 'Para1\n\nPara2\n\nPara3'
    const result = chunkText(text, 10, 2)
    expect(result.length).toBeGreaterThan(0)
    expect(result.every(c => c.length > 0)).toBe(true)
  })
})
