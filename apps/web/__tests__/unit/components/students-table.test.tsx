import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'

import { StudentsTable } from '@/app/[locale]/dashboard/students/components/StudentsTable'

const translations: Record<string, string> = {
  'table.studentsFound': 'estudiantes encontrados',
  'table.noStudents': 'Sin estudiantes',
  'table.headers.surnames': 'Apellidos',
  'table.headers.names': 'Nombres',
  'table.headers.fullName': 'Apellidos y Nombres',
  'table.headers.identification': 'Identificación',
  'table.headers.email': 'Email',
  'table.headers.actions': 'Acciones',
  'table.actions.viewDetails': 'Ver Detalles',
  'pagination.showing': 'Mostrando',
  'pagination.of': 'de',
  'pagination.students': 'estudiantes',
  'pagination.page': 'Página',
  'pagination.previous': 'Anterior',
  'pagination.next': 'Siguiente',
}

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => translations[key] ?? key,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}))

vi.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
}))

vi.mock('lucide-react', () => ({
  Users: () => <span data-testid="users-icon" />,
  RefreshCw: () => <span />,
  ChevronLeft: () => <span />,
  ChevronRight: () => <span />,
}))

describe('StudentsTable', () => {
  const baseProps = {
    searchQuery: '',
    onViewDetails: vi.fn(),
    loadingDetails: false,
    selectedStudentId: null as string | null,
  }

  it('shows translated empty state when no students match', () => {
    render(
      <StudentsTable
        students={[]}
        {...baseProps}
      />
    )

    expect(screen.getByText('0 estudiantes encontrados')).toBeInTheDocument()
    expect(screen.getByText('Sin estudiantes')).toBeInTheDocument()
  })

  it('renders separate name columns when students include nombres', () => {
    const students = [
      {
        id: '1',
        apellidos: 'Pérez',
        nombres: 'Ana',
        identificacion: '123',
        email: 'ana@example.com',
        created_at: new Date().toISOString(),
      },
    ]

    render(
      <StudentsTable
        students={students as any}
        {...baseProps}
      />
    )

    const table = screen.getByRole('table')
    expect(within(table).getByText('Apellidos')).toBeInTheDocument()
    expect(within(table).getByText('Nombres')).toBeInTheDocument()
  })

  it('renders combined column when nombres are null', () => {
    const students = [
      {
        id: '1',
        apellidos: 'García Ana',
        nombres: null,
        identificacion: '456',
        email: '',
        created_at: new Date().toISOString(),
      },
    ]

    render(
      <StudentsTable
        students={students as any}
        {...baseProps}
      />
    )

    const table = screen.getByRole('table')
    expect(within(table).getByText('Apellidos y Nombres')).toBeInTheDocument()
    expect(within(table).queryByText('Nombres')).not.toBeInTheDocument()
  })
})
