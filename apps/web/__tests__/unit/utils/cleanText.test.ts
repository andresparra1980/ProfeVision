import { describe, it, expect } from 'vitest'
import { cleanText } from '@/lib/document-processor/cleanText'

describe('cleanText', () => {
  it('returns empty string for falsy input', () => {
    expect(cleanText('')).toBe('')
    expect(cleanText(null as unknown as string)).toBe('')
    expect(cleanText(undefined as unknown as string)).toBe('')
  })

  it('normalizes Windows line endings to Unix', () => {
    expect(cleanText('line1\r\nline2')).toBe('line1\nline2')
    expect(cleanText('line1\rline2')).toBe('line1\nline2')
  })

  it('collapses 3+ newlines to double newline', () => {
    expect(cleanText('a\n\n\nb')).toBe('a\n\nb')
    expect(cleanText('a\n\n\n\n\nb')).toBe('a\n\nb')
  })

  it('preserves double newlines (paragraph breaks)', () => {
    expect(cleanText('a\n\nb')).toBe('a\n\nb')
  })

  it('collapses multiple spaces to single space', () => {
    expect(cleanText('word1    word2')).toBe('word1 word2')
    expect(cleanText('a  b   c    d')).toBe('a b c d')
  })

  it('collapses multiple tabs to single space', () => {
    expect(cleanText('word1\t\tword2')).toBe('word1 word2')
    // Single tab is NOT collapsed (only 2+ consecutive tabs/spaces)
    expect(cleanText('a\tb')).toBe('a\tb')
  })

  it('trims surrounding whitespace', () => {
    expect(cleanText('  text  ')).toBe('text')
    expect(cleanText('\n\ntext\n\n')).toBe('text')
  })

  it('handles mixed whitespace scenarios', () => {
    const input = '  \r\n  Hello    world  \n\n\n\n  How are you?  \r\n  '
    // Note: trailing space after "world" remains as single space before newline
    const expected = 'Hello world \n\n How are you?'
    expect(cleanText(input)).toBe(expected)
  })

  it('preserves single newlines', () => {
    expect(cleanText('line1\nline2')).toBe('line1\nline2')
  })
})
