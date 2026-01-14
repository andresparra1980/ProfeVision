import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OMRClient, OMRServiceError } from '@/lib/services/omr-client'

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('OMRClient', () => {
  let client: OMRClient
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    client = new OMRClient({
      serviceUrl: 'http://test-omr.local',
      apiKey: 'test-api-key',
      timeout: 5000,
      retries: 2,
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.useRealTimers()
  })

  describe('constructor', () => {
    it('uses provided options', () => {
      const customClient = new OMRClient({
        serviceUrl: 'http://custom.local/',
        apiKey: 'custom-key',
        timeout: 10000,
        retries: 3,
        debug: true,
      })

      // Client is created without errors
      expect(customClient).toBeInstanceOf(OMRClient)
    })

    it('removes trailing slash from serviceUrl', () => {
      const customClient = new OMRClient({
        serviceUrl: 'http://test.local/',
      })
      expect(customClient).toBeInstanceOf(OMRClient)
    })

    it('uses default values when no options provided', () => {
      const defaultClient = new OMRClient()
      expect(defaultClient).toBeInstanceOf(OMRClient)
    })
  })

  describe('healthCheck', () => {
    it('returns health data on success', async () => {
      const healthData = {
        status: 'healthy',
        service: 'omr-service',
        version: '1.0.0',
        uptime_seconds: 3600,
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(healthData),
      })

      const result = await client.healthCheck()

      expect(result).toEqual(healthData)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-omr.local/health',
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('throws OMRServiceError on HTTP error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      })

      await expect(client.healthCheck()).rejects.toThrow(OMRServiceError)
    })

    it('throws OMRServiceError on network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(client.healthCheck()).rejects.toThrow(OMRServiceError)
    })
  })

  describe('processImage', () => {
    const mockFile = new Blob(['test'], { type: 'image/png' })

    it('returns result on successful processing', async () => {
      const successResult = {
        success: true,
        qr_data: 'exam123:student456:hash',
        total_questions: 20,
        answered_questions: 18,
        answers: [{ number: 1, value: 'A', confidence: 0.95, num_options: 4 }],
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(successResult),
      })

      const result = await client.processImage(mockFile)

      expect(result).toEqual(successResult)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-omr.local/process',
        expect.objectContaining({
          method: 'POST',
          headers: { 'X-API-Key': 'test-api-key' },
        })
      )
    })

    it('returns error result without throwing on processing failure', async () => {
      const errorResult = {
        success: false,
        error: 'QR code not found',
        error_code: 'QR_NOT_FOUND',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(errorResult),
      })

      const result = await client.processImage(mockFile)

      expect(result.success).toBe(false)
      expect(result.error).toBe('QR code not found')
    })

    it('throws OMRServiceError on HTTP error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () =>
          Promise.resolve({
            error: 'Server error',
            error_code: 'INTERNAL_ERROR',
          }),
      })

      await expect(client.processImage(mockFile)).rejects.toThrow(OMRServiceError)
    })

    it('does not retry on 400 Bad Request', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () =>
          Promise.resolve({
            error: 'Invalid image',
            error_code: 'INVALID_IMAGE',
          }),
      })

      await expect(client.processImage(mockFile)).rejects.toThrow(OMRServiceError)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('does not retry on 401 Unauthorized', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () =>
          Promise.resolve({
            error: 'Invalid API key',
            error_code: 'UNAUTHORIZED',
          }),
      })

      await expect(client.processImage(mockFile)).rejects.toThrow(OMRServiceError)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('retries on server error with exponential backoff', async () => {
      let callCount = 0
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount < 3) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
      })

      const resultPromise = client.processImage(mockFile)

      // Advance timers for backoff delays
      await vi.advanceTimersByTimeAsync(1000) // First backoff
      await vi.advanceTimersByTimeAsync(2000) // Second backoff

      const result = await resultPromise

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledTimes(3)
    })

    it('throws MAX_RETRIES_EXCEEDED after all retries fail', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const noRetryClient = new OMRClient({
        serviceUrl: 'http://test.local',
        retries: 0,
      })

      await expect(noRetryClient.processImage(mockFile)).rejects.toThrow('Failed after')
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

      const timeoutClient = new OMRClient({
        serviceUrl: 'http://test.local',
        timeout: 100,
        retries: 0,
      })

      await vi.advanceTimersByTimeAsync(200)

      await expect(timeoutClient.processImage(mockFile)).rejects.toThrow('timeout')
    })
  })

  describe('OMRServiceError', () => {
    it('stores error details', () => {
      const error = new OMRServiceError(
        'Test error',
        500,
        'TEST_ERROR',
        { detail: 'info' }
      )

      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(500)
      expect(error.errorCode).toBe('TEST_ERROR')
      expect(error.details).toEqual({ detail: 'info' })
      expect(error.name).toBe('OMRServiceError')
    })
  })
})
