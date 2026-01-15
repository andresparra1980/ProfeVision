# Plan de Testing - ProfeVision Web App

## Instrucciones para Continuar Trabajo

> **IMPORTANTE**: Al retomar este trabajo:
> 1. Leer `PROGRESS.md` para ver estado actual
> 2. Marcar `[x]` en PROGRESS.md cada item completado
> 3. Actualizar tabla de coverage en PROGRESS.md periódicamente
> 4. Agregar notas relevantes en sección "Notas de Implementación"
> 5. **Hacer commit al finalizar cada fase**

**Archivo de progreso**: `mddocs/testing-setup/PROGRESS.md`

---

## Decisiones Tomadas
- **Framework**: Vitest
- **E2E**: Postponed (enfoque en unit/integration primero)
- **Coverage Target**: 80%

## Contexto del Proyecto
- **~144 componentes**, **~87 archivos lib**, múltiples servicios críticos

---

## Stack de Testing Final

| Tipo | Framework | Razón |
|------|-----------|-------|
| Unit/Integration | **Vitest** | Rápido, ESM nativo, mejor TS |
| Components | **React Testing Library** | Testing por comportamiento |
| Mocking APIs | **MSW** | Mock a nivel red para Supabase |
| DOM | **happy-dom** | Más rápido que jsdom |

---

## Pirámide de Tests

```
        /\
       /E2E\         <- Flujos críticos (5-10 tests)
      /------\
     /Integr.\       <- Componentes con hooks/context
    /----------\
   /   Unit     \    <- Utilidades, servicios, hooks puros
  /--------------\
```

---

## Priorización por Área

### Fase 1: Utilidades Puras (Fácil, Alto Valor)
Quick wins - funciones sin dependencias externas:

1. **sanitize-prompt.ts** - Seguridad crítica, 50+ patrones
2. **qr-code.ts** - Hash validation, formatos
3. **cleanText.ts** + **chunkText.ts** - Procesamiento texto
4. **buildExamTex.ts** - LaTeX escaping, math preservation
5. **fisher-yates.ts** - Shuffle correctness
6. **student-name.ts** - Format detection

### Fase 2: Servicios (Requiere Mocking)
Lógica de negocio crítica:

1. **tier-service.ts** - Auto-downgrade, ciclos uso, límites
2. **exam-scan-service.ts** - Job lifecycle, estados
3. **omr-client.ts** - Retry logic, exponential backoff
4. **latex-client.ts** - Integración servicio externo

### Fase 3: Hooks (Requiere Context Mocking)
Estado y fetching:

1. **useTierLimits** - Feature access checks
2. **useProfesor** - Profile management
3. **use-exam-results** - Complex queries

### Fase 4: Componentes (Mayor Setup)
Renderizado y comportamiento:

1. **UI Components** - Button, Input, Select (smoke tests)
2. **Feature Components**:
   - `question-analysis-card` - Cálculos estadísticos
   - `students-results-table` - Filtrado, paginación
   - `scan-wizard` - Multi-step flow
   - `onboarding-wizard` - Form progression

---

## Estructura de Archivos Propuesta

```
apps/web/
├── vitest.config.ts
├── vitest.setup.ts
├── __tests__/
│   ├── setup/
│   │   └── mocks/
│   │       ├── supabase.ts
│   │       └── next-intl.ts
│   ├── unit/
│   │   ├── utils/
│   │   └── services/
│   └── integration/
│       ├── hooks/
│       └── components/
```

---

## Dependencias a Instalar

```bash
# Todo en un comando
pnpm --filter @profevision/web add -D \
  vitest @vitest/ui @vitest/coverage-v8 \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  happy-dom msw
```

---

## Scripts package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## Configuración Vitest Básica

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

---

## Mocking Strategy

### Supabase
```typescript
// __tests__/setup/mocks/supabase.ts
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
    storage: {
      from: vi.fn(),
    },
  },
}))
```

### next-intl
```typescript
// __tests__/setup/mocks/next-intl.ts
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'es',
}))
```

---

## Cobertura Target: 80%

| Área | Target |
|------|--------|
| Utilidades puras | 90%+ |
| Servicios | 80%+ |
| Hooks | 80%+ |
| Componentes | 70%+ |
| **Global** | **80%** |

---

## Verificación

1. `pnpm --filter @profevision/web test` - Tests pasan
2. `pnpm --filter @profevision/web test:coverage` - Coverage ≥80%

---

## Comandos Útiles

```bash
# Correr tests en watch mode
pnpm --filter @profevision/web test

# Correr tests una vez
pnpm --filter @profevision/web test:run

# Ver coverage
pnpm --filter @profevision/web test:coverage

# UI mode (visual)
pnpm --filter @profevision/web test:ui
```

---

## Archivos de Testing Creados

| Archivo | Propósito |
|---------|-----------|
| `apps/web/vitest.config.ts` | Config principal |
| `apps/web/vitest.setup.ts` | Mocks globales |
| `apps/web/__tests__/setup/mocks/supabase.ts` | Mock Supabase |
| `apps/web/__tests__/unit/` | Tests unitarios |
| `apps/web/__tests__/integration/` | Tests integración |
