import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  uploadScanToStorage,
  getProcessingJob,
  updateJobStatus,
} from '@/lib/services/exam-scan-service'

// Mock uuid
vi.mock('uuid', () => ({
  v4: () => 'mock-uuid-1234',
}))

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
  const mockStorageChain = {
    upload: vi.fn().mockResolvedValue({ error: null }),
    getPublicUrl: vi.fn().mockReturnValue({
      data: { publicUrl: 'https://storage.test/file.png' },
    }),
    createSignedUrl: vi.fn().mockResolvedValue({
      data: { signedUrl: 'https://storage.test/signed' },
      error: null,
    }),
  }

  const mockStorage = {
    from: vi.fn(() => mockStorageChain),
  }

  const mockFrom = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  }

  return {
    storage: mockStorage,
    from: vi.fn(() => mockFrom),
    _mockFrom: mockFrom,
    _mockStorage: mockStorage,
    _mockStorageChain: mockStorageChain,
  }
}

describe('exam-scan-service', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>
  const originalFetch = global.fetch
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
    global.fetch = vi.fn().mockResolvedValue({ ok: true })
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    global.fetch = originalFetch
    process.env = originalEnv
  })

  describe('uploadScanToStorage', () => {
    const mockFile = new Blob(['test'], { type: 'image/png' })

    it('uploads file and creates job record', async () => {
      mockSupabase._mockFrom.single.mockResolvedValue({
        data: { id: 'mock-uuid-1234' },
        error: null,
      })

      const result = await uploadScanToStorage(
        mockSupabase as never,
        mockFile,
        'exam-123',
        'student-456',
        'group-789'
      )

      expect(result.jobId).toBe('mock-uuid-1234')
      expect(result.status).toBe('queued')
      expect(result.scanData.examId).toBe('exam-123')
      expect(result.scanData.studentId).toBe('student-456')
      expect(result.scanData.groupId).toBe('group-789')
    })

    it('uses exam path when examId provided', async () => {
      mockSupabase._mockFrom.single.mockResolvedValue({ data: {}, error: null })

      await uploadScanToStorage(mockSupabase as never, mockFile, 'exam-123')

      expect(mockSupabase._mockStorageChain.upload).toHaveBeenCalledWith(
        expect.stringContaining('exams/exam-123/'),
        expect.any(Blob),
        expect.any(Object)
      )
    })

    it('uses pending path when no examId', async () => {
      mockSupabase._mockFrom.single.mockResolvedValue({ data: {}, error: null })

      await uploadScanToStorage(mockSupabase as never, mockFile)

      expect(mockSupabase._mockStorageChain.upload).toHaveBeenCalledWith(
        expect.stringContaining('pending/'),
        expect.any(Blob),
        expect.any(Object)
      )
    })

    it('throws error on upload failure', async () => {
      mockSupabase._mockStorageChain.upload.mockResolvedValue({
        error: { message: 'Upload failed' },
      })

      await expect(
        uploadScanToStorage(mockSupabase as never, mockFile)
      ).rejects.toThrow('Error uploading scan')
    })

    it('throws error on job creation failure', async () => {
      mockSupabase._mockFrom.single.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      })

      await expect(
        uploadScanToStorage(mockSupabase as never, mockFile)
      ).rejects.toThrow('Error creating scan job')
    })

    it('notifies OMR service when endpoint configured', async () => {
      process.env.OMR_SERVICE_ENDPOINT = 'http://omr.test/process'
      process.env.OMR_SERVICE_API_KEY = 'test-key'
      process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'

      mockSupabase._mockFrom.single.mockResolvedValue({ data: {}, error: null })

      await uploadScanToStorage(mockSupabase as never, mockFile, 'exam-123')

      expect(global.fetch).toHaveBeenCalledWith(
        'http://omr.test/process',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('does not call OMR service when endpoint not configured', async () => {
      delete process.env.OMR_SERVICE_ENDPOINT
      mockSupabase._mockFrom.single.mockResolvedValue({ data: {}, error: null })

      await uploadScanToStorage(mockSupabase as never, mockFile)

      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('getProcessingJob', () => {
    it('returns job data when found', async () => {
      const jobData = {
        id: 'job-123',
        exam_id: 'exam-456',
        student_id: 'student-789',
        group_id: 'group-101',
        file_path: 'exams/exam-456/scan.png',
        status: 'completed',
        created_at: '2026-01-14T10:00:00Z',
      }

      mockSupabase._mockFrom.single.mockResolvedValue({
        data: jobData,
        error: null,
      })

      const result = await getProcessingJob(mockSupabase as never, 'job-123')

      expect(result).not.toBeNull()
      expect(result?.jobId).toBe('job-123')
      expect(result?.status).toBe('completed')
      expect(result?.scanData.examId).toBe('exam-456')
    })

    it('returns null when job not found', async () => {
      mockSupabase._mockFrom.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      })

      const result = await getProcessingJob(mockSupabase as never, 'nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('updateJobStatus', () => {
    it('updates job to processing status', async () => {
      mockSupabase._mockFrom.eq.mockResolvedValue({ error: null })

      await updateJobStatus(mockSupabase as never, 'job-123', 'processing')

      expect(mockSupabase.from).toHaveBeenCalledWith('exam_scan_jobs')
      expect(mockSupabase._mockFrom.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'processing',
        })
      )
    })

    it('sets completed_at and result on completed status', async () => {
      mockSupabase._mockFrom.eq.mockResolvedValue({ error: null })
      const result = { answers: [{ q: 1, a: 'A' }] }

      await updateJobStatus(mockSupabase as never, 'job-123', 'completed', result)

      expect(mockSupabase._mockFrom.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          completed_at: expect.any(String),
          result: result,
        })
      )
    })

    it('updates exam_id from result on completed', async () => {
      mockSupabase._mockFrom.eq.mockResolvedValue({ error: null })
      const result = { exam_id: 'new-exam-id', student_id: 'new-student' }

      await updateJobStatus(mockSupabase as never, 'job-123', 'completed', result)

      expect(mockSupabase._mockFrom.update).toHaveBeenCalledWith(
        expect.objectContaining({
          exam_id: 'new-exam-id',
          student_id: 'new-student',
        })
      )
    })

    it('sets error on failed status', async () => {
      mockSupabase._mockFrom.eq.mockResolvedValue({ error: null })

      await updateJobStatus(mockSupabase as never, 'job-123', 'failed', {
        error: 'Processing failed',
      })

      expect(mockSupabase._mockFrom.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          error: 'Processing failed',
        })
      )
    })

    it('uses default error message on failed status', async () => {
      mockSupabase._mockFrom.eq.mockResolvedValue({ error: null })

      await updateJobStatus(mockSupabase as never, 'job-123', 'failed')

      expect(mockSupabase._mockFrom.update).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unknown error',
        })
      )
    })

    it('throws error on update failure', async () => {
      mockSupabase._mockFrom.eq.mockResolvedValue({
        error: { message: 'Update failed' },
      })

      await expect(
        updateJobStatus(mockSupabase as never, 'job-123', 'completed')
      ).rejects.toThrow('Error updating job status')
    })
  })
})
