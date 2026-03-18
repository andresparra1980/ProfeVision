import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

type QueryResult = { data: unknown; error: unknown }

const { mockGetApiTranslator, queue, mockFrom } = vi.hoisted(() => ({
  mockGetApiTranslator: vi.fn(async () => ({
    t: (key: string) => key,
  })),
  queue: [] as QueryResult[],
  mockFrom: vi.fn(),
}))

const createBuilder = () => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(async () => queue.shift()),
    then: (
      resolve: (value: QueryResult) => unknown,
      reject?: (reason?: unknown) => unknown
    ) => {
      try {
        return resolve((queue.shift() || { data: null, error: null }) as QueryResult)
      } catch (error) {
        return reject?.(error)
      }
    },
  }

  return builder
}

mockFrom.mockImplementation(() => createBuilder())

const mockTranslator = async () => ({
  t: (key: string) => key,
})

vi.mock('@/i18n/api', () => ({
  getApiTranslator: mockGetApiTranslator,
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

describe('PUT /api/exams/[id]/update-answer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queue.length = 0
  })

  it('creates a missing answer and recalculates using enabled questions total', async () => {
    mockGetApiTranslator.mockImplementation(mockTranslator)
    queue.push(
      { data: { id: 'res-1', examen_id: 'exam-1' }, error: null },
      { data: { id: 'preg-2', examen_id: 'exam-1', habilitada: true, puntaje: '1' }, error: null },
      { data: { id: 'opt-2b', pregunta_id: 'preg-2', es_correcta: true }, error: null },
      { data: { id: 'resp-2', resultado_id: 'res-1' }, error: null },
      { data: [{ id: 'preg-1' }, { id: 'preg-2' }, { id: 'preg-3' }, { id: 'preg-4' }], error: null },
      { data: [{ pregunta_id: 'preg-1', es_correcta: true }, { pregunta_id: 'preg-2', es_correcta: true }], error: null },
      { data: null, error: null }
    )

    const req = new NextRequest('http://localhost/api/exams/exam-1/update-answer', {
      method: 'PUT',
      body: JSON.stringify({
        resultadoId: 'res-1',
        preguntaId: 'preg-2',
        opcionId: 'opt-2b',
      }),
      headers: { 'content-type': 'application/json' },
    })

    const { PUT } = await import('@/app/api/exams/[id]/update-answer/route')
    const res = await PUT(req, { params: Promise.resolve({ id: 'exam-1' }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toMatchObject({
      success: true,
      respuestaId: 'resp-2',
      es_correcta: true,
      puntajeRespuesta: 1,
      puntajeObtenido: 2.5,
      porcentaje: 50,
    })

    const respuestaBuilder = mockFrom.mock.results[3]?.value
    expect(respuestaBuilder.upsert).toHaveBeenCalledWith({
      resultado_id: 'res-1',
      pregunta_id: 'preg-2',
      opcion_id: 'opt-2b',
      es_correcta: true,
      puntaje_obtenido: 1,
      updated_at: expect.any(String),
    }, {
      onConflict: 'resultado_id,pregunta_id',
    })

    const resultadoUpdateBuilder = mockFrom.mock.results[6]?.value
    expect(resultadoUpdateBuilder.update).toHaveBeenCalledWith({
      puntaje_obtenido: 2.5,
      porcentaje: 50,
      updated_at: expect.any(String),
    })
  })
})
