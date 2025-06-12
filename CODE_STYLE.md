# Code Style Guidelines for ProfeVision

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [File Organization](#file-organization)
3. [Code Formatting](#code-formatting)
4. [Naming Conventions](#naming-conventions)
5. [TypeScript/JavaScript Guidelines](#typescriptjavascript-guidelines)
6. [Component Guidelines](#component-guidelines)
7. [Documentation Standards](#documentation-standards)
8. [Testing Standards](#testing-standards)
9. [Performance Guidelines](#performance-guidelines)
10. [Security Guidelines](#security-guidelines)
11. [Development Workflow](#development-workflow)
12. [Enforcement and Tools](#enforcement-and-tools)
13. [Best Practices](#best-practices)

## Introducción

Este documento define los estándares de codificación y guías de estilo para ProfeVision, asegurando consistencia y mantenibilidad a través de toda la base de código. ProfeVision es una plataforma integral que transforma la forma en que los profesores crean, administran y califican exámenes, utilizando tecnologías modernas como Next.js, TypeScript, Supabase e integración con IA.

## File Organization

### Directory Structure

```
profevision/
├── app/                      # Next.js App Router
│   ├── auth/                 # Rutas de autenticación 
│   ├── dashboard/            # Rutas del dashboard 
│   ├── api/                  # API Routes
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/               # Componentes reutilizables
│   ├── ui/                   # Componentes de UI básicos
│   ├── forms/                # Componentes de formularios
│   ├── exam/                 # Componentes específicos de exámenes
│   ├── dashboard/            # Componentes del dashboard
│   └── shared/               # Componentes compartidos
├── lib/                      # Utilidades y funciones
│   ├── api/                  # Clientes de API
│   ├── hooks/                # Custom hooks
│   ├── utils/                # Funciones utilitarias
│   ├── constants/            # Constantes
│   └── types/                # Tipos y interfaces globales
├── public/                   # Archivos estáticos
├── styles/                   # Estilos globales
├── tests/                    # Tests
│   ├── unit/                 # Tests unitarios
│   ├── integration/          # Tests de integración
│   └── e2e/                  # Tests end-to-end
├── .env.example              # Ejemplo de variables de entorno
├── .eslintrc.js              # Configuración de ESLint
├── .prettierrc               # Configuración de Prettier
├── next.config.js            # Configuración de Next.js
├── package.json              # Dependencias y scripts
├── tailwind.config.js        # Configuración de Tailwind
└── tsconfig.json             # Configuración de TypeScript
```

### File Naming Conventions

- **Componentes React**: PascalCase (ej. `ExamCreator.tsx`, `StudentList.tsx`)
- **Hooks**: camelCase con prefijo "use" (ej. `useExamData.ts`, `useAuthentication.ts`)
- **Utilidades**: camelCase (ej. `formatDate.ts`, `validateExam.ts`)
- **Constantes**: UPPER_SNAKE_CASE para el archivo (ej. `API_ENDPOINTS.ts`, `EXAM_TYPES.ts`)
- **Tipos/Interfaces**: PascalCase (ej. `ExamTypes.ts`, `UserModels.ts`)
- **Tests**: mismo nombre que el archivo testeado con sufijo `.test` o `.spec` (ej. `ExamCreator.test.tsx`)
- **API Routes**: camelCase (ej. `createExam.ts`, `getStudents.ts`)

### Module Organization

- Importaciones agrupadas en el siguiente orden:
  1. Importaciones de React/Next.js
  2. Importaciones de librerías externas
  3. Importaciones de componentes internos
  4. Importaciones de hooks, utilidades y tipos internos
  5. Importaciones de assets y estilos

```typescript
// 1. React/Next.js imports
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// 2. External libraries
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

// 3. Internal components
import { Button } from '@/components/ui/button';
import { ExamPreview } from '@/components/exam/ExamPreview';

// 4. Internal hooks, utils, and types
import { useExamData } from '@/lib/hooks/useExamData';
import { formatExamDate } from '@/lib/utils/formatters';
import type { Exam } from '@/lib/types/examTypes';

// 5. Assets and styles
import '@/styles/exam-creator.css';
```

### Import/Export Patterns

- Preferir importaciones con nombre en lugar de importaciones por defecto
- Utilizar alias de importación para evitar rutas largas
- Exportar múltiples elementos en un solo archivo index.ts para facilitar importaciones

```typescript
// Preferido
import { Button } from '@/components/ui/button';

// Evitar
import Button from '@/components/ui/button';

// Exportaciones en index.ts
export * from './Button';
export * from './Input';
export * from './Select';
```

### Code Grouping Within Files

- Organizar el código en secciones lógicas con comentarios descriptivos
- Para componentes React, seguir este orden:
  1. Definición de tipos/interfaces
  2. Constantes
  3. Definición del componente
  4. Hooks y estado
  5. Funciones auxiliares
  6. Efectos
  7. Renderizado (return)

```typescript
// Types
interface ExamCreatorProps {
  courseId: string;
  initialData?: Exam;
}

// Constants
const MAX_QUESTIONS = 100;

// Component
export function ExamCreator({ courseId, initialData }: ExamCreatorProps) {
  // Hooks and state
  const [questions, setQuestions] = useState<Question[]>([]);
  const router = useRouter();
  
  // Helper functions
  const addQuestion = () => {
    // Implementation
  };
  
  // Effects
  useEffect(() => {
    // Implementation
  }, [courseId]);
  
  // Render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

## Code Formatting

### Indentation and Spacing

- Usar 2 espacios para indentación
- No usar tabs
- Usar líneas en blanco para separar bloques lógicos de código
- Limitar líneas a 100 caracteres
- Añadir espacios alrededor de operadores
- No añadir espacios dentro de paréntesis o corchetes

### Brackets and Line Breaks

- Abrir llaves en la misma línea que la declaración
- Cerrar llaves en una nueva línea
- Usar llaves incluso para bloques de una sola línea
- Usar paréntesis para mejorar la legibilidad en expresiones complejas

```typescript
// Correcto
if (condition) {
  doSomething();
} else {
  doSomethingElse();
}

// Incorrecto
if (condition) doSomething();
else
  doSomethingElse();
```

### Quotes and Semicolons

- Usar comillas simples (`'`) para strings
- Usar comillas dobles (`"`) para JSX
- Usar semicolons al final de cada declaración
- Usar template literals para strings con interpolación

```typescript
const name = 'John';
const greeting = `Hello, ${name}!`;

return (
  <div className="container">
    <p>{greeting}</p>
  </div>
);
```

### Trailing Commas

- Usar trailing commas en arrays y objetos multilínea
- No usar trailing commas en arrays y objetos de una sola línea

```typescript
// Multilínea con trailing commas
const options = {
  enabled: true,
  visible: false,
  items: ['item1', 'item2'],
};

// Una línea sin trailing commas
const simpleOptions = { enabled: true, visible: false };
```

### Comments

- Usar `//` para comentarios de una sola línea
- Usar `/* */` para comentarios multilínea
- Usar JSDoc para documentar funciones, clases e interfaces
- Mantener los comentarios actualizados con el código
- Evitar comentarios obvios

```typescript
// Comentario de una sola línea

/*
 * Comentario
 * multilínea
 */

/**
 * Calcula la calificación final del examen
 * @param answers - Respuestas del estudiante
 * @param correctAnswers - Respuestas correctas
 * @returns Calificación en porcentaje (0-100)
 */
function calculateScore(answers: Answer[], correctAnswers: Answer[]): number {
  // Implementación
}
```

## Naming Conventions

### Variables and Functions

- **Variables**: camelCase descriptivo que indique contenido y tipo
- **Funciones**: camelCase con verbo que indique acción
- **Booleanos**: prefijo "is", "has", "should", etc.
- **Arrays**: nombres en plural
- **Event Handlers**: prefijo "handle" o "on"
- **Callbacks**: sufijo "Callback"

```typescript
// Variables
const examTitle = 'Matemáticas 101';
const isSubmitted = false;
const hasErrors = true;
const students = ['Ana', 'Juan', 'Pedro'];

// Funciones
function calculateScore() {}
function fetchExamData() {}
function validateInput() {}

// Event Handlers
function handleSubmit() {}
function onQuestionChange() {}

// Callbacks
function fetchDataCallback() {}
```

### Classes, Interfaces, and Types

- **Classes**: PascalCase
- **Interfaces**: PascalCase, sin prefijo "I"
- **Type Aliases**: PascalCase
- **Enums**: PascalCase
- **Generic Type Parameters**: PascalCase, preferiblemente una letra (T, K, V)

```typescript
// Clase
class ExamGenerator {
  // Implementación
}

// Interface
interface ExamQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

// Type Alias
type QuestionType = 'multiple' | 'truefalse' | 'short';

// Enum
enum ExamStatus {
  Draft,
  Published,
  Completed,
  Archived,
}

// Generic
function getFirstItem<T>(items: T[]): T {
  return items[0];
}
```

### Constants

- **Constants**: UPPER_SNAKE_CASE para valores que nunca cambian
- **Configuration Constants**: camelCase para valores de configuración

```typescript
// Constantes inmutables
const MAX_QUESTIONS_PER_EXAM = 100;
const API_BASE_URL = 'https://api.profevision.com';

// Valores de configuración
const defaultPagination = {
  pageSize: 10,
  initialPage: 1,
};
```

### Components

- **Componentes React**: PascalCase
- **Archivos de Componentes**: mismo nombre que el componente
- **Props**: camelCase
- **Event Handler Props**: prefijo "on" (ej. `onClick`, `onSubmit`)

```typescript
// ExamCreator.tsx
interface ExamCreatorProps {
  initialData?: Exam;
  onSave: (exam: Exam) => void;
  onCancel: () => void;
}

export function ExamCreator({ initialData, onSave, onCancel }: ExamCreatorProps) {
  // Implementación
}
```

## TypeScript/JavaScript Guidelines

### Type Annotations

- Añadir tipos explícitos para parámetros de funciones
- Permitir inferencia de tipos para variables cuando sea obvio
- Usar tipos explícitos para arrays y objetos complejos
- Evitar `any`, preferir `unknown` cuando sea necesario
- Usar tipos de retorno explícitos para funciones no triviales

```typescript
// Tipos explícitos para parámetros
function calculateScore(answers: Answer[], correctAnswers: Answer[]): number {
  // Implementación
}

// Inferencia de tipos para variables simples
const count = 0; // Inferido como number
const name = 'John'; // Inferido como string

// Tipos explícitos para estructuras complejas
const options: FilterOptions = {
  sortBy: 'date',
  limit: 10,
};

// Evitar any
function processData(data: unknown): void {
  if (typeof data === 'string') {
    // Ahora TypeScript sabe que data es string
  }
}
```

### Interface vs Type

- Usar `interface` para definir objetos y clases
- Usar `type` para uniones, intersecciones y tipos utilitarios
- Extender interfaces en lugar de intersecciones cuando sea posible
- Ser consistente en el uso dentro del mismo contexto

```typescript
// Interface para objetos
interface User {
  id: string;
  name: string;
  email: string;
}

// Extender interfaces
interface Student extends User {
  courseIds: string[];
  grade: number;
}

// Type para uniones
type QuestionType = 'multiple' | 'truefalse' | 'short';

// Type para mapeos y utilidades
type UserRecord = Record<string, User>;
```

### Null and Undefined

- Preferir `undefined` sobre `null` para valores opcionales
- Usar el operador de optional chaining (`?.`) para acceder a propiedades que pueden ser undefined
- Usar el operador nullish coalescing (`??`) para valores por defecto
- Evitar comparaciones no estrictas (`==`, `!=`)

```typescript
// Preferir undefined
function getUser(id?: string) {
  if (id === undefined) {
    return defaultUser;
  }
  // ...
}

// Optional chaining
const userName = user?.profile?.name;

// Nullish coalescing
const count = data?.count ?? 0;

// Comparaciones estrictas
if (value === null || value === undefined) {
  // ...
}
```

### Error Handling

- Usar try/catch para operaciones que pueden fallar
- Crear clases de error personalizadas para diferentes tipos de errores
- Propagar errores con información contextual
- Usar async/await con try/catch para código asíncrono

```typescript
// Clase de error personalizada
class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Manejo de errores
async function fetchExamData(examId: string): Promise<Exam> {
  try {
    const response = await fetch(`/api/exams/${examId}`);
    
    if (!response.ok) {
      throw new APIError(
        'Failed to fetch exam data',
        response.status,
        { examId }
      );
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching exam:', error);
    throw error;
  }
}
```

### Async/Await Patterns

- Preferir async/await sobre promesas encadenadas
- Usar try/catch para manejar errores en funciones async
- Evitar mezclar async/await con .then()/.catch()
- Usar Promise.all para operaciones paralelas

```typescript
// Preferido
async function loadExamData(examId: string) {
  try {
    const [exam, questions, students] = await Promise.all([
      fetchExam(examId),
      fetchQuestions(examId),
      fetchStudents(examId),
    ]);
    
    return { exam, questions, students };
  } catch (error) {
    handleError(error);
    throw error;
  }
}

// Evitar
function loadExamData(examId: string) {
  return fetchExam(examId)
    .then(exam => {
      return fetchQuestions(examId)
        .then(questions => {
          return fetchStudents(examId)
            .then(students => {
              return { exam, questions, students };
            });
        });
    })
    .catch(handleError);
}
```

## Component Guidelines

### Component Composition

- Crear componentes pequeños y enfocados en una sola responsabilidad
- Componer componentes complejos a partir de componentes más simples
- Usar children y render props para componentes flexibles
- Separar lógica de presentación (smart vs. dumb components)

```typescript
// Componente de presentación
function ExamQuestion({ question, onAnswerSelect }: ExamQuestionProps) {
  return (
    <div className="question-container">
      <h3>{question.text}</h3>
      <OptionsList 
        options={question.options} 
        selectedOption={question.selectedOption}
        onSelect={onAnswerSelect}
      />
    </div>
  );
}

// Componente con lógica
function ExamQuestionContainer({ questionId }: { questionId: string }) {
  const { question, selectAnswer } = useQuestion(questionId);
  
  const handleAnswerSelect = (optionId: string) => {
    selectAnswer(questionId, optionId);
  };
  
  return (
    <ExamQuestion 
      question={question} 
      onAnswerSelect={handleAnswerSelect} 
    />
  );
}
```

### Props Interface Definitions

- Definir interfaces para props al inicio del archivo
- Usar props opcionales con valores por defecto cuando sea apropiado
- Documentar props con JSDoc
- Agrupar props relacionadas en objetos cuando hay muchas

```typescript
/**
 * Componente que muestra una pregunta de examen con opciones seleccionables
 */
interface ExamQuestionProps {
  /** Datos de la pregunta */
  question: {
    id: string;
    text: string;
    options: Option[];
    selectedOption?: string;
  };
  /** Callback llamado cuando se selecciona una opción */
  onAnswerSelect: (optionId: string) => void;
  /** Indica si la pregunta está deshabilitada */
  disabled?: boolean;
  /** Estilo visual de la pregunta */
  variant?: 'default' | 'compact' | 'detailed';
}

// Valores por defecto
const defaultProps = {
  disabled: false,
  variant: 'default',
} as const;

export function ExamQuestion({
  question,
  onAnswerSelect,
  disabled = defaultProps.disabled,
  variant = defaultProps.variant,
}: ExamQuestionProps) {
  // Implementación
}
```

### State Management

- Usar useState para estado local simple
- Usar useReducer para estado complejo o relacionado
- Usar Context API para estado compartido entre componentes
- Usar SWR para estado derivado de API
- Mantener el estado lo más local posible

```typescript
// Estado local simple
function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}

// Estado complejo con useReducer
type State = {
  questions: Question[];
  currentIndex: number;
  isSubmitting: boolean;
  errors: string[];
};

type Action =
  | { type: 'ADD_QUESTION'; payload: Question }
  | { type: 'REMOVE_QUESTION'; payload: string }
  | { type: 'SET_CURRENT'; payload: number }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; payload: string };

function examReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_QUESTION':
      return {
        ...state,
        questions: [...state.questions, action.payload],
      };
    // Otros casos...
    default:
      return state;
  }
}

function ExamEditor() {
  const [state, dispatch] = useReducer(examReducer, initialState);
  
  // Uso del reducer
  const addQuestion = (question: Question) => {
    dispatch({ type: 'ADD_QUESTION', payload: question });
  };
  
  // ...
}
```

### Custom Hooks

- Extraer lógica reutilizable en custom hooks
- Nombrar hooks con prefijo "use"
- Mantener hooks enfocados en una sola responsabilidad
- Documentar hooks con JSDoc

```typescript
/**
 * Hook para gestionar la creación y edición de exámenes
 * @param examId - ID del examen a editar, undefined para crear nuevo
 * @returns Métodos y estado para gestionar el examen
 */
function useExamForm(examId?: string) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Cargar datos existentes si hay examId
  useEffect(() => {
    if (examId) {
      fetchExam(examId);
    }
  }, [examId]);
  
  // Método para cargar el examen
  const fetchExam = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await api.getExam(id);
      setExam(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Otros métodos...
  
  return {
    exam,
    isLoading,
    error,
    updateExam: setExam,
    saveExam,
    // Otros métodos...
  };
}
```

### Render Optimization

- Usar React.memo para componentes que renderizan frecuentemente
- Usar useCallback para funciones pasadas como props
- Usar useMemo para cálculos costosos
- Evitar renderizados innecesarios
- Implementar virtualización para listas largas

```typescript
// Memoización de componente
const QuestionOption = React.memo(function QuestionOption({
  text,
  isSelected,
  onSelect,
}: OptionProps) {
  return (
    <div 
      className={`option ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      {text}
    </div>
  );
});

// useCallback para handlers
function QuestionList({ questions }: { questions: Question[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);
  
  return (
    <div>
      {questions.map(question => (
        <QuestionItem
          key={question.id}
          question={question}
          isSelected={question.id === selectedId}
          onSelect={() => handleSelect(question.id)}
        />
      ))}
    </div>
  );
}

// useMemo para cálculos costosos
function ExamStats({ answers }: { answers: Answer[] }) {
  const stats = useMemo(() => {
    return calculateComplexStats(answers);
  }, [answers]);
  
  return <div>{/* Render stats */}</div>;
}
```

## Documentation Standards

### JSDoc

- Documentar todas las funciones, clases e interfaces públicas
- Incluir descripción, parámetros, tipo de retorno y ejemplos
- Usar tags estándar de JSDoc (@param, @returns, @example, etc.)
- Mantener la documentación actualizada con el código

```typescript
/**
 * Genera un nuevo examen basado en parámetros y contenido
 * 
 * @param params - Parámetros de configuración del examen
 * @param params.title - Título del examen
 * @param params.subject - Materia del examen
 * @param params.difficulty - Nivel de dificultad (1-5)
 * @param params.questionCount - Número de preguntas a generar
 * @param content - Contenido base para generar preguntas
 * 
 * @returns Objeto con el examen generado y metadata
 * 
 * @example
 * ```ts
 * const exam = await generateExam({
 *   title: "Matemáticas - Álgebra",
 *   subject: "Matemáticas",
 *   difficulty: 3,
 *   questionCount: 10
 * }, "Ecuaciones de primer grado, factorización...");
 * ```
 */
async function generateExam(
  params: ExamGenerationParams,
  content: string
): Promise<GeneratedExam> {
  // Implementación
}
```

### README Structure

- Cada carpeta principal debe tener un README.md
- El README principal debe incluir:
  - Descripción del proyecto
  - Requisitos
  - Instalación
  - Configuración
  - Uso
  - Estructura del proyecto
  - Contribución
  - Licencia

```markdown
# Nombre del Componente/Módulo

## Descripción
Breve descripción de la funcionalidad y propósito.

## Uso
```tsx
import { ComponentName } from '@/components/path';

function Example() {
  return <ComponentName prop1="value" />;
}
```

## Props
| Nombre | Tipo | Default | Descripción |
|--------|------|---------|-------------|
| prop1  | string | - | Descripción de prop1 |
| prop2  | number | 0 | Descripción de prop2 |

## Ejemplos
Ejemplos adicionales de uso.
```

### Code Comments

- Usar comentarios para explicar "por qué", no "qué"
- Comentar código complejo o no intuitivo
- Usar TODO, FIXME, NOTE para marcar tareas pendientes
- Mantener los comentarios actualizados

```typescript
// GOOD: Explica por qué
// Usamos setTimeout para evitar un problema de race condition con la API
setTimeout(() => {
  fetchData();
}, 100);

// BAD: Explica qué (obvio del código)
// Incrementa el contador
count++;

// Marcadores especiales
// TODO: Refactorizar esto cuando implementemos la nueva API
// FIXME: Esta solución es temporal, tiene un bug cuando count > 1000
// NOTE: La API tiene un límite de 100 requests por minuto
```

## Testing Standards

### Test Organization

- Organizar tests en la misma estructura que el código fuente
- Usar archivos `.test.ts` o `.spec.ts` junto a los archivos que prueban
- Agrupar tests relacionados en bloques `describe`
- Usar nombres descriptivos para los tests

```
components/
├── ExamCreator/
│   ├── ExamCreator.tsx
│   ├── ExamCreator.test.tsx
│   └── index.ts
```

### Test Structure

- Seguir el patrón AAA (Arrange-Act-Assert)
- Usar nombres descriptivos para los tests
- Mantener los tests independientes entre sí
- Minimizar el uso de mocks

```typescript
describe('ExamCreator', () => {
  describe('addQuestion', () => {
    it('should add a new question to the exam', () => {
      // Arrange
      const { result } = renderHook(() => useExamCreator());
      const newQuestion = { id: '1', text: 'Question?', options: [] };
      
      // Act
      act(() => {
        result.current.addQuestion(newQuestion);
      });
      
      // Assert
      expect(result.current.questions).toContain(newQuestion);
      expect(result.current.questions).toHaveLength(1);
    });
    
    it('should not add a question if max limit is reached', () => {
      // Test implementation
    });
  });
});
```

### Mock Data

- Crear factories para generar datos de prueba
- Mantener los mocks lo más cercanos posible a los datos reales
- Centralizar mocks comunes en archivos de utilidades
- Documentar cualquier suposición sobre los datos

```typescript
// test/factories/exam.ts
export function createMockExam(overrides = {}): Exam {
  return {
    id: 'exam-1',
    title: 'Test Exam',
    subject: 'Mathematics',
    questions: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockQuestion(overrides = {}): Question {
  return {
    id: `question-${Math.random().toString(36).substr(2, 9)}`,
    text: 'Sample question?',
    type: 'multiple',
    options: [
      { id: 'a', text: 'Option A' },
      { id: 'b', text: 'Option B' },
      { id: 'c', text: 'Option C' },
    ],
    correctOptionId: 'a',
    ...overrides,
  };
}

// Uso en tests
import { createMockExam, createMockQuestion } from '@/test/factories/exam';

it('should render exam correctly', () => {
  const exam = createMockExam({
    questions: [
      createMockQuestion({ text: 'Custom question?' }),
    ],
  });
  
  render(<ExamPreview exam={exam} />);
  // Assertions...
});
```

### Coverage Requirements

- Mínimo 80% de cobertura de código
- 100% de cobertura para utilidades críticas y lógica de negocio
- Priorizar cobertura de casos de borde y manejo de errores
- Ejecutar informes de cobertura en CI

### Integration Tests

- Probar flujos completos de usuario
- Minimizar mocks en tests de integración
- Usar datos realistas
- Probar interacciones entre componentes

```typescript
describe('Exam Creation Flow', () => {
  it('should create and save a new exam', async () => {
    // Setup
    const user = userEvent.setup();
    render(<ExamCreationPage />);
    
    // Fill form
    await user.type(screen.getByLabelText(/title/i), 'Math Exam');
    await user.selectOptions(screen.getByLabelText(/subject/i), 'Mathematics');
    
    // Add questions
    await user.click(screen.getByText(/add question/i));
    await user.type(screen.getByLabelText(/question text/i), 'What is 2+2?');
    
    // Save exam
    await user.click(screen.getByText(/save exam/i));
    
    // Assert
    expect(await screen.findByText(/exam saved/i)).toBeInTheDocument();
    expect(mockCreateExam).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Math Exam',
      subject: 'Mathematics',
    }));
  });
});
```

### E2E Testing

- Usar Cypress o Playwright para tests E2E
- Cubrir flujos críticos de usuario
- Simular condiciones reales
- Incluir validación visual cuando sea necesario

```typescript
// cypress/e2e/exam_creation.cy.ts
describe('Exam Creation', () => {
  beforeEach(() => {
    cy.login('teacher@example.com', 'password');
    cy.visit('/exams/create');
  });
  
  it('should create a new exam with AI assistance', () => {
    // Fill basic info
    cy.get('[data-testid=exam-title]').type('Algebra Test');
    cy.get('[data-testid=exam-subject]').select('Mathematics');
    
    // Use AI to generate questions
    cy.get('[data-testid=ai-generate-btn]').click();
    cy.get('[data-testid=topic-input]').type('Quadratic equations');
    cy.get('[data-testid=generate-confirm-btn]').click();
    
    // Wait for generation and verify
    cy.get('[data-testid=question-item]', { timeout: 10000 })
      .should('have.length.at.least', 5);
    
    // Save exam
    cy.get('[data-testid=save-exam-btn]').click();
    
    // Verify success and redirection
    cy.get('[data-testid=success-message]').should('be.visible');
    cy.url().should('include', '/exams/');
  });
});
```

## Performance Guidelines

### Bundle Optimization

- Implementar code splitting para reducir el tamaño inicial del bundle
- Usar dynamic imports para componentes grandes o poco frecuentes
- Configurar correctamente la optimización de imágenes de Next.js
- Minimizar dependencias externas
- Analizar regularmente el tamaño del bundle con herramientas como `@next/bundle-analyzer`

```typescript
// Code splitting con dynamic import
import dynamic from 'next/dynamic';

const ExamPDFViewer = dynamic(() => import('@/components/exam/ExamPDFViewer'), {
  loading: () => <p>Loading viewer...</p>,
  ssr: false, // Deshabilitar SSR si el componente solo funciona en cliente
});

function ExamPreviewPage() {
  return (
    <div>
      <h1>Exam Preview</h1>
      <ExamPDFViewer examId="123" />
    </div>
  );
}
```

### Lazy Loading

- Implementar lazy loading para imágenes con `next/image`
- Usar IntersectionObserver para cargar componentes cuando sean visibles
- Implementar paginación o infinite scroll para listas largas

```typescript
// Lazy loading de imágenes
import Image from 'next/image';

function StudentCard({ student }) {
  return (
    <div className="card">
      <Image
        src={student.avatarUrl}
        alt={`${student.name}'s avatar`}
        width={64}
        height={64}
        loading="lazy"
      />
      <h3>{student.name}</h3>
    </div>
  );
}

// Lazy loading de componentes con IntersectionObserver
function LazyComponent({ children }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={ref}>
      {isVisible ? children : <div style={{ height: '200px' }} />}
    </div>
  );
}
```

### State Management

- Usar Context API para estado global compartido
- Implementar SWR para fetching y caching de datos
- Evitar prop drilling excesivo
- Segmentar el estado global por dominio
- Considerar el uso de Zustand para estados complejos

```typescript
// Context API para estado global
import { createContext, useContext, useState } from 'react';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  const login = async (email: string, password: string) => {
    // Implementación
  };
  
  const logout = () => {
    // Implementación
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// SWR para fetching y caching
import useSWR from 'swr';

function useExam(examId: string) {
  const { data, error, mutate } = useSWR(
    examId ? `/api/exams/${examId}` : null,
    fetcher
  );
  
  return {
    exam: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
```

### Rendering Optimization

- Implementar virtualización para listas largas con `react-window` o `react-virtualized`
- Evitar cálculos costosos durante el renderizado
- Usar `React.memo`, `useMemo` y `useCallback` estratégicamente
- Minimizar re-renderizados innecesarios

```typescript
// Virtualización para listas largas
import { FixedSizeList } from 'react-window';

function StudentList({ students }) {
  const Row = ({ index, style }) => (
    <div style={style} className="student-row">
      <span>{students[index].name}</span>
      <span>{students[index].email}</span>
    </div>
  );
  
  return (
    <FixedSizeList
      height={500}
      width="100%"
      itemCount={students.length}
      itemSize={50}
    >
      {Row}
    </FixedSizeList>
  );
}
```

## Security Guidelines

### Authentication and Authorization

- Usar Supabase Auth para autenticación
- Implementar Row Level Security (RLS) en Supabase
- Validar permisos tanto en frontend como en backend
- Usar tokens JWT con tiempo de expiración adecuado
- Implementar autenticación multifactor para roles sensibles

```typescript
// Ejemplo de políticas RLS en Supabase
/*
CREATE POLICY "Users can only see their own exams"
ON exams
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can see exams in their courses"
ON exams
FOR SELECT
USING (
  auth.uid() IN (
    SELECT teacher_id FROM courses WHERE id = exams.course_id
  )
);
*/

// Verificación de permisos en API Routes
import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createServerSupabaseClient({ req, res });
  
  // Verificar autenticación
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Verificar permisos específicos
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .single();
  
  if (!userRoles || userRoles.role !== 'teacher') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Procesar la solicitud
  // ...
}
```

### Data Validation

- Validar todas las entradas de usuario tanto en frontend como en backend
- Usar Zod para validación de esquemas
- Sanitizar datos antes de mostrarlos (prevenir XSS)
- Implementar rate limiting para prevenir abusos

```typescript
// Validación con Zod
import { z } from 'zod';

const ExamSchema = z.object({
  title: z.string().min(3).max(100),
  subject: z.string().min(2).max(50),
  duration: z.number().int().positive().max(240),
  questions: z.array(
    z.object({
      text: z.string().min(5),
      type: z.enum(['multiple', 'truefalse', 'short']),
      options: z.array(z.string()).optional(),
      correctAnswer: z.union([z.number(), z.string()]),
    })
  ).min(1).max(100),
});

type Exam = z.infer<typeof ExamSchema>;

// Uso en API Route
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const examData = ExamSchema.parse(req.body);
    // Procesar datos validados
    res.status(200).json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### API Security

- Implementar CORS adecuadamente
- Usar HTTPS en todos los entornos
- Implementar rate limiting
- Validar y sanitizar todos los parámetros de entrada
- Usar tokens CSRF para formularios

```typescript
// Configuración de CORS en next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGIN },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
};

// Rate limiting con API middleware
import rateLimit from 'express-rate-limit';
import { NextApiRequest, NextApiResponse } from 'next';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana
  standardHeaders: true,
  legacyHeaders: false,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await new Promise((resolve) => {
    limiter(req, res, resolve);
  });
  
  // Resto del handler
}
```

### Sensitive Data Handling

- No almacenar datos sensibles en localStorage o sessionStorage
- Usar variables de entorno para secretos
- No exponer información sensible en logs
- Implementar políticas de retención de datos
- Encriptar datos sensibles en reposo

```typescript
// Manejo seguro de variables de entorno
// .env.local
API_KEY=your_secret_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key

// next.config.js
module.exports = {
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    // NO incluir API_KEY aquí, solo usar en el servidor
  },
};

// Uso seguro en API Routes (servidor)
export default async function handler(req, res) {
  const apiKey = process.env.API_KEY; // Accesible solo en el servidor
  // Usar apiKey para llamadas a servicios externos
}
```

## Development Workflow

### Git Workflow

- Usar GitFlow o GitHub Flow como modelo de branching
- Mantener `main` siempre deployable
- Crear branches para features, fixes y releases
- Hacer squash de commits antes de merge a main

```
main        : ----o----o----o----o----o
                    \         /    /
feature/xyz :        o--o--o-o    /
                           \     /
bugfix/abc  :              o---o
```

### Branch Naming

- `feature/nombre-descriptivo` para nuevas funcionalidades
- `bugfix/nombre-descriptivo` para correcciones
- `hotfix/nombre-descriptivo` para fixes urgentes en producción
- `release/v1.2.3` para preparación de releases
- Usar kebab-case para los nombres

```
feature/exam-creator
bugfix/question-validation
hotfix/auth-security-fix
release/v1.0.0
```

### Commit Message Format

- Seguir el formato Conventional Commits
- Estructura: `tipo(alcance): descripción`
- Tipos comunes: feat, fix, docs, style, refactor, test, chore
- Mantener la primera línea < 72 caracteres
- Usar el cuerpo del commit para explicaciones detalladas

```
feat(exam): add AI-powered question generation

Implement integration with OpenRouter.ai to generate exam questions
based on subject and topic. Includes:
- API client for OpenRouter
- Question generation form
- Preview and editing of generated questions

Closes #123
```

### PR Requirements

- Incluir descripción clara del cambio
- Referenciar issues relacionados
- Incluir screenshots o videos para cambios visuales
- Asegurar que los tests pasan
- Solicitar revisión de al menos un miembro del equipo
- Mantener PRs pequeños y enfocados

```markdown
## Descripción
Implementa la generación de preguntas de examen asistida por IA usando OpenRouter.ai.

## Cambios
- Añade cliente API para OpenRouter
- Implementa formulario de generación de preguntas
- Añade vista previa y edición de preguntas generadas
- Incluye tests para la nueva funcionalidad

## Screenshots
![Generación de preguntas](url-to-screenshot)

## Issues relacionados
Closes #123

## Checklist
- [x] Tests añadidos/actualizados
- [x] Documentación actualizada
- [x] Cumple con las guías de estilo
- [x] Revisado localmente
```

### Code Review Process

- Revisar el código en 24-48 horas
- Enfocarse en:
  - Funcionalidad
  - Seguridad
  - Performance
  - Mantenibilidad
  - Adherencia a guías de estilo
- Ser constructivo y específico en los comentarios
- Aprobar solo cuando todos los problemas estén resueltos

### CI/CD Practices

- Ejecutar linting, type checking y tests en cada PR
- Implementar despliegues automáticos a entornos de desarrollo
- Usar despliegues manuales para producción
- Implementar feature flags para funcionalidades en desarrollo
- Monitorear errores post-despliegue

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
      - name: Build
        run: npm run build
```

## Enforcement and Tools

### Linting and Formatting

#### ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    // Reglas personalizadas
    'import/order': ['error', {
      'groups': [
        ['builtin', 'external'],
        'internal',
        ['parent', 'sibling', 'index'],
      ],
      'newlines-between': 'always',
      'alphabetize': { 'order': 'asc', 'caseInsensitive': true },
    }],
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
```

#### Prettier Configuration

```javascript
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

#### TypeScript Compiler Options

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

#### Git Hooks

```json
// package.json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

```bash
# .husky/pre-push
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run type-check
npm test
```

### IDE Configuration

#### VS Code Settings

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

#### Recommended Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "streetsidesoftware.code-spell-checker",
    "naumovs.color-highlight",
    "mikestead.dotenv",
    "dsznajder.es7-react-js-snippets",
    "github.copilot",
    "eamodio.gitlens",
    "wix.vscode-import-cost"
  ]
}
```

## Best Practices

### Code Quality

1. **Principio DRY (Don't Repeat Yourself)**
   - Extraer código duplicado en funciones o componentes reutilizables
   - Crear hooks personalizados para lógica compartida
   - Utilizar componentes de UI consistentes

2. **Principio SOLID**
   - **S**ingle Responsibility: Cada componente/función debe tener una única responsabilidad
   - **O**pen/Closed: Abierto para extensión, cerrado para modificación
   - **L**iskov Substitution: Los componentes deben ser intercambiables
   - **I**nterface Segregation: Preferir interfaces pequeñas y específicas
   - **D**ependency Inversion: Depender de abstracciones, no de implementaciones

3. **Manejo de Errores**
   - Implementar error boundaries para capturar errores en componentes
   - Usar try/catch para operaciones asíncronas
   - Proporcionar mensajes de error claros y accionables
   - Implementar fallbacks y estados de error en la UI

```typescript
// Error Boundary
import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  fallback?: ReactNode;
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong. Please try again.</div>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### Performance

1. **Optimización de Imágenes**
   - Usar `next/image` para optimización automática
   - Elegir formatos adecuados (WebP, AVIF)
   - Implementar lazy loading
   - Proporcionar dimensiones correctas

2. **Optimización de Fuentes**
   - Usar `next/font` para optimización automática
   - Implementar font-display: swap
   - Limitar el número de variantes de fuentes

3. **Optimización de JavaScript**
   - Implementar code splitting
   - Minimizar dependencias de terceros
   - Usar tree shaking
   - Implementar lazy loading de componentes

### Accesibilidad

1. **Semántica HTML**
   - Usar elementos HTML semánticos (nav, main, section, etc.)
   - Implementar landmarks ARIA cuando sea necesario
   - Asegurar una estructura de encabezados lógica

2. **Interactividad**
   - Asegurar que todos los elementos interactivos sean accesibles por teclado
   - Implementar estados de focus visibles
   - Usar roles ARIA apropiados
   - Proporcionar textos alternativos para imágenes

3. **Contraste y Legibilidad**
   - Mantener ratios de contraste adecuados (WCAG AA mínimo)
   - Usar tamaños de fuente legibles
   - Evitar texto en imágenes

```typescript
// Componente de botón accesible
function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  type = 'button',
  ariaLabel,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${disabled ? 'btn-disabled' : ''}`}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
    >
      {children}
    </button>
  );
}
```

### Seguridad

1. **Prevención de XSS**
   - Sanitizar inputs de usuario
   - Evitar usar dangerouslySetInnerHTML
   - Implementar Content Security Policy (CSP)

2. **Manejo de Secretos**
   - Nunca exponer secretos en el cliente
   - Usar variables de entorno para configuración
   - Implementar rotación de secretos

3. **Protección de Datos**
   - Implementar HTTPS en todos los entornos
   - Usar cookies seguras y HttpOnly
   - Implementar políticas de CORS adecuadas

### Mantenibilidad

1. **Documentación**
   - Documentar componentes y funciones públicas
   - Mantener README actualizado
   - Documentar decisiones arquitectónicas importantes

2. **Consistencia**
   - Seguir las guías de estilo consistentemente
   - Usar patrones comunes en todo el código
   - Mantener la estructura de archivos coherente

3. **Refactorización**
   - Refactorizar código regularmente
   - Eliminar código muerto
   - Actualizar dependencias periódicamente