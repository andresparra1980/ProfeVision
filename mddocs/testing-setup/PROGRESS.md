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

- [x] `sanitize-prompt.ts` - Seguridad, detección inyección (38 tests)
- [x] `qr-code.ts` - Hash validation, formatos (18 tests)
- [x] `cleanText.ts` - Normalización texto (9 tests)
- [x] `chunkText.ts` - Chunking para LLM (11 tests)
- [x] `buildExamTex.ts` - LaTeX escaping, math preservation (32 tests)
- [x] `fisher-yates.ts` - Shuffle correctness (19 tests)
- [x] `student-name.ts` - Format detection (12 tests)

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
| Setup | 2ad1acf1 | 2026-01-14 |
| Fase 1 | 7d29d399 | 2026-01-14 |
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

### Fase 1 (Completado)
- 139 tests para utilidades puras
- sanitize-prompt: detección inyección, redacción, límites
- qr-code: generación, validación hash, formatos legacy/compact
- text processing: cleanText, chunkText con edge cases
- buildExamTex: escaping LaTeX, preservación math, opciones
- fisher-yates: shuffle determinístico, sync shuffle
- student-name: formatos combinado/separado
