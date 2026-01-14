import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useProfesor } from '@/lib/hooks/useProfesor'

// Mock dependencies
vi.mock('@/lib/utils/logger', () => ({
  logger: { log: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

const { mockToast } = vi.hoisted(() => ({
  mockToast: { error: vi.fn(), success: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: mockToast,
}))

const mockGetSession = vi.fn()
const mockFrom = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: { getSession: () => mockGetSession() },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

describe('useProfesor', () => {
  const mockProfesorData = {
    id: 'prof-123',
    nombres: 'Juan',
    apellidos: 'García',
    email: 'juan@test.com',
    created_at: '2026-01-01T00:00:00Z',
    subscription_tier: 'plus',
    telefono: '+1234567890',
    cargo: 'Profesor',
    biografia: 'Test bio',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockReset()
    mockFrom.mockReset()
  })

  describe('initial state', () => {
    it('starts with loading true', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

      const { result } = renderHook(() => useProfesor())

      expect(result.current.loading).toBe(true)
      expect(result.current.profesor).toBeNull()
      expect(result.current.error).toBeNull()

      // Wait for async operations to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe('no session', () => {
    it('sets profesor to null when no session', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

      const { result } = renderHook(() => useProfesor())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.profesor).toBeNull()
      expect(result.current.error).toBeNull()
    })
  })

  describe('session error', () => {
    it('sets error when getSession fails', async () => {
      const sessionError = new Error('Session error')
      mockGetSession.mockResolvedValue({ data: { session: null }, error: sessionError })

      const { result } = renderHook(() => useProfesor())

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe('successful fetch', () => {
    const mockSession = {
      access_token: 'test-token',
      user: { id: 'prof-123' },
    }

    it('fetches profesor data on mount', async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null })

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfesorData, error: null }),
      }
      mockFrom.mockReturnValue(mockChain)

      const { result } = renderHook(() => useProfesor())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.profesor).toEqual(mockProfesorData)
      expect(mockFrom).toHaveBeenCalledWith('profesores')
      expect(mockChain.select).toHaveBeenCalledWith('*')
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'prof-123')
    })

    it('handles profesor fetch error', async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null })

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
      }
      mockFrom.mockReturnValue(mockChain)

      const { result } = renderHook(() => useProfesor())

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe('updateProfesor', () => {
    const mockSession = {
      access_token: 'test-token',
      user: { id: 'prof-123' },
    }

    it('updates profesor data successfully', async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null })

      const updatedProfesor = { ...mockProfesorData, nombres: 'Pedro' }

      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfesorData, error: null }),
      }

      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedProfesor, error: null }),
      }

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        // First call is initial fetch with select, subsequent is update
        return callCount === 1 ? selectChain : updateChain
      })

      const { result } = renderHook(() => useProfesor())

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Now update
      let updateResult: { success: boolean; data?: unknown }
      await act(async () => {
        updateResult = await result.current.updateProfesor({ nombres: 'Pedro' })
      })

      expect(updateResult!.success).toBe(true)
      expect(mockToast.success).toHaveBeenCalled()
    })

    it('handles update error with no session', async () => {
      // Initial load - no session
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

      const { result } = renderHook(() => useProfesor())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Try to update without session
      let updateResult: { success: boolean; error?: Error }
      await act(async () => {
        updateResult = await result.current.updateProfesor({ nombres: 'Test' })
      })

      expect(updateResult!.success).toBe(false)
      expect(mockToast.error).toHaveBeenCalled()
    })

    it('handles update database error', async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null })

      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfesorData, error: null }),
      }

      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
      }

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        return callCount === 1 ? selectChain : updateChain
      })

      const { result } = renderHook(() => useProfesor())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let updateResult: { success: boolean; error?: Error }
      await act(async () => {
        updateResult = await result.current.updateProfesor({ nombres: 'Test' })
      })

      expect(updateResult!.success).toBe(false)
      expect(mockToast.error).toHaveBeenCalled()
    })
  })

  describe('profesor type', () => {
    it('includes optional fields in profesor data', async () => {
      const mockSession = { user: { id: 'prof-123' } }
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null })

      const profesorWithOptionalFields = {
        ...mockProfesorData,
        telefono: '+1234567890',
        cargo: 'Director',
        biografia: 'Experienced teacher',
      }

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: profesorWithOptionalFields, error: null }),
      }
      mockFrom.mockReturnValue(mockChain)

      const { result } = renderHook(() => useProfesor())

      await waitFor(() => {
        expect(result.current.profesor).not.toBeNull()
      })

      expect(result.current.profesor?.telefono).toBe('+1234567890')
      expect(result.current.profesor?.cargo).toBe('Director')
      expect(result.current.profesor?.biografia).toBe('Experienced teacher')
    })
  })
})
