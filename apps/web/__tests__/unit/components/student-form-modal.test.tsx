import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { StudentFormModal } from '@/app/[locale]/dashboard/students/components/StudentFormModal'

const translationMap: Record<string, string> = {
  'dashboard.students.form.placeholders.names': 'Nombres del estudiante',
  'dashboard.students.form.placeholders.surnames': 'Apellidos del estudiante',
  'dashboard.students.form.placeholders.identification': 'Número de identificación',
  'dashboard.students.form.placeholders.email': 'Correo del estudiante',
  'dashboard.students.form.actions.create': 'Crear Estudiante',
  'dashboard.students.form.errors.noSession': 'No hay sesión activa',
  'common.components.excelImport.columns.fullName': 'Apellidos y Nombres',
  'common.components.excelImport.options.title': 'Opciones de importación',
  'common.components.excelImport.options.separateNames': 'Separar nombres',
  'common.components.excelImport.options.includeEmails': 'Incluir correos',
}

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const compositeKey = `${namespace}.${key}`
    return translationMap[compositeKey] ?? key
  },
}))

const { mockGetSession, mockFrom, mockRpc } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: mockGetSession },
    from: mockFrom,
    rpc: mockRpc,
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}))

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ id, checked, onCheckedChange }: { id: string; checked?: boolean; onCheckedChange: (checked: boolean) => void }) => (
    <input
      type="checkbox"
      data-testid={id}
      checked={!!checked}
      onChange={(event) => onCheckedChange(event.target.checked)}
    />
  ),
}))

const SelectContext = React.createContext<(value: string) => void>(() => {})

vi.mock('@/components/ui/select', () => {
  return {
    Select: ({ children, onValueChange }: { children: React.ReactNode; onValueChange: (value: string) => void }) => (
      <SelectContext.Provider value={onValueChange}>
        <div>{children}</div>
      </SelectContext.Provider>
    ),
    SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
    SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => {
      const handleChange = React.useContext(SelectContext)
      return (
        <button type="button" data-testid={`select-item-${value}`} onClick={() => handleChange(value)}>
          {children}
        </button>
      )
    },
  }
})

const createGruposQuery = (singleResult: any) => {
  const builder: any = {}
  builder.select = vi.fn(() => builder)
  builder.eq = vi.fn(() => builder)
  builder.single = vi.fn(() => Promise.resolve(singleResult))
  return builder
}

const createEstudiantesQuery = (limitResult: any) => {
  const builder: any = {}
  builder.select = vi.fn(() => builder)
  builder.eq = vi.fn(() => builder)
  builder.limit = vi.fn(() => Promise.resolve(limitResult))
  return builder
}

describe('StudentFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'prof-1' } } } })
  })

  const createDefaultProps = () => ({
    open: true,
    onOpenChange: vi.fn(),
    grupos: [
      {
        id: 'group-1',
        nombre: 'Grupo 1',
        materias: { nombre: 'Matemáticas' },
      },
    ],
    onSuccess: vi.fn(),
  })

  it('creates a new student using combined full name when options remain disabled', async () => {
    const gruposQuery = createGruposQuery({ data: { id: 'group-1' }, error: null })
    const estudiantesQuery = createEstudiantesQuery({ data: [], error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'grupos') return gruposQuery
      if (table === 'estudiantes') return estudiantesQuery
      throw new Error(`Unexpected table ${table}`)
    })

    mockRpc.mockResolvedValue({ data: 'student-99', error: null })

    const props = createDefaultProps()
    render(<StudentFormModal {...props} />)

    fireEvent.change(screen.getByPlaceholderText('Apellidos y Nombres'), {
      target: { value: '  PARRA ANDRES  ' },
    })

    fireEvent.change(screen.getByPlaceholderText('Número de identificación'), {
      target: { value: '  12345  ' },
    })

    fireEvent.click(screen.getByTestId('select-item-group-1'))

    fireEvent.click(screen.getByRole('button', { name: 'Crear Estudiante' }))

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledTimes(1)
    })

    expect(mockRpc).toHaveBeenCalledWith('crear_estudiante_en_grupo', {
      p_nombres: null,
      p_apellidos: 'PARRA ANDRES',
      p_identificacion: '12345',
      p_email: null,
      p_grupo_id: 'group-1',
    })
    expect(props.onSuccess).toHaveBeenCalled()
  })

  it('links an existing student when separating names and including emails', async () => {
    const gruposQuery = createGruposQuery({ data: { id: 'group-1' }, error: null })
    const estudiantesQuery = createEstudiantesQuery({ data: [{ id: 'student-1' }], error: null })
    const estudianteGrupoQuery = {
      upsert: vi.fn(() => Promise.resolve({ error: null })),
    }

    mockFrom.mockImplementation((table: string) => {
      if (table === 'grupos') return gruposQuery
      if (table === 'estudiantes') return estudiantesQuery
      if (table === 'estudiante_grupo') return estudianteGrupoQuery
      throw new Error(`Unexpected table ${table}`)
    })

    const props = createDefaultProps()
    render(<StudentFormModal {...props} />)

    fireEvent.click(screen.getByTestId('separate-names'))

    fireEvent.change(screen.getByPlaceholderText('Nombres del estudiante'), {
      target: { value: '  María  ' },
    })
    fireEvent.change(screen.getByPlaceholderText('Apellidos del estudiante'), {
      target: { value: '  López ' },
    })

    fireEvent.click(screen.getByTestId('include-emails'))

    fireEvent.change(screen.getByPlaceholderText('Correo del estudiante'), {
      target: { value: '  maria@example.com  ' },
    })

    fireEvent.change(screen.getByPlaceholderText('Número de identificación'), {
      target: { value: '  98765 ' },
    })

    fireEvent.click(screen.getByTestId('select-item-group-1'))

    fireEvent.click(screen.getByRole('button', { name: 'Crear Estudiante' }))

    await waitFor(() => {
      expect(estudianteGrupoQuery.upsert).toHaveBeenCalledTimes(1)
    })

    expect(mockRpc).not.toHaveBeenCalled()
    expect(estudianteGrupoQuery.upsert).toHaveBeenCalledWith(
      {
        estudiante_id: 'student-1',
        grupo_id: 'group-1',
      },
      {
        onConflict: 'estudiante_id,grupo_id',
        ignoreDuplicates: true,
      }
    )

    await waitFor(() => {
      expect(props.onSuccess).toHaveBeenCalled()
      expect(props.onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('shows localized error when there is no active session', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null } })

    const props = createDefaultProps()
    render(<StudentFormModal {...props} />)

    fireEvent.change(screen.getByPlaceholderText('Apellidos y Nombres'), {
      target: { value: 'Estudiante Demo' },
    })

    fireEvent.change(screen.getByPlaceholderText('Número de identificación'), {
      target: { value: 'ABC123' },
    })

    fireEvent.click(screen.getByTestId('select-item-group-1'))

    fireEvent.click(screen.getByRole('button', { name: 'Crear Estudiante' }))

    await waitFor(() => {
      expect(screen.getByText('No hay sesión activa')).toBeInTheDocument()
    })

    expect(props.onSuccess).not.toHaveBeenCalled()
  })
})
