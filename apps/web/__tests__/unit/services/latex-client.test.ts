import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LaTeXClient, LaTeXServiceError } from '@/lib/services/latex-client'

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('LaTeXClient', () => {
  let client: LaTeXClient
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    client = new LaTeXClient({
      serviceUrl: 'http://test-latex.local',
      apiKey: 'test-api-key',
      timeout: 5000,
      retries: 1,
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.useRealTimers()
  })

  describe('constructor', () => {
    it('uses provided options', () => {
      const customClient = new LaTeXClient({
        serviceUrl: 'http://custom.local',
        apiKey: 'custom-key',
        timeout: 60000,
        retries: 2,
      })

      expect(customClient).toBeInstanceOf(LaTeXClient)
    })

    it('uses defaults when no options provided', () => {
      const defaultClient = new LaTeXClient()
      expect(defaultClient).toBeInstanceOf(LaTeXClient)
    })
  })

  describe('compile', () => {
    const validTex = '\\documentclass{article}\\begin{document}Hello\\end{document}'

    it('returns PDF buffer on successful compilation', async () => {
      const pdfContent = new Uint8Array([0x25, 0x50, 0x44, 0x46]) // %PDF header
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(pdfContent.buffer),
        headers: new Headers({
          'X-Compile-Time-Ms': '1500',
          'X-PDF-Size-Bytes': '4',
        }),
      })

      const result = await client.compile({ tex: validTex })

      expect(result).toBeInstanceOf(Buffer)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-latex.local/compile',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'test-api-key',
          },
        })
      )
    })

    it('uses default jobName of "exam"', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        headers: new Headers(),
      })

      await client.compile({ tex: validTex })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"job_name":"exam"'),
        })
      )
    })

    it('uses custom jobName when provided', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        headers: new Headers(),
      })

      await client.compile({ tex: validTex, jobName: 'custom-exam' })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"job_name":"custom-exam"'),
        })
      )
    })

    it('throws INVALID_INPUT for empty tex', async () => {
      await expect(client.compile({ tex: '' })).rejects.toThrow(LaTeXServiceError)
      await expect(client.compile({ tex: '   ' })).rejects.toThrow('required')
    })

    it('throws LaTeXServiceError on compilation error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () =>
          Promise.resolve({
            error: 'LaTeX syntax error',
            error_code: 'COMPILATION_ERROR',
            log: 'Error on line 5',
          }),
      })

      const error = await client.compile({ tex: validTex }).catch((e) => e)

      expect(error).toBeInstanceOf(LaTeXServiceError)
      expect(error.code).toBe('COMPILATION_ERROR')
      expect(error.log).toBe('Error on line 5')
    })

    it('handles non-JSON error responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: () => Promise.resolve('Internal Server Error'),
      })

      await expect(client.compile({ tex: validTex })).rejects.toThrow(LaTeXServiceError)
    })

    it('does not retry on 4xx client errors (except timeout)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () =>
          Promise.resolve({
            error: 'Bad request',
            error_code: 'BAD_REQUEST',
          }),
      })

      await expect(client.compile({ tex: validTex })).rejects.toThrow(LaTeXServiceError)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('retries on 5xx server errors', async () => {
      let callCount = 0
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 500,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ error: 'Server error' }),
          })
        }
        return Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
          headers: new Headers(),
        })
      })

      const resultPromise = client.compile({ tex: validTex })

      // Advance timers for backoff
      await vi.advanceTimersByTimeAsync(2000)

      const result = await resultPromise

      expect(result).toBeInstanceOf(Buffer)
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('throws TIMEOUT error on request timeout', async () => {
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((_, reject) => {
            const error = new Error('Aborted')
            error.name = 'AbortError'
            setTimeout(() => reject(error), 100)
          })
      )

      const timeoutClient = new LaTeXClient({
        serviceUrl: 'http://test.local',
        timeout: 100,
        retries: 0,
      })

      await vi.advanceTimersByTimeAsync(200)

      await expect(timeoutClient.compile({ tex: validTex })).rejects.toThrow('timeout')
    })

    it('throws NETWORK_ERROR on network failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network failed'))

      const noRetryClient = new LaTeXClient({
        serviceUrl: 'http://test.local',
        retries: 0,
      })

      await expect(noRetryClient.compile({ tex: validTex })).rejects.toThrow('Network')
    })
  })

  describe('healthCheck', () => {
    it('returns true when service is healthy', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' }),
      })

      const result = await client.healthCheck()

      expect(result).toBe(true)
    })

    it('returns false when service is unhealthy', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'unhealthy' }),
      })

      const result = await client.healthCheck()

      expect(result).toBe(false)
    })

    it('returns false on HTTP error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      })

      const result = await client.healthCheck()

      expect(result).toBe(false)
    })

    it('returns false on network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await client.healthCheck()

      expect(result).toBe(false)
    })
  })

  describe('LaTeXServiceError', () => {
    it('stores all error properties', () => {
      const error = new LaTeXServiceError(
        'Compilation failed',
        'COMPILATION_ERROR',
        400,
        { line: 5 },
        'Error log here'
      )

      expect(error.message).toBe('Compilation failed')
      expect(error.code).toBe('COMPILATION_ERROR')
      expect(error.statusCode).toBe(400)
      expect(error.details).toEqual({ line: 5 })
      expect(error.log).toBe('Error log here')
      expect(error.name).toBe('LaTeXServiceError')
    })
  })
})
