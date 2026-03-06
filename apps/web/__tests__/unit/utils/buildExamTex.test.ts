import { describe, it, expect } from 'vitest'
import { buildExamTex, type ExamLike, type LatexOptions } from '@/lib/latex/buildExamTex'

const createMockExam = (overrides: Partial<ExamLike> = {}): ExamLike => ({
  titulo: 'Examen de Matemáticas',
  descripcion: 'Descripción del examen',
  instrucciones: 'Lea cuidadosamente cada pregunta',
  duracion_minutos: 60,
  puntaje_total: 100,
  materias: {
    nombre: 'Matemáticas',
    entidad: { nombre: 'Universidad Test' },
  },
  preguntas: [
    {
      id: 'q1',
      texto: '¿Cuánto es 2 + 2?',
      puntaje: 10,
      opciones_respuesta: [
        { id: 'o1', texto: '3' },
        { id: 'o2', texto: '4' },
        { id: 'o3', texto: '5' },
      ],
    },
  ],
  ...overrides,
})

describe('buildExamTex', () => {
  describe('document structure', () => {
    it('generates valid LaTeX document structure', () => {
      const exam = createMockExam()
      const tex = buildExamTex(exam)

      expect(tex).toContain('\\documentclass')
      expect(tex).toContain('\\begin{document}')
      expect(tex).toContain('\\end{document}')
    })

    it('includes required packages', () => {
      const exam = createMockExam()
      const tex = buildExamTex(exam)

      expect(tex).toContain('\\usepackage')
      expect(tex).toContain('amsmath')
      expect(tex).toContain('enumitem')
      expect(tex).toContain('multicol')
      expect(tex).toContain('geometry')
    })
  })

  describe('options', () => {
    it('uses default 10pt font size', () => {
      const tex = buildExamTex(createMockExam())
      expect(tex).toContain('[10pt]')
    })

    it('supports 8pt font with extarticle', () => {
      const tex = buildExamTex(createMockExam(), { fontSize: '8pt' })
      expect(tex).toContain('extarticle')
      expect(tex).toContain('[8pt]')
    })

    it('supports 12pt font', () => {
      const tex = buildExamTex(createMockExam(), { fontSize: '12pt' })
      expect(tex).toContain('[12pt]')
    })

    it('supports different paper sizes', () => {
      expect(buildExamTex(createMockExam(), { paper: 'letter' })).toContain('letterpaper')
      expect(buildExamTex(createMockExam(), { paper: 'a4' })).toContain('a4paper')
      expect(buildExamTex(createMockExam(), { paper: 'legal' })).toContain('legalpaper')
    })

    it('supports landscape orientation', () => {
      const tex = buildExamTex(createMockExam(), { orientation: 'landscape' })
      expect(tex).toContain('landscape')
    })

    it('supports different column counts', () => {
      const tex1 = buildExamTex(createMockExam(), { columns: 1 })
      expect(tex1).not.toContain('multicols')

      const tex2 = buildExamTex(createMockExam(), { columns: 2 })
      expect(tex2).toContain('multicols')
      expect(tex2).toContain('{2}')

      const tex3 = buildExamTex(createMockExam(), { columns: 3 })
      expect(tex3).toContain('{3}')
    })

    it('supports balanced columns', () => {
      const unbalanced = buildExamTex(createMockExam(), { columnBalance: 'unbalanced' })
      expect(unbalanced).toContain('multicols*')

      const balanced = buildExamTex(createMockExam(), { columnBalance: 'balanced' })
      expect(balanced).toContain('\\begin{multicols}')
      expect(balanced).not.toContain('multicols*')
    })

    it('supports Spanish locale', () => {
      const tex = buildExamTex(createMockExam(), { locale: 'es' })
      expect(tex).toContain('spanish')
    })

    it('supports English locale', () => {
      const tex = buildExamTex(createMockExam(), { locale: 'en' })
      expect(tex).toContain('english')
    })
  })

  describe('header content', () => {
    it('includes institution name', () => {
      const exam = createMockExam()
      const tex = buildExamTex(exam)
      expect(tex).toContain('Universidad Test')
    })

    it('includes subject name', () => {
      const exam = createMockExam()
      const tex = buildExamTex(exam)
      expect(tex).toContain('Matemáticas')
    })

    it('includes exam title', () => {
      const exam = createMockExam()
      const tex = buildExamTex(exam)
      expect(tex).toContain('Examen de Matemáticas')
    })

    it('includes duration', () => {
      const exam = createMockExam({ duracion_minutos: 90 })
      const tex = buildExamTex(exam)
      expect(tex).toContain('90')
    })

    it('includes total score', () => {
      const exam = createMockExam({ puntaje_total: 50 })
      const tex = buildExamTex(exam)
      expect(tex).toContain('50')
    })

    it('supports custom group name', () => {
      const tex = buildExamTex(createMockExam(), { groupName: 'Grupo A' })
      expect(tex).toContain('Grupo A')
    })

    it('supports custom date text', () => {
      const tex = buildExamTex(createMockExam(), { dateText: '15 de Enero, 2026' })
      expect(tex).toContain('15 de Enero, 2026')
    })

    it('uses custom labels', () => {
      const labels = {
        group: 'Group:',
        instructions: 'Instructions:',
        duration: 'Duration:',
        minutes: 'minutes',
        totalScore: 'Total:',
        pts: 'points',
      }
      const tex = buildExamTex(createMockExam(), { labels })
      expect(tex).toContain('Duration:')
      expect(tex).toContain('points')
    })
  })

  describe('questions', () => {
    it('includes questions in enumerate environment', () => {
      const exam = createMockExam()
      const tex = buildExamTex(exam)
      expect(tex).toContain('\\begin{enumerate}')
      expect(tex).toContain('\\end{enumerate}')
      expect(tex).toContain('\\item')
    })

    it('includes question text', () => {
      const exam = createMockExam()
      const tex = buildExamTex(exam)
      expect(tex).toContain('2 + 2')
    })

    it('includes question score', () => {
      const exam = createMockExam()
      const tex = buildExamTex(exam)
      expect(tex).toContain('10')
    })

    it('includes answer options', () => {
      const exam = createMockExam()
      const tex = buildExamTex(exam)
      expect(tex).toContain('3')
      expect(tex).toContain('4')
      expect(tex).toContain('5')
    })

    it('handles multiple questions', () => {
      const exam = createMockExam({
        preguntas: [
          { id: 'q1', texto: 'Pregunta 1', puntaje: 10, opciones_respuesta: [] },
          { id: 'q2', texto: 'Pregunta 2', puntaje: 20, opciones_respuesta: [] },
          { id: 'q3', texto: 'Pregunta 3', puntaje: 30, opciones_respuesta: [] },
        ],
      })
      const tex = buildExamTex(exam)
      expect(tex).toContain('Pregunta 1')
      expect(tex).toContain('Pregunta 2')
      expect(tex).toContain('Pregunta 3')
    })
  })

  describe('LaTeX escaping', () => {
    it('escapes special characters outside math', () => {
      const exam = createMockExam({
        preguntas: [
          {
            id: 'q1',
            texto: '100% of users & 50% of admins',
            puntaje: 10,
            opciones_respuesta: [],
          },
        ],
      })
      const tex = buildExamTex(exam)
      expect(tex).toContain('\\%')
      expect(tex).toContain('\\&')
    })

    it('preserves inline math $...$', () => {
      const exam = createMockExam({
        preguntas: [
          {
            id: 'q1',
            texto: 'Solve $x^2 + y^2 = r^2$',
            puntaje: 10,
            opciones_respuesta: [],
          },
        ],
      })
      const tex = buildExamTex(exam)
      expect(tex).toContain('$x^2 + y^2 = r^2$')
    })

    it('preserves display math $$...$$', () => {
      const exam = createMockExam({
        preguntas: [
          {
            id: 'q1',
            texto: 'Calculate $$\\int_0^1 x dx$$',
            puntaje: 10,
            opciones_respuesta: [],
          },
        ],
      })
      const tex = buildExamTex(exam)
      expect(tex).toContain('$$\\int_0^1 x dx$$')
    })

    it('normalizes double backslashes before letters (Greek symbols)', () => {
      const exam = createMockExam({
        preguntas: [
          {
            id: 'q1',
            texto: '$\\\\Delta p$ and $\\\\alpha$',
            puntaje: 10,
            opciones_respuesta: [],
          },
        ],
      })
      const tex = buildExamTex(exam)
      // Should normalize \\Delta to \Delta
      expect(tex).toContain('$\\Delta p$')
      expect(tex).toContain('$\\alpha$')
    })


    it('normalizes long escaped backslashes in math commands', () => {
      const exam = createMockExam({
        preguntas: [
          {
            id: 'q1',
            texto: 'Un receptor $\\\\\\beta$ activa un canal de $\\\\\\text{Na}^+$',
            puntaje: 10,
            opciones_respuesta: [],
          },
        ],
      })
      const tex = buildExamTex(exam)
      expect(tex).toContain('$\\beta$')
      expect(tex).toContain('$\\text{Na}^+$')
    })

    it('restores control characters produced by JSON escape sequences (\\b, \\t, etc.)', () => {
      const exam = createMockExam({
        preguntas: [
          {
            id: 'q1',
            texto: 'El receptor $\u0008eta$ abre un canal de $\u0009ext{Na}^+$',
            puntaje: 10,
            opciones_respuesta: [],
          },
        ],
      })
      const tex = buildExamTex(exam)
      expect(tex).toContain('$\\beta$')
      expect(tex).toContain('$\\text{Na}^+$')
    })

    it('strips HTML tags', () => {
      const exam = createMockExam({
        preguntas: [
          {
            id: 'q1',
            texto: '<p>Question text</p>',
            puntaje: 10,
            opciones_respuesta: [],
          },
        ],
      })
      const tex = buildExamTex(exam)
      expect(tex).not.toContain('<p>')
      expect(tex).not.toContain('</p>')
      expect(tex).toContain('Question text')
    })

    it('decodes HTML entities', () => {
      const exam = createMockExam({
        preguntas: [
          {
            id: 'q1',
            texto: '5 &gt; 3 &amp; 2 &lt; 4',
            puntaje: 10,
            opciones_respuesta: [],
          },
        ],
      })
      const tex = buildExamTex(exam)
      expect(tex).toContain('5 > 3')
      expect(tex).toContain('2 < 4')
    })

    it('converts backticks to texttt', () => {
      const exam = createMockExam({
        preguntas: [
          {
            id: 'q1',
            texto: 'Use the `print` function',
            puntaje: 10,
            opciones_respuesta: [],
          },
        ],
      })
      const tex = buildExamTex(exam)
      expect(tex).toContain('\\texttt{print}')
    })

    it('handles empty question text', () => {
      const exam = createMockExam({
        preguntas: [
          {
            id: 'q1',
            texto: '',
            puntaje: 10,
            opciones_respuesta: [],
          },
        ],
      })
      // Should not throw
      expect(() => buildExamTex(exam)).not.toThrow()
    })
  })
})
