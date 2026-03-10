import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useExamResults } from '@/components/exam-results/hooks/use-exam-results'
import { toast } from 'sonner'

// Mock dependencies
const mockT = (key: string) => key
vi.mock('next-intl', () => ({
  useTranslations: () => mockT,
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

// Create chainable mock helpers
const createChainableMock = (finalResult: unknown) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(finalResult),
  }
  return chain
}

const mockFrom = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

describe('useExamResults', () => {
  const mockExamId = 'exam-123'

  const mockExamData = {
    id: 'exam-123',
    titulo: 'Test Exam',
    estado: 'publicado',
    creado_en: '2026-01-01T00:00:00Z',
    puntaje_total: 100,
    materias: {
      nombre: 'Matemáticas',
      entidades_educativas: { nombre: 'Escuela Test' },
    },
  }

  const mockPreguntasData = [{ orden: 10, habilitada: true }]

  const mockExamenGruposData = [
    { id: 'eg-1', grupo_id: 'grupo-1', grupos: { id: 'grupo-1', nombre: 'Grupo A' } },
    { id: 'eg-2', grupo_id: 'grupo-2', grupos: { id: 'grupo-2', nombre: 'Grupo B' } },
  ]

  const mockEstudiantesGrupoData = [{ estudiante_id: 'est-1' }, { estudiante_id: 'est-2' }]

  const mockEstudiantesData = [
    { id: 'est-1', nombres: 'Juan', apellidos: 'García', identificacion: '12345' },
    { id: 'est-2', nombres: 'María', apellidos: 'López', identificacion: '67890' },
  ]

  const mockResultadosData = [
    {
      id: 'res-1',
      estudiante_id: 'est-1',
      puntaje_obtenido: 80,
      porcentaje: 80,
      fecha_calificacion: '2026-01-10T00:00:00Z',
      estudiante: { id: 'est-1', nombres: 'Juan', apellidos: 'García', identificacion: '12345' },
      respuestas_estudiante: [
        {
          id: 'resp-1',
          pregunta_id: 'preg-1',
          opcion_id: 'opt-1',
          es_correcta: true,
          puntaje_obtenido: 10,
          pregunta: {
            id: 'preg-1',
            orden: 1,
            habilitada: true,
            opciones_respuesta: [
              { id: 'opt-1', orden: 1, es_correcta: true },
              { id: 'opt-2', orden: 2, es_correcta: false },
            ],
          },
          opcion_respuesta: { id: 'opt-1', orden: 1 },
        },
      ],
      examenes_escaneados: [],
    },
  ]

  let localStorageMock: { [key: string]: string }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock = {}

    // Mock localStorage
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => localStorageMock[key] || null)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      localStorageMock[key] = value
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('starts with loading true', async () => {
      // Setup mocks to return empty/error to avoid hanging
      mockFrom.mockImplementation(() =>
        createChainableMock({ data: null, error: new Error('Not found') })
      )

      const { result } = renderHook(() => useExamResults(mockExamId))

      expect(result.current.loading).toBe(true)

      // Wait for loading to potentially change to false (even if it stays true due to error or data,
      // we need to wait for the async effect to settle to avoid "not wrapped in act")
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe('fetching exam data', () => {
    it('fetches exam details successfully', async () => {
      // Create separate chains for each query
      const examChain = createChainableMock({ data: mockExamData, error: null })
      const preguntasChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockPreguntasData, error: null }),
      }
      const examenGruposChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }
      const resultadosChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }

      mockFrom.mockImplementation((table: string) => {
        switch (table) {
          case 'examenes':
            return examChain
          case 'preguntas':
            return preguntasChain
          case 'examen_grupo':
            return examenGruposChain
          case 'resultados_examen':
            return resultadosChain
          default:
            return createChainableMock({ data: null, error: null })
        }
      })

      const { result } = renderHook(() => useExamResults(mockExamId))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.examDetails).toEqual(mockExamData)
      expect(result.current.totalPreguntas).toBe(10)
    })

    it('handles exam fetch error', async () => {
      const examChain = createChainableMock({ data: null, error: new Error('Not found') })
      mockFrom.mockReturnValue(examChain)

      const { result } = renderHook(() => useExamResults(mockExamId))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should handle error gracefully
      expect(result.current.examDetails).toBeNull()
    })

    it('handles question metadata fetch error and surfaces it', async () => {
      const examChain = createChainableMock({ data: mockExamData, error: null })
      const preguntasChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('Preguntas failed') }),
      }

      mockFrom.mockImplementation((table: string) => {
        switch (table) {
          case 'examenes':
            return examChain
          case 'preguntas':
            return preguntasChain
          default:
            return createChainableMock({ data: null, error: null })
        }
      })

      const { result } = renderHook(() => useExamResults(mockExamId))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.totalPreguntas).toBe(0)
      expect(result.current.enabledQuestionOrders).toEqual([])
      expect(toast.error).toHaveBeenCalled()
    })
  })

  describe('group handling', () => {
    it('fetches and sets available groups', async () => {
      const examChain = createChainableMock({ data: mockExamData, error: null })
      const preguntasChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockPreguntasData, error: null }),
      }
      const examenGruposChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockExamenGruposData, error: null }),
      }
      const estudianteGrupoChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockEstudiantesGrupoData, error: null }),
      }
      const estudiantesChain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockEstudiantesData, error: null }),
      }
      const resultadosChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }

      mockFrom.mockImplementation((table: string) => {
        switch (table) {
          case 'examenes':
            return examChain
          case 'preguntas':
            return preguntasChain
          case 'examen_grupo':
            return examenGruposChain
          case 'estudiante_grupo':
            return estudianteGrupoChain
          case 'estudiantes':
            return estudiantesChain
          case 'resultados_examen':
            return resultadosChain
          default:
            return createChainableMock({ data: null, error: null })
        }
      })

      const { result } = renderHook(() => useExamResults(mockExamId))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.availableGroups.length).toBeGreaterThan(0)
      expect(result.current.selectedGroupId).toBe('grupo-1')
    })

    it('uses stored group from localStorage', async () => {
      localStorageMock[`exam_${mockExamId}_selected_group`] = 'grupo-2'

      const examChain = createChainableMock({ data: mockExamData, error: null })
      const preguntasChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockPreguntasData, error: null }),
      }
      const examenGruposChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockExamenGruposData, error: null }),
      }
      const estudianteGrupoChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }
      const estudiantesChain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }
      const resultadosChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }

      mockFrom.mockImplementation((table: string) => {
        switch (table) {
          case 'examenes':
            return examChain
          case 'preguntas':
            return preguntasChain
          case 'examen_grupo':
            return examenGruposChain
          case 'estudiante_grupo':
            return estudianteGrupoChain
          case 'estudiantes':
            return estudiantesChain
          case 'resultados_examen':
            return resultadosChain
          default:
            return createChainableMock({ data: null, error: null })
        }
      })

      const { result } = renderHook(() => useExamResults(mockExamId))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.selectedGroupId).toBe('grupo-2')
    })
  })

  describe('results handling', () => {
    it('transforms and sets results data correctly', async () => {
      const examChain = createChainableMock({ data: mockExamData, error: null })
      const preguntasChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockPreguntasData, error: null }),
      }
      const examenGruposChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }
      const resultadosChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockResultadosData, error: null }),
      }

      mockFrom.mockImplementation((table: string) => {
        switch (table) {
          case 'examenes':
            return examChain
          case 'preguntas':
            return preguntasChain
          case 'examen_grupo':
            return examenGruposChain
          case 'resultados_examen':
            return resultadosChain
          default:
            return createChainableMock({ data: null, error: null })
        }
      })

      const { result } = renderHook(() => useExamResults(mockExamId))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.resultados.length).toBe(1)
      expect(result.current.resultados[0].id).toBe('res-1')
      expect(result.current.resultados[0].estudiante.nombres).toBe('Juan')
      expect(result.current.resultados[0].puntaje_obtenido).toBe(80)
    })

    it('handles empty results', async () => {
      const examChain = createChainableMock({ data: mockExamData, error: null })
      const preguntasChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }
      const examenGruposChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }
      const resultadosChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }

      mockFrom.mockImplementation((table: string) => {
        switch (table) {
          case 'examenes':
            return examChain
          case 'preguntas':
            return preguntasChain
          case 'examen_grupo':
            return examenGruposChain
          case 'resultados_examen':
            return resultadosChain
          default:
            return createChainableMock({ data: null, error: null })
        }
      })

      const { result } = renderHook(() => useExamResults(mockExamId))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.resultados).toEqual([])
    })
  })

  describe('setSelectedGroupId', () => {
    it('allows changing selected group', async () => {
      const examChain = createChainableMock({ data: mockExamData, error: null })
      const preguntasChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockPreguntasData, error: null }),
      }
      const examenGruposChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockExamenGruposData, error: null }),
      }
      const estudianteGrupoChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }
      const estudiantesChain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }
      const resultadosChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }

      mockFrom.mockImplementation((table: string) => {
        switch (table) {
          case 'examenes':
            return examChain
          case 'preguntas':
            return preguntasChain
          case 'examen_grupo':
            return examenGruposChain
          case 'estudiante_grupo':
            return estudianteGrupoChain
          case 'estudiantes':
            return estudiantesChain
          case 'resultados_examen':
            return resultadosChain
          default:
            return createChainableMock({ data: null, error: null })
        }
      })

      const { result } = renderHook(() => useExamResults(mockExamId))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        result.current.setSelectedGroupId('grupo-2')
      })

      // Need to wait for any effects triggered by setSelectedGroupId to complete
      await waitFor(() => {
        expect(result.current.selectedGroupId).toBe('grupo-2')
      })
    })
  })

  describe('setResultados', () => {
    it('allows updating results directly', async () => {
      const examChain = createChainableMock({ data: mockExamData, error: null })
      const preguntasChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }
      const examenGruposChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }
      const resultadosChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }

      mockFrom.mockImplementation((table: string) => {
        switch (table) {
          case 'examenes':
            return examChain
          case 'preguntas':
            return preguntasChain
          case 'examen_grupo':
            return examenGruposChain
          case 'resultados_examen':
            return resultadosChain
          default:
            return createChainableMock({ data: null, error: null })
        }
      })

      const { result } = renderHook(() => useExamResults(mockExamId))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const newResultado = {
        id: 'new-res',
        estudiante: { id: 'est-3', nombres: 'Test', apellidos: 'User', identificacion: '11111' },
        puntaje_obtenido: 90,
        porcentaje: 90,
        fecha_calificacion: '2026-01-15T00:00:00Z',
        respuestas_estudiante: [],
      }

      act(() => {
        result.current.setResultados([newResultado])
      })

      expect(result.current.resultados.length).toBe(1)
      expect(result.current.resultados[0].id).toBe('new-res')
    })
  })

  describe('examId variations', () => {
    it('handles examId as array', async () => {
      const examChain = createChainableMock({ data: mockExamData, error: null })
      const preguntasChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }
      const examenGruposChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }
      const resultadosChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }

      mockFrom.mockImplementation((table: string) => {
        switch (table) {
          case 'examenes':
            return examChain
          case 'preguntas':
            return preguntasChain
          case 'examen_grupo':
            return examenGruposChain
          case 'resultados_examen':
            return resultadosChain
          default:
            return createChainableMock({ data: null, error: null })
        }
      })

      const { result } = renderHook(() => useExamResults(['exam-123']))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.examDetails).toEqual(mockExamData)
    })
  })
})
