import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useTierLimits } from '@/lib/hooks/useTierLimits'

// Mock dependencies
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: { log: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

const mockGetSession = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: { getSession: () => mockGetSession() },
  },
}))

describe('useTierLimits', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    mockPush.mockClear()
    mockGetSession.mockReset()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  describe('initial state', () => {
    it('starts with loading true and null usage', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

      const { result } = renderHook(() => useTierLimits())

      expect(result.current.loading).toBe(true)
      expect(result.current.usage).toBeNull()
      expect(result.current.error).toBeNull()

      // Wait for async effect to complete to avoid "not wrapped in act" warning
      await waitFor(() => {
        // Just waiting for loading to stabilize, even if it changes
      })
    })
  })

  describe('no session', () => {
    it('redirects to login when no session', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

      renderHook(() => useTierLimits())

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
      })
    })
  })

  describe('session error', () => {
    it('sets error when getSession fails', async () => {
      const sessionError = new Error('Session error')
      mockGetSession.mockResolvedValue({ data: { session: null }, error: sessionError })

      const { result } = renderHook(() => useTierLimits())

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe('successful fetch', () => {
    const mockSession = {
      access_token: 'test-token',
      user: { id: 'user-123' },
    }

    const mockUsageData = {
      tier: { name: 'plus', display_name: 'Plus' },
      subscription_status: 'active',
      ai_generation: { used: 10, limit: 100, percentage: 10, remaining: 90 },
      scans: { used: 50, limit: 500, percentage: 10, remaining: 450 },
      cycle: { start: '2026-01-01', end: '2026-02-01', daysUntilReset: 18 },
    }

    it('fetches and sets usage data', async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockUsageData),
      })

      const { result } = renderHook(() => useTierLimits())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.usage).toEqual(mockUsageData)
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/tiers/usage', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
      })
    })

    it('redirects on 401 response', async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      })

      renderHook(() => useTierLimits())

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
      })
    })

    it('sets error on API failure', async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      })

      const { result } = renderHook(() => useTierLimits())

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe('canUseScan', () => {
    const mockSession = { access_token: 'token', user: { id: 'u1' } }

    it('returns false when no usage data', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

      const { result } = renderHook(() => useTierLimits())

      await waitFor(() => {
        expect(result.current.canUseScan()).toBe(false)
      })
    })

    it('returns true when scans remaining', async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            tier: { name: 'plus', display_name: 'Plus' },
            subscription_status: 'active',
            ai_generation: { used: 0, limit: 100, percentage: 0, remaining: 100 },
            scans: { used: 10, limit: 100, percentage: 10, remaining: 90 },
            cycle: { start: '2026-01-01', end: '2026-02-01', daysUntilReset: 18 },
          }),
      })

      const { result } = renderHook(() => useTierLimits())

      await waitFor(() => {
        expect(result.current.usage).not.toBeNull()
      })

      expect(result.current.canUseScan()).toBe(true)
    })

    it('returns false when scans at limit', async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            tier: { name: 'free', display_name: 'Free' },
            subscription_status: 'active',
            ai_generation: { used: 0, limit: 10, percentage: 0, remaining: 10 },
            scans: { used: 50, limit: 50, percentage: 100, remaining: 0 },
            cycle: { start: '2026-01-01', end: '2026-02-01', daysUntilReset: 18 },
          }),
      })

      const { result } = renderHook(() => useTierLimits())

      await waitFor(() => {
        expect(result.current.usage).not.toBeNull()
      })

      expect(result.current.canUseScan()).toBe(false)
    })

    it('returns true when limit is unlimited (-1)', async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            tier: { name: 'admin', display_name: 'Admin' },
            subscription_status: 'active',
            ai_generation: { used: 999, limit: -1, percentage: 0, remaining: -1 },
            scans: { used: 9999, limit: -1, percentage: 0, remaining: -1 },
            cycle: { start: '2026-01-01', end: '2026-02-01', daysUntilReset: 18 },
          }),
      })

      const { result } = renderHook(() => useTierLimits())

      await waitFor(() => {
        expect(result.current.usage).not.toBeNull()
      })

      expect(result.current.canUseScan()).toBe(true)
    })
  })

  describe('canUseAI', () => {
    const mockSession = { access_token: 'token', user: { id: 'u1' } }

    it('returns false when no usage data', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

      const { result } = renderHook(() => useTierLimits())

      await waitFor(() => {
        expect(result.current.canUseAI()).toBe(false)
      })
    })

    it('returns true when AI generations remaining', async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            tier: { name: 'plus', display_name: 'Plus' },
            subscription_status: 'active',
            ai_generation: { used: 5, limit: 100, percentage: 5, remaining: 95 },
            scans: { used: 0, limit: 500, percentage: 0, remaining: 500 },
            cycle: { start: '2026-01-01', end: '2026-02-01', daysUntilReset: 18 },
          }),
      })

      const { result } = renderHook(() => useTierLimits())

      await waitFor(() => {
        expect(result.current.usage).not.toBeNull()
      })

      expect(result.current.canUseAI()).toBe(true)
    })

    it('returns false when AI at limit', async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            tier: { name: 'free', display_name: 'Free' },
            subscription_status: 'active',
            ai_generation: { used: 10, limit: 10, percentage: 100, remaining: 0 },
            scans: { used: 0, limit: 50, percentage: 0, remaining: 50 },
            cycle: { start: '2026-01-01', end: '2026-02-01', daysUntilReset: 18 },
          }),
      })

      const { result } = renderHook(() => useTierLimits())

      await waitFor(() => {
        expect(result.current.usage).not.toBeNull()
      })

      expect(result.current.canUseAI()).toBe(false)
    })

    it('returns true when AI limit is unlimited (-1)', async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            tier: { name: 'admin', display_name: 'Admin' },
            subscription_status: 'active',
            ai_generation: { used: 999, limit: -1, percentage: 0, remaining: -1 },
            scans: { used: 0, limit: -1, percentage: 0, remaining: -1 },
            cycle: { start: '2026-01-01', end: '2026-02-01', daysUntilReset: 18 },
          }),
      })

      const { result } = renderHook(() => useTierLimits())

      await waitFor(() => {
        expect(result.current.usage).not.toBeNull()
      })

      expect(result.current.canUseAI()).toBe(true)
    })
  })

  describe('refetch', () => {
    it('allows manual refetch of data', async () => {
      const mockSession = { access_token: 'token', user: { id: 'u1' } }
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null })

      let fetchCount = 0
      global.fetch = vi.fn().mockImplementation(() => {
        fetchCount++
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              tier: { name: 'plus', display_name: 'Plus' },
              subscription_status: 'active',
              ai_generation: { used: fetchCount * 10, limit: 100, percentage: fetchCount * 10, remaining: 100 - fetchCount * 10 },
              scans: { used: 0, limit: 500, percentage: 0, remaining: 500 },
              cycle: { start: '2026-01-01', end: '2026-02-01', daysUntilReset: 18 },
            }),
        })
      })

      const { result } = renderHook(() => useTierLimits())

      await waitFor(() => {
        expect(result.current.usage?.ai_generation.used).toBe(10)
      })

      await act(async () => {
        result.current.refetch()
      })

      await waitFor(() => {
        expect(result.current.usage?.ai_generation.used).toBe(20)
      })
    })
  })
})
