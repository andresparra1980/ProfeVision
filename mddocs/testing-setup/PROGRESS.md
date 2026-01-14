# Testing Setup - Progress Tracker

## Instrucciones de Uso
- Marcar `[x]` cada item completado
- Al retomar trabajo, revisar este archivo para contexto
- Cada fase debe completarse antes de pasar a la siguiente
- **Hacer commit al finalizar cada fase**

---

## Setup Inicial
- [x] Instalar dependencias (vitest, testing-library, msw, happy-dom)
- [x] Crear `vitest.config.ts`
- [x] Crear `vitest.setup.ts` con mocks globales
- [x] Crear mock de Supabase (`__tests__/setup/mocks/supabase.ts`)
- [x] Agregar scripts a `package.json`
- [x] Agregar tasks a `turbo.json`
- [x] Verificar setup con test básico

---

## Fase 1: Utilidades Puras
> Quick wins - funciones sin dependencias externas

- [ ] `sanitize-prompt.ts` - Seguridad, detección inyección
- [ ] `qr-code.ts` - Hash validation, formatos
- [ ] `cleanText.ts` - Normalización texto
- [ ] `chunkText.ts` - Chunking para LLM
- [ ] `buildExamTex.ts` - LaTeX escaping, math preservation
- [ ] `fisher-yates.ts` - Shuffle correctness
- [ ] `student-name.ts` - Format detection

---

## Fase 2: Servicios
> Requiere mocking de Supabase/fetch

- [ ] `tier-service.ts` - Auto-downgrade, ciclos, límites
- [ ] `exam-scan-service.ts` - Job lifecycle
- [ ] `omr-client.ts` - Retry logic, backoff
- [ ] `latex-client.ts` - Integración externa

---

## Fase 3: Hooks
> Requiere context mocking

- [ ] `useTierLimits` - Feature access checks
- [ ] `useProfesor` - Profile management
- [ ] `use-exam-results` - Complex queries

---

## Fase 4: Componentes
> Mayor setup, renderizado

- [ ] UI Components (smoke tests)
- [ ] `question-analysis-card` - Cálculos estadísticos
- [ ] `students-results-table` - Filtrado, paginación
- [ ] `scan-wizard` - Multi-step flow
- [ ] `onboarding-wizard` - Form progression

---

## Coverage Actual
| Área | Target | Actual |
|------|--------|--------|
| Utilidades | 90% | 0% |
| Servicios | 80% | 0% |
| Hooks | 80% | 0% |
| Componentes | 70% | 0% |
| **Global** | **80%** | **0%** |

---

## Commits por Fase
| Fase | Commit | Fecha |
|------|--------|-------|
| Setup | dc06a268 | 2026-01-14 |
| Fase 1 | - | - |
| Fase 2 | - | - |
| Fase 3 | - | - |
| Fase 4 | - | - |

---

## Notas de Implementación
<!-- Agregar notas relevantes durante la implementación -->

### Setup (Completado)
- Vitest v4 con happy-dom
- Mocks globales para next-intl, next/navigation
- Coverage thresholds configurados al 80%
