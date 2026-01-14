# Plan de Pruebas: Flujo de Onboarding

> Estrategia de testing multicapa para asegurar la robustez del flujo de bienvenida crítico.

## 1. Estrategia (3 Layers)

Validaremos el flujo completo sin depender de la base de datos real, usando mocks en cada capa.

| Capa | Objetivo | Herramientas |
|------|----------|--------------|
| **API (Backend)** | Verificar lógica de negocio, cálculo de estados y seguridad. | `vitest`, Mocks de `NextRequest`, `Supabase RPC` |
| **Hooks (State)** | Verificar sincronización cliente-servidor y manejo de sesión. | `renderHook`, Mocks de `fetch` |
| **UI (Components)** | Verificar validación de formularios y feedback visual. | `render`, `fireEvent`, `screen` |

## 2. Archivos a Implementar

### A. Backend Logic (`apps/web/__tests__/unit/api/onboarding/`)

#### 1. `status.test.ts`
Prueba el endpoint `GET /api/onboarding/status` y `PATCH`.
- **Casos de Prueba:**
  - `Legacy User`: Retorna `is_legacy_user: true` si `onboarding_status` es nulo.
  - `New User (Incomplete)`: Retorna `should_show_wizard: true` si no ha terminado.
  - `New User (Complete)`: Retorna `should_show_wizard: false` si `wizard_completed: true`.
  - `Checklist Calculation`: Verifica si todos los items requeridos están marcados.
  - `Unauthorized`: Retorna 401 si falla `verifyTeacherAuth`.

#### 2. `complete-step.test.ts`
Prueba el endpoint `POST /api/onboarding/complete-step`.
- **Casos de Prueba:**
  - `Step Advance`: Actualiza `wizard_step` correctamente.
  - `Skip Logic`: Marca `skipped: true` y cierra el wizard.
  - `Checklist Update`: Actualiza items individuales (ej. `exam_created`).
  - `Completion`: Marca `wizard_completed` al superar el último paso.

### B. Client State (`apps/web/__tests__/unit/hooks/`)

#### 1. `useOnboarding.test.tsx`
Prueba el contexto `OnboardingProvider`.
- **Casos de Prueba:**
  - `Initial Fetch`: Carga estado al montar si hay sesión.
  - `Auth Headers`: Incluye token en las peticiones.
  - `Optimistic Updates`: Actualiza estado local inmediatamente al llamar `completeWizardStep`.
  - `Error Handling`: Maneja fallos de red sin romper la UI.

### C. UI Components (`apps/web/__tests__/unit/components/`)

#### 1. `onboarding-steps.test.tsx` (NUEVO)
Prueba la lógica interna de los pasos complejos (el wizard container ya está probado).
- **InstitutionStep:**
  - Valida campo requerido (nombre).
  - Llama a `onUpdate` al escribir.
- **StudentsStep:**
  - Muestra opciones de carga (CSV/Manual).
  - Renderiza lista de estudiantes agregados.

## 3. Mocking Strategy

### Dependencias Externas
- **Auth:** `@/lib/auth/verify-teacher` -> Mockear para devolver un usuario fijo `{ id: 'teacher-123' }`.
- **Database:** `@/lib/supabase/server` -> Mockear `createClient` y respuestas de RPC.
- **Network:** `global.fetch` -> Mockear respuestas JSON de la API interna para los tests de hooks.
