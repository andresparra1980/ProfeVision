import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/onboarding/complete-step/route'
import { NextRequest } from 'next/server'
import { verifyTeacherAuth } from '@/lib/auth/verify-teacher'

// Mocks
vi.mock('@/lib/auth/verify-teacher', () => ({
  verifyTeacherAuth: vi.fn(),
}))

const mockRpc = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    rpc: mockRpc,
  }),
}))

vi.mock('@/lib/utils/logger', () => ({
  default: { error: vi.fn() },
}))

describe('API: /api/onboarding/complete-step', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(verifyTeacherAuth).mockResolvedValue({
      user: { id: 'teacher-123' },
      profesor: { id: 'teacher-123' },
    })
  })

  it('advances wizard step', async () => {
    mockRpc.mockResolvedValue({ data: { wizard_step: 2 }, error: null })

    const req = new NextRequest('http://localhost/api/onboarding/complete-step', {
      method: 'POST',
      body: JSON.stringify({ step: 'wizard', wizard_step: 2 })
    })

    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockRpc).toHaveBeenCalledWith('update_onboarding_status', expect.objectContaining({
      p_status_json: { wizard_step: 2 }
    }))
  })

  it('handles skip logic', async () => {
    mockRpc.mockResolvedValue({ data: { skipped: true }, error: null })

    const req = new NextRequest('http://localhost/api/onboarding/complete-step', {
      method: 'POST',
      body: JSON.stringify({ step: 'wizard', skip: true, skip_reason: 'busy' })
    })

    await POST(req)

    expect(mockRpc).toHaveBeenCalledWith('update_onboarding_status', expect.objectContaining({
      p_status_json: expect.objectContaining({
        skipped: true,
        skip_reason: 'busy',
        wizard_completed: true
      })
    }))
  })

  it('updates checklist item', async () => {
    mockRpc.mockResolvedValue({ data: { checklist_items: { exam_created: true } }, error: null })

    const req = new NextRequest('http://localhost/api/onboarding/complete-step', {
      method: 'POST',
      body: JSON.stringify({ step: 'checklist_item', checklist_item: 'exam_created' })
    })

    await POST(req)

    expect(mockRpc).toHaveBeenCalledWith('update_onboarding_status', expect.objectContaining({
      p_status_json: { checklist_items: { exam_created: true } }
    }))
  })

  it('marks completed when step > 5', async () => {
    mockRpc.mockResolvedValue({ data: {}, error: null })

    const req = new NextRequest('http://localhost/api/onboarding/complete-step', {
      method: 'POST',
      body: JSON.stringify({ step: 'wizard', wizard_step: 6 })
    })

    await POST(req)

    expect(mockRpc).toHaveBeenCalledWith('update_onboarding_status', expect.objectContaining({
      p_status_json: expect.objectContaining({
        wizard_completed: true
      })
    }))
  })
})
