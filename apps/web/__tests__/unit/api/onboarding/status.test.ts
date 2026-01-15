import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PATCH } from '@/app/api/onboarding/status/route'
import { NextRequest } from 'next/server'

// Mock verifyTeacherAuth
vi.mock('@/lib/auth/verify-teacher', () => ({
  verifyTeacherAuth: vi.fn(),
}))

// Mock Supabase
const mockSingle = vi.fn()
const mockEq = vi.fn(() => ({ single: mockSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))
const mockRpc = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: mockFrom,
    rpc: mockRpc,
  }),
}))

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  default: { error: vi.fn() },
}))

import { verifyTeacherAuth } from '@/lib/auth/verify-teacher'

describe('API: /api/onboarding/status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default auth mock
    vi.mocked(verifyTeacherAuth).mockResolvedValue({ 
      user: { id: 'teacher-123' },
      aud: 'authenticated',
      role: 'authenticated',
      app_metadata: {},
      user_metadata: {},
      created_at: '',
    })
  })

  describe('GET', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(verifyTeacherAuth).mockRejectedValue(new Error('Auth failed'))
      const req = new NextRequest('http://localhost/api/onboarding/status')
      
      const res = await GET(req)
      
      expect(res.status).toBe(401)
    })

    it('identifies legacy user (null status)', async () => {
      mockSingle.mockResolvedValue({ 
        data: { first_login_completed: false, onboarding_status: null }, 
        error: null 
      })
      
      const req = new NextRequest('http://localhost/api/onboarding/status')
      const res = await GET(req)
      const data = await res.json()

      expect(data.is_legacy_user).toBe(true)
      expect(data.should_show_wizard).toBe(false)
    })

    it('identifies new incomplete user', async () => {
      mockSingle.mockResolvedValue({ 
        data: { 
          first_login_completed: false, 
          onboarding_status: { wizard_step: 1, wizard_completed: false } 
        }, 
        error: null 
      })
      
      const req = new NextRequest('http://localhost/api/onboarding/status')
      const res = await GET(req)
      const data = await res.json()

      expect(data.is_legacy_user).toBe(false)
      expect(data.should_show_wizard).toBe(true)
    })

    it('identifies completed user', async () => {
      mockSingle.mockResolvedValue({ 
        data: { 
          first_login_completed: true, 
          onboarding_status: { wizard_completed: true } 
        }, 
        error: null 
      })
      
      const req = new NextRequest('http://localhost/api/onboarding/status')
      const res = await GET(req)
      const data = await res.json()

      expect(data.should_show_wizard).toBe(false)
    })

    it('calculates checklist completion correctly', async () => {
      mockSingle.mockResolvedValue({ 
        data: { 
          onboarding_status: { 
            checklist_items: {
              exam_created: true,
              exam_published: true,
              pdf_exported: true,
              first_scan: true
            }
          } 
        }, 
        error: null 
      })
      
      const req = new NextRequest('http://localhost/api/onboarding/status')
      const res = await GET(req)
      const data = await res.json()

      expect(data.checklist_complete).toBe(true)
    })
  })

  describe('PATCH', () => {
    it('calls update_onboarding_status RPC', async () => {
      const updateData = { wizard_step: 2 }
      mockRpc.mockResolvedValue({ data: { ...updateData }, error: null })
      
      const req = new NextRequest('http://localhost/api/onboarding/status', {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      })
      
      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(mockRpc).toHaveBeenCalledWith('update_onboarding_status', {
        p_user_id: 'teacher-123',
        p_status_json: updateData
      })
    })
  })
})
