import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnswerBubblesGrid } from '@/components/exam-results/shared/answer-bubbles-grid'
import type { PreguntaExamen } from '@/components/exam-results/utils/types'

describe('AnswerBubblesGrid', () => {
  it('allows selecting an option when the question has no stored answer yet', async () => {
    const user = userEvent.setup()
    const onBubbleClick = vi.fn()

    const preguntas: PreguntaExamen[] = [
      {
        id: 'preg-1',
        orden: 1,
        puntaje: 1,
        num_opciones: 4,
        habilitada: true,
        opciones_respuesta: [
          { id: 'opt-1', orden: 1, pregunta_id: 'preg-1', es_correcta: false },
          { id: 'opt-2', orden: 2, pregunta_id: 'preg-1', es_correcta: true },
          { id: 'opt-3', orden: 3, pregunta_id: 'preg-1', es_correcta: false },
          { id: 'opt-4', orden: 4, pregunta_id: 'preg-1', es_correcta: false },
        ],
      },
    ]

    render(
      <AnswerBubblesGrid
        respuestas={[]}
        preguntas={preguntas}
        totalPreguntas={1}
        resultadoId="res-1"
        onBubbleClick={onBubbleClick}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Option B' }))

    expect(onBubbleClick).toHaveBeenCalledWith({
      pregunta: preguntas[0],
      opcionId: 'opt-2',
      opcionOrden: 2,
      resultadoId: 'res-1',
    })
  })
})
