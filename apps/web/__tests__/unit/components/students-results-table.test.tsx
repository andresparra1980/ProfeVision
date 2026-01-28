import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StudentsResultsTable } from '@/components/exam-results/tables/students-results-table'
import type { Estudiante, ResultadoExamen } from '@/components/exam-results/utils/types'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))



// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Search: () => <span data-testid="icon-search" />,
  ChevronLeft: () => <span data-testid="icon-chevron-left" />,
  ChevronRight: () => <span data-testid="icon-chevron-right" />,
}))

describe('StudentsResultsTable', () => {
  const mockEstudiantes: Estudiante[] = [
    { id: '1', nombres: 'Juan', apellidos: 'Perez', identificacion: '111' },
    { id: '2', nombres: 'Maria', apellidos: 'Gomez', identificacion: '222' },
    { id: '3', nombres: 'Carlos', apellidos: 'Lopez', identificacion: '333' },
  ]

  const mockResultados: ResultadoExamen[] = [
    {
      id: 'r1',
      estudiante_id: '1',
      puntaje_obtenido: 80,
      porcentaje: 80,
      fecha_calificacion: '2023-01-01',
      estudiante: mockEstudiantes[0],
      respuestas_estudiante: []
    }
  ]

  const defaultProps = {
    todosEstudiantes: mockEstudiantes,
    resultados: mockResultados,
    verSoloConExamen: false,
    onShowDetails: vi.fn(),
    onShowManualGrade: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders table with students', () => {
    render(<StudentsResultsTable {...defaultProps} />)
    // getStudentDisplayName with 'lastFirst' renders "Lastname, Firstname"
    expect(screen.getAllByText('Perez, Juan')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Gomez, Maria')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Lopez, Carlos')[0]).toBeInTheDocument()
  })

  it('shows graded status correctly', () => {
    render(<StudentsResultsTable {...defaultProps} />)
    // Juan has a result (appears in table and mobile card)
    expect(screen.getAllByText('status.graded')).toHaveLength(2)
    // Maria and Carlos do not (2 students * 2 views = 4)
    expect(screen.getAllByText('status.notPresented')).toHaveLength(4)
  })

  it('filters by search query', () => {
    render(<StudentsResultsTable {...defaultProps} />)
    const searchInput = screen.getByPlaceholderText('searchPlaceholder')

    fireEvent.change(searchInput, { target: { value: 'Maria' } })

    expect(screen.getAllByText('Gomez, Maria')[0]).toBeInTheDocument()
    expect(screen.queryByText('Perez, Juan')).not.toBeInTheDocument()
  })

  it('filters by "verSoloConExamen"', () => {
    render(<StudentsResultsTable {...defaultProps} verSoloConExamen={true} />)

    expect(screen.getAllByText('Perez, Juan')[0]).toBeInTheDocument()
    expect(screen.queryByText('Gomez, Maria')).not.toBeInTheDocument()
  })

  it('calls onShowDetails when viewing a graded student', () => {
    render(<StudentsResultsTable {...defaultProps} />)

    // Find the "View Details" button for Juan
    const detailsButtons = screen.getAllByText('viewDetailsButton')
    fireEvent.click(detailsButtons[0])

    expect(defaultProps.onShowDetails).toHaveBeenCalledWith(mockResultados[0])
  })

  it('calls onShowManualGrade when viewing an ungraded student', () => {
    render(<StudentsResultsTable {...defaultProps} />)

    // Find the "Enter Grade" button for Maria or Carlos
    const gradeButtons = screen.getAllByText('dialogs.enterGrade')
    fireEvent.click(gradeButtons[0])

    expect(defaultProps.onShowManualGrade).toHaveBeenCalled()
  })

  it('handles empty state', () => {
    render(<StudentsResultsTable {...defaultProps} todosEstudiantes={[]} />)
    expect(screen.getByText('emptyState.noResultsMessage')).toBeInTheDocument()
  })

  it('handles no search results', () => {
    render(<StudentsResultsTable {...defaultProps} />)
    const searchInput = screen.getByPlaceholderText('searchPlaceholder')
    fireEvent.change(searchInput, { target: { value: 'XYZ123' } })

    expect(screen.getByText('emptyState.noSearchResults')).toBeInTheDocument()
  })

  it('paginates correctly', () => {
    // Create 15 students to force pagination (PAGE_SIZE = 10)
    const manyStudents = Array.from({ length: 15 }, (_, i) => ({
      id: `${i}`,
      nombres: `Student ${i}`,
      apellidos: 'Test',
      identificacion: `${i}`
    }))

    render(<StudentsResultsTable {...defaultProps} todosEstudiantes={manyStudents} />)

    // First page should show 10 items
    // Using getAllByText because of mobile/desktop duplication
    expect(screen.getAllByText('Test, Student 0')[0]).toBeInTheDocument()
    expect(screen.queryByText('Test, Student 10')).not.toBeInTheDocument()

    // Click next
    const nextButton = screen.getAllByText('pagination.next')[0].closest('button')
    fireEvent.click(nextButton!)

    // Second page should show remaining items
    expect(screen.getAllByText('Test, Student 10')[0]).toBeInTheDocument()
    expect(screen.queryByText('Test, Student 0')).not.toBeInTheDocument()
  })
})
