import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { useAnswerUpdate } from '@/components/exam-results/hooks/use-answer-update'
import type { ResultadoExamen } from '@/components/exam-results/utils/types'
import type { SetStateAction } from 'react'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe('useAnswerUpdate', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('creates a missing answer locally after confirming the change', async () => {
    const pregunta = {
      id: 'preg-2',
      orden: 2,
      puntaje: 1,
      num_opciones: 4,
      habilitada: true,
      opciones_respuesta: [
        { id: 'opt-2a', orden: 1, pregunta_id: 'preg-2', es_correcta: false },
        { id: 'opt-2b', orden: 2, pregunta_id: 'preg-2', es_correcta: true },
        { id: 'opt-2c', orden: 3, pregunta_id: 'preg-2', es_correcta: false },
        { id: 'opt-2d', orden: 4, pregunta_id: 'preg-2', es_correcta: false },
      ],
    }

    const initialResultados: ResultadoExamen[] = [
      {
        id: 'res-1',
        puntaje_obtenido: 1.25,
        porcentaje: 25,
        fecha_calificacion: '2026-01-01T00:00:00Z',
        estudiante: {
          id: 'est-1',
          nombres: 'Ana',
          apellidos: 'Perez',
          identificacion: '123',
        },
        respuestas_estudiante: [
          {
            id: 'resp-1',
            pregunta_id: 'preg-1',
            opcion_id: 'opt-1a',
            es_correcta: true,
            puntaje_obtenido: 1,
            pregunta: {
              id: 'preg-1',
              orden: 1,
              puntaje: 1,
              num_opciones: 4,
              habilitada: true,
              opciones_respuesta: [
                { id: 'opt-1a', orden: 1, pregunta_id: 'preg-1', es_correcta: true },
              ],
            },
            opcion_respuesta: { id: 'opt-1a', orden: 1 },
          },
        ],
      },
    ]

    let resultadosState = initialResultados
    const setResultados = vi.fn((updater: SetStateAction<ResultadoExamen[]>) => {
      resultadosState = typeof updater === 'function' ? updater(resultadosState) : updater
    })
    const setSelectedResultado = vi.fn()

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        respuestaId: 'resp-2',
        es_correcta: true,
        puntajeRespuesta: 1,
        puntajeObtenido: 2.5,
        porcentaje: 50,
      }),
    })

    const { result } = renderHook(() =>
      useAnswerUpdate({
        examId: 'exam-1',
        setResultados,
        setSelectedResultado,
      })
    )

    act(() => {
      result.current.handleBubbleClick({
        pregunta,
        opcionId: 'opt-2b',
        opcionOrden: 2,
        resultadoId: 'res-1',
      })
    })

    expect(result.current.pendingUpdate).toMatchObject({
      preguntaId: 'preg-2',
      opcionId: 'opt-2b',
      resultadoId: 'res-1',
    })
    expect(result.current.showConfirmDialog).toBe(true)

    await act(async () => {
      await result.current.handleConfirmUpdate()
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/exams/exam-1/update-answer', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        respuestaId: undefined,
        resultadoId: 'res-1',
        preguntaId: 'preg-2',
        opcionId: 'opt-2b',
      }),
    })

    await waitFor(() => {
      expect(resultadosState[0].puntaje_obtenido).toBe(2.5)
    })

    expect(resultadosState[0].porcentaje).toBe(50)
    expect(resultadosState[0].respuestas_estudiante).toHaveLength(2)
    expect(resultadosState[0].respuestas_estudiante[1]).toMatchObject({
      id: 'resp-2',
      pregunta_id: 'preg-2',
      opcion_id: 'opt-2b',
      es_correcta: true,
      puntaje_obtenido: 1,
      opcion_respuesta: { id: 'opt-2b', orden: 2 },
    })

    await waitFor(() => {
      expect(setSelectedResultado).toHaveBeenCalledWith(expect.objectContaining({
        id: 'res-1',
        puntaje_obtenido: 2.5,
      }))
    })

    expect(toast.success).toHaveBeenCalled()
  })
})
