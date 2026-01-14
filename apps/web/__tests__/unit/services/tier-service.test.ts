import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TierService, type SubscriptionTier } from '@/lib/services/tier-service'

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  default: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Helper to create mock Supabase client
const createMockSupabase = () => {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  }

  return {
    rpc: vi.fn(),
    from: vi.fn(() => mockChain),
    _chain: mockChain,
  }
}

describe('TierService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
  })

  describe('checkFeatureAccess', () => {
    it('returns feature limit check data on success', async () => {
      const expectedData = {
        allowed: true,
        limit: 100,
        used: 50,
        remaining: 50,
        tier: 'plus' as SubscriptionTier,
        cycle_end: '2026-02-14',
      }

      mockSupabase.rpc.mockResolvedValue({ data: expectedData, error: null })

      const result = await TierService.checkFeatureAccess(
        mockSupabase as never,
        'profesor-123',
        'ai_generation'
      )

      expect(result).toEqual(expectedData)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('check_feature_limit', {
        p_profesor_id: 'profesor-123',
        p_feature: 'ai_generation',
      })
    })

    it('throws error when RPC fails', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      })

      await expect(
        TierService.checkFeatureAccess(mockSupabase as never, 'prof-123', 'scan')
      ).rejects.toThrow('Failed to check feature limit')
    })
  })

  describe('incrementUsage', () => {
    it('returns success true when increment succeeds', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      })

      const result = await TierService.incrementUsage(
        mockSupabase as never,
        'prof-123',
        'ai_generation',
        1
      )

      expect(result.success).toBe(true)
    })

    it('returns success false when RPC function missing', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'function does not exist', code: '42883' },
      })

      const result = await TierService.incrementUsage(
        mockSupabase as never,
        'prof-123',
        'scan'
      )

      expect(result.success).toBe(false)
    })

    it('uses default amount of 1', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: { success: true }, error: null })

      await TierService.incrementUsage(mockSupabase as never, 'prof-123', 'scan')

      expect(mockSupabase.rpc).toHaveBeenCalledWith('increment_feature_usage', {
        p_profesor_id: 'prof-123',
        p_feature: 'scan',
        p_amount: 1,
      })
    })

    it('handles network errors gracefully', async () => {
      mockSupabase.rpc.mockRejectedValue(new Error('fetch failed'))

      const result = await TierService.incrementUsage(
        mockSupabase as never,
        'prof-123',
        'ai_generation'
      )

      expect(result.success).toBe(false)
    })
  })

  describe('getTierLimits', () => {
    it('returns tier limits on success', async () => {
      const mockLimits = {
        tier: 'plus',
        ai_generations_per_month: 100,
        scans_per_month: 500,
        max_students: 1000,
        max_groups: 50,
        features: {
          export_pdf: true,
          export_latex: true,
          priority_support: true,
          bulk_operations: true,
        },
      }

      mockSupabase._chain.single.mockResolvedValue({ data: mockLimits, error: null })

      const result = await TierService.getTierLimits(mockSupabase as never, 'plus')

      expect(result).toEqual(mockLimits)
    })

    it('throws error when fetch fails', async () => {
      mockSupabase._chain.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      })

      await expect(
        TierService.getTierLimits(mockSupabase as never, 'free')
      ).rejects.toThrow('Failed to fetch tier limits')
    })
  })

  describe('getCurrentTier', () => {
    it('returns current tier', async () => {
      mockSupabase._chain.single.mockResolvedValue({
        data: { subscription_tier: 'plus' },
        error: null,
      })

      const result = await TierService.getCurrentTier(mockSupabase as never, 'prof-123')

      expect(result).toBe('plus')
    })

    it('returns free as default when no tier set', async () => {
      mockSupabase._chain.single.mockResolvedValue({
        data: { subscription_tier: null },
        error: null,
      })

      const result = await TierService.getCurrentTier(mockSupabase as never, 'prof-123')

      expect(result).toBe('free')
    })

    it('throws error on fetch failure', async () => {
      mockSupabase._chain.single.mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      })

      await expect(
        TierService.getCurrentTier(mockSupabase as never, 'prof-123')
      ).rejects.toThrow('Failed to fetch current tier')
    })
  })

  describe('getSubscriptionStatus', () => {
    it('returns subscription status', async () => {
      mockSupabase._chain.single.mockResolvedValue({
        data: { subscription_status: 'active' },
        error: null,
      })

      const result = await TierService.getSubscriptionStatus(mockSupabase as never, 'prof-123')

      expect(result).toBe('active')
    })

    it('returns active as default', async () => {
      mockSupabase._chain.single.mockResolvedValue({
        data: { subscription_status: null },
        error: null,
      })

      const result = await TierService.getSubscriptionStatus(mockSupabase as never, 'prof-123')

      expect(result).toBe('active')
    })
  })

  describe('shouldShowWelcome', () => {
    it('returns true when first_login_completed is false', async () => {
      mockSupabase._chain.single.mockResolvedValue({
        data: { first_login_completed: false },
        error: null,
      })

      const result = await TierService.shouldShowWelcome(mockSupabase as never, 'prof-123')

      expect(result).toBe(true)
    })

    it('returns false when first_login_completed is true', async () => {
      mockSupabase._chain.single.mockResolvedValue({
        data: { first_login_completed: true },
        error: null,
      })

      const result = await TierService.shouldShowWelcome(mockSupabase as never, 'prof-123')

      expect(result).toBe(false)
    })
  })

  describe('completeWelcome', () => {
    it('returns success true on update', async () => {
      mockSupabase._chain.eq.mockResolvedValue({ error: null })

      const result = await TierService.completeWelcome(mockSupabase as never, 'prof-123')

      expect(result.success).toBe(true)
    })

    it('throws error on update failure', async () => {
      mockSupabase._chain.eq.mockResolvedValue({ error: { message: 'Update failed' } })

      await expect(
        TierService.completeWelcome(mockSupabase as never, 'prof-123')
      ).rejects.toThrow('Failed to complete welcome')
    })
  })

  describe('isAdmin', () => {
    it('returns true for admin tier', async () => {
      mockSupabase._chain.single.mockResolvedValue({
        data: { subscription_tier: 'admin' },
        error: null,
      })

      const result = await TierService.isAdmin(mockSupabase as never, 'prof-123')

      expect(result).toBe(true)
    })

    it('returns false for non-admin tier', async () => {
      mockSupabase._chain.single.mockResolvedValue({
        data: { subscription_tier: 'plus' },
        error: null,
      })

      const result = await TierService.isAdmin(mockSupabase as never, 'prof-123')

      expect(result).toBe(false)
    })

    it('returns false on error', async () => {
      mockSupabase._chain.single.mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      })

      const result = await TierService.isAdmin(mockSupabase as never, 'prof-123')

      expect(result).toBe(false)
    })
  })
})
