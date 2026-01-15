import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { OnboardingProvider, useOnboarding } from '@/lib/contexts/onboarding-context'

// Mock dependencies
const { mockGetSession, mockSubscription, mockOnAuthStateChange } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockSubscription: { unsubscribe: vi.fn() },
  mockOnAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
}))

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
  },
}))

// Mock fetch
const globalFetch = vi.fn()
global.fetch = globalFetch

describe('useOnboarding', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <OnboardingProvider>{children}</OnboardingProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ 
      data: { session: { access_token: 'fake-token' } } 
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('fetches status on mount when authenticated', async () => {
    // Simulate auth event with the correct token
    mockOnAuthStateChange.mockImplementation((callback: any) => {
      // Pass the same token expected by the test expectation ('token')
      // Note: The mockGetSession setup in beforeEach returns 'fake-token'
      // But the context logic uses the session from getSession inside getAuthHeaders
      // So we should expect 'fake-token' OR update mockGetSession
      
      // The context implementation:
      // 1. Calls supabase.auth.getSession() inside getAuthHeaders
      
      // So we should expect 'fake-token' based on beforeEach
      
      // Trigger the listener
      callback('SIGNED_IN', { access_token: 'ignored-by-getAuthHeaders-logic' })
      return { data: { subscription: mockSubscription } }
    })

    globalFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        is_legacy_user: false,
        onboarding_status: { wizard_step: 1 },
        should_show_wizard: true
      })
    })

    const { result } = renderHook(() => useOnboarding(), { wrapper })

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.shouldShowWizard).toBe(true)
    expect(globalFetch).toHaveBeenCalledWith('/api/onboarding/status', expect.objectContaining({
      headers: expect.objectContaining({
        'Authorization': 'Bearer fake-token'
      })
    }))
  })

  it('updates optimistic state on completeWizardStep', async () => {
    // Setup initial state
    mockOnAuthStateChange.mockImplementation((callback: any) => {
      callback('SIGNED_IN', { access_token: 'token' })
      return { data: { subscription: mockSubscription } }
    })

    globalFetch.mockImplementation((url) => {
      if (url.includes('status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ onboarding_status: { wizard_step: 1 } })
        })
      }
      if (url.includes('complete-step')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ onboarding_status: { wizard_step: 2 } })
        })
      }
      return Promise.resolve({ ok: false })
    })

    const { result } = renderHook(() => useOnboarding(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Action
    await act(async () => {
      await result.current.completeWizardStep(2)
    })

    expect(result.current.onboardingStatus?.wizard_step).toBe(2)
  })

  it('handles error gracefully', async () => {
    mockOnAuthStateChange.mockImplementation((callback: any) => {
      callback('SIGNED_IN', { access_token: 'token' })
      return { data: { subscription: mockSubscription } }
    })

    globalFetch.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useOnboarding(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
  })
})
