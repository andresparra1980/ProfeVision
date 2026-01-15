import { describe, it, expect } from 'vitest'
import {
  hasNombresSeparados,
  getStudentDisplayName,
  getNameColumnLabel,
} from '@/lib/utils/student-name'

describe('student-name utilities', () => {
  describe('hasNombresSeparados', () => {
    it('returns true when at least one student has nombres set', () => {
      const students = [
        { nombres: 'Juan', apellidos: 'Pérez' },
        { nombres: null, apellidos: 'García López' },
      ]
      expect(hasNombresSeparados(students)).toBe(true)
    })

    it('returns false when all students have null nombres', () => {
      const students = [
        { nombres: null, apellidos: 'Pérez Juan' },
        { nombres: null, apellidos: 'García María' },
      ]
      expect(hasNombresSeparados(students)).toBe(false)
    })

    it('returns false when all students have empty string nombres', () => {
      const students = [
        { nombres: '', apellidos: 'Pérez Juan' },
        { nombres: '', apellidos: 'García María' },
      ]
      expect(hasNombresSeparados(students)).toBe(false)
    })

    it('returns false for empty array', () => {
      expect(hasNombresSeparados([])).toBe(false)
    })
  })

  describe('getStudentDisplayName', () => {
    it('returns full name in "Nombres Apellidos" format by default', () => {
      const student = { nombres: 'Juan Carlos', apellidos: 'Pérez García' }
      expect(getStudentDisplayName(student)).toBe('Juan Carlos Pérez García')
    })

    it('returns "Apellidos, Nombres" format when lastFirst specified', () => {
      const student = { nombres: 'Juan Carlos', apellidos: 'Pérez García' }
      expect(getStudentDisplayName(student, 'lastFirst')).toBe('Pérez García, Juan Carlos')
    })

    it('returns only apellidos when nombres is null (combined format)', () => {
      const student = { nombres: null, apellidos: 'Pérez García Juan Carlos' }
      expect(getStudentDisplayName(student)).toBe('Pérez García Juan Carlos')
      expect(getStudentDisplayName(student, 'lastFirst')).toBe('Pérez García Juan Carlos')
    })

    it('returns only apellidos when nombres is empty string', () => {
      const student = { nombres: '', apellidos: 'Combined Name' }
      expect(getStudentDisplayName(student)).toBe('Combined Name')
    })
  })

  describe('getNameColumnLabel', () => {
    const labels = {
      apellidos: 'Apellidos',
      nombres: 'Nombres',
      apellidosYNombres: 'Apellidos y Nombres',
    }

    describe('when names are separated', () => {
      it('returns apellidos label for apellidos field', () => {
        expect(getNameColumnLabel(true, 'apellidos', labels)).toBe('Apellidos')
      })

      it('returns nombres label for nombres field', () => {
        expect(getNameColumnLabel(true, 'nombres', labels)).toBe('Nombres')
      })
    })

    describe('when names are combined', () => {
      it('returns combined label for apellidos field', () => {
        expect(getNameColumnLabel(false, 'apellidos', labels)).toBe('Apellidos y Nombres')
      })

      it('returns null for nombres field (no column needed)', () => {
        expect(getNameColumnLabel(false, 'nombres', labels)).toBeNull()
      })
    })
  })
})
