import { describe, it, expect } from 'vitest'

describe('Vitest Setup', () => {
  it('should run tests', () => {
    expect(true).toBe(true)
  })

  it('should handle async tests', async () => {
    const result = await Promise.resolve(42)
    expect(result).toBe(42)
  })
})
