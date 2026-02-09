import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuestionAnalysisCard } from '@/components/exam-results/cards/question-analysis-card'
import type { ResultadoExamen } from '@/components/exam-results/utils/types'

// Mock useTranslations
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

// Mock Tremor BarChart
vi.mock('@tremor/react', () => ({
  BarChart: ({ data }: { data: any[] }) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      Mocked BarChart
    </div>
  ),
}))

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  TrendingUp: () => <span data-testid="icon-trending-up" />,
  TrendingDown: () => <span data-testid="icon-trending-down" />,
  Minus: () => <span data-testid="icon-minus" />,
}))

describe('QuestionAnalysisCard', () => {
  const mockResultados: ResultadoExamen[] = [
    {
      id: '1',
      puntaje_obtenido: 80,
      porcentaje: 80,
      fecha_calificacion: '2023-01-01',
      estudiante: {
        id: 'est-1',
        nombres: 'Estudiante',
        apellidos: 'Uno',
        identificacion: '123'
      },
      respuestas_estudiante: [
        {
          id: 'r1',
          pregunta_id: 'p1',
          opcion_id: 'o1',
          es_correcta: true, // Q1: Correct
          puntaje_obtenido: 10,
          pregunta: { id: 'p1', orden: 1, habilitada: true, num_opciones: 4, opciones_respuesta: [] },
          opcion_respuesta: { id: 'o1', orden: 1 }
        },
        {
          id: 'r2',
          pregunta_id: 'p2',
          opcion_id: 'o2',
          es_correcta: false, // Q2: Incorrect
          puntaje_obtenido: 0,
          pregunta: { id: 'p2', orden: 2, habilitada: true, num_opciones: 4, opciones_respuesta: [] },
          opcion_respuesta: { id: 'o2', orden: 2 }
        }
      ]
    },
    {
      id: '2',
      puntaje_obtenido: 50,
      porcentaje: 50,
      fecha_calificacion: '2023-01-01',
      estudiante: {
        id: 'est-2',
        nombres: 'Estudiante',
        apellidos: 'Dos',
        identificacion: '456'
      },
      respuestas_estudiante: [
        {
          id: 'r3',
          pregunta_id: 'p1',
          opcion_id: 'o1',
          es_correcta: true, // Q1: Correct (100% total)
          puntaje_obtenido: 10,
          pregunta: { id: 'p1', orden: 1, habilitada: true, num_opciones: 4, opciones_respuesta: [] },
          opcion_respuesta: { id: 'o1', orden: 1 }
        },
        {
          id: 'r4',
          pregunta_id: 'p2',
          opcion_id: 'o2',
          es_correcta: true, // Q2: Correct (50% total)
          puntaje_obtenido: 10,
          pregunta: { id: 'p2', orden: 2, habilitada: true, num_opciones: 4, opciones_respuesta: [] },
          opcion_respuesta: { id: 'o2', orden: 2 }
        }
      ]
    }
  ]

  it('renders no data message when resultados is empty', () => {
    render(<QuestionAnalysisCard resultados={[]} totalPreguntas={10} />)
    expect(screen.getByText('title')).toBeInTheDocument()
    expect(screen.getByText('noData')).toBeInTheDocument()
  })

  it('renders chart and statistics when data is provided', () => {
    render(<QuestionAnalysisCard resultados={mockResultados} totalPreguntas={2} />)

    expect(screen.getByText('title')).toBeInTheDocument()
    expect(screen.getByText('description')).toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('calculates statistics correctly', () => {
    // Q1: 2/2 correct -> 100%
    // Q2: 1/2 correct -> 50%
    // Average: (100 + 50) / 2 = 75%
    // Highest: 100% (Q1)
    // Lowest: 50% (Q2)

    render(<QuestionAnalysisCard resultados={mockResultados} totalPreguntas={2} />)

    expect(screen.getByText('75%')).toBeInTheDocument() // Average
    expect(screen.getByText('100%')).toBeInTheDocument() // Highest
    expect(screen.getByText('50%')).toBeInTheDocument() // Lowest
  })

  it('passes correct data to chart', () => {
    render(<QuestionAnalysisCard resultados={mockResultados} totalPreguntas={2} />)

    const chart = screen.getByTestId('bar-chart')
    const data = JSON.parse(chart.getAttribute('data-chart-data') || '[]')

    expect(data).toHaveLength(2)

    // Check Q1 (100%)
    const q1 = data.find((d: any) => d.question === 'axis.questionPrefix1')
    expect(q1.percentage).toBe(100)
    expect(q1['Excelente']).toBe(100) // >= 80%
    expect(q1['Bueno']).toBe(0)
    expect(q1['Bajo']).toBe(0)

    // Check Q2 (50%)
    const q2 = data.find((d: any) => d.question === 'axis.questionPrefix2')
    expect(q2.percentage).toBe(50)
    expect(q2['Excelente']).toBe(0)
    expect(q2['Bueno']).toBe(50) // 50-79%
    expect(q2['Bajo']).toBe(0)
  })

  it('handles disabled questions correctly in stats', () => {
    const disabledResults = JSON.parse(JSON.stringify(mockResultados))
    // Mark Q1 as disabled in the response
    disabledResults[0].respuestas_estudiante[0].pregunta.habilitada = false

    render(<QuestionAnalysisCard resultados={disabledResults} totalPreguntas={2} />)

    const chart = screen.getByTestId('bar-chart')
    const data = JSON.parse(chart.getAttribute('data-chart-data') || '[]')

    // Check Q1
    const q1 = data.find((d: any) => d.question === 'axis.questionPrefix1')
    expect(q1.isDisabled).toBe(true)
  })
})
