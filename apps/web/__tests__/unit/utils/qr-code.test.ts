import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateOptimizedQRData,
  decodeQRData,
  isValidQRForExam,
  getReadableQRContent,
} from '@/lib/utils/qr-code'

// Mock environment variable
vi.stubEnv('EXAM_RESPONSE_SHEET_SECRET_KEY', 'test-secret-key')

describe('QR Code utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateOptimizedQRData', () => {
    it('generates data in compact format without groupId', () => {
      const data = generateOptimizedQRData({
        studentId: 'student123',
        examId: 'exam456',
      })

      const parts = data.split(':')
      expect(parts).toHaveLength(3)
      expect(parts[0]).toBe('exam456')
      expect(parts[1]).toBe('student123')
      expect(parts[2]).toHaveLength(8) // Hash is 8 chars
    })

    it('generates data in compact format with groupId', () => {
      const data = generateOptimizedQRData({
        studentId: 'student123',
        examId: 'exam456',
        groupId: 'group789',
      })

      const parts = data.split(':')
      expect(parts).toHaveLength(4)
      expect(parts[0]).toBe('exam456')
      expect(parts[1]).toBe('student123')
      expect(parts[2]).toBe('group789')
      expect(parts[3]).toHaveLength(8)
    })

    it('generates consistent hash for same inputs', () => {
      const data1 = generateOptimizedQRData({ studentId: 'a', examId: 'b' })
      const data2 = generateOptimizedQRData({ studentId: 'a', examId: 'b' })

      expect(data1).toBe(data2)
    })

    it('generates different hash for different inputs', () => {
      const data1 = generateOptimizedQRData({ studentId: 'a', examId: 'b' })
      const data2 = generateOptimizedQRData({ studentId: 'x', examId: 'y' })

      const hash1 = data1.split(':')[2]
      const hash2 = data2.split(':')[2]
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('decodeQRData', () => {
    it('returns null for empty input', () => {
      expect(decodeQRData('')).toBeNull()
      expect(decodeQRData(null as unknown as string)).toBeNull()
    })

    it('decodes compact format without groupId', () => {
      const qrData = generateOptimizedQRData({
        studentId: 'student123',
        examId: 'exam456',
      })

      const decoded = decodeQRData(qrData)

      expect(decoded).not.toBeNull()
      expect(decoded?.examId).toBe('exam456')
      expect(decoded?.studentId).toBe('student123')
      expect(decoded?.groupId).toBeUndefined()
      expect(decoded?.isValid).toBe(true)
    })

    it('decodes compact format with groupId', () => {
      const qrData = generateOptimizedQRData({
        studentId: 'student123',
        examId: 'exam456',
        groupId: 'group789',
      })

      const decoded = decodeQRData(qrData)

      expect(decoded).not.toBeNull()
      expect(decoded?.examId).toBe('exam456')
      expect(decoded?.studentId).toBe('student123')
      expect(decoded?.groupId).toBe('group789')
      expect(decoded?.isValid).toBe(true)
    })

    it('decodes legacy JSON format', () => {
      const jsonData = JSON.stringify({
        examId: 'exam123',
        studentId: 'student456',
        groupId: 'group789',
        hash: 'somehash',
      })

      const decoded = decodeQRData(jsonData)

      expect(decoded).not.toBeNull()
      expect(decoded?.examId).toBe('exam123')
      expect(decoded?.studentId).toBe('student456')
      expect(decoded?.groupId).toBe('group789')
    })

    it('detects invalid hash', () => {
      const decoded = decodeQRData('exam123:student456:invalidhash')

      expect(decoded).not.toBeNull()
      expect(decoded?.isValid).toBe(false)
    })

    it('returns null for invalid format', () => {
      expect(decodeQRData('invalid')).toBeNull()
      expect(decodeQRData('a:b')).toBeNull() // Only 2 parts
      expect(decodeQRData('a:b:c:d:e')).toBeNull() // 5 parts
    })
  })

  describe('isValidQRForExam', () => {
    it('returns true for valid QR matching exam', () => {
      const qrData = generateOptimizedQRData({
        studentId: 'student123',
        examId: 'exam456',
      })

      expect(isValidQRForExam(qrData, 'exam456')).toBe(true)
    })

    it('returns false for valid QR with different examId', () => {
      const qrData = generateOptimizedQRData({
        studentId: 'student123',
        examId: 'exam456',
      })

      expect(isValidQRForExam(qrData, 'differentExam')).toBe(false)
    })

    it('returns false for invalid QR data', () => {
      expect(isValidQRForExam('invalid', 'exam123')).toBe(false)
    })

    it('returns false for tampered hash', () => {
      expect(isValidQRForExam('exam123:student456:tampered', 'exam123')).toBe(false)
    })
  })

  describe('getReadableQRContent', () => {
    it('returns formatted content for valid QR', () => {
      const qrData = generateOptimizedQRData({
        studentId: 'student123',
        examId: 'exam456',
      })

      const readable = getReadableQRContent(qrData)

      expect(readable).toContain('Examen: exam456')
      expect(readable).toContain('Estudiante: student123')
      expect(readable).toContain('✓ Hash verificado')
    })

    it('shows invalid hash message for tampered QR', () => {
      const readable = getReadableQRContent('exam123:student456:badHash')

      expect(readable).toContain('❌ Hash inválido')
    })

    it('includes groupId when present', () => {
      const qrData = generateOptimizedQRData({
        studentId: 'student123',
        examId: 'exam456',
        groupId: 'group789',
      })

      const readable = getReadableQRContent(qrData)

      expect(readable).toContain('Grupo: group789')
    })

    it('returns error message for invalid format', () => {
      expect(getReadableQRContent('invalid')).toBe('Formato QR no reconocido')
    })
  })
})
