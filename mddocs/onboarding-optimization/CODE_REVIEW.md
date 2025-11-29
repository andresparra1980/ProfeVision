# Code Review: feature/optimized-onboarding-nov25

**Fecha**: 2025-11-28
**Reviewer**: Claude Code
**Branch**: `feature/optimized-onboarding-nov25`
**Base**: `main`

---

## Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| Commits | ~50 |
| Archivos modificados | 68 |
| Líneas añadidas | +6,288 |
| Líneas eliminadas | -826 |
| Severidad máxima encontrada | **BAJO** |

**Veredicto: ✅ APROBADO PARA MERGE**

---

## Scope del Feature

### Componentes Principales
1. **Wizard de Onboarding** - Modal de 6 pasos para nuevos usuarios
2. **Checklist de Progreso** - Widget flotante con 4 items de seguimiento
3. **Context Global** - `OnboardingProvider` con hooks especializados
4. **API Endpoints** - GET/PATCH status, POST complete-step
5. **RPC Function** - `update_onboarding_status` (SECURITY DEFINER)

### Archivos Críticos Revisados

| Archivo | Líneas | Estado |
|---------|--------|--------|
| `app/api/onboarding/status/route.ts` | 123 | ✅ OK |
| `app/api/onboarding/complete-step/route.ts` | 101 | ✅ OK |
| `lib/contexts/onboarding-context.tsx` | 304 | ✅ OK |
| `components/onboarding/onboarding-wizard.tsx` | 229 | ✅ OK |
| `components/onboarding/onboarding-checklist.tsx` | 504 | ✅ OK |
| `components/onboarding/exam-creation-drawer.tsx` | 144 | ✅ OK |
| `components/students/excel-import.tsx` | 590 | ✅ OK |
| `app/api/exams/save-results/route.ts` | 1064 | ✅ OK |

---

## Hallazgos de Seguridad

### ✅ Sin Issues Críticos

| Check | Resultado |
|-------|-----------|
| Auth en todos los endpoints | ✅ `verifyTeacherAuth` usado |
| Validación de ownership | ✅ `save-results` valida `profesor_id` |
| RLS bypass controlado | ✅ RPCs con SECURITY DEFINER apropiados |
| Input validation | ✅ Tipos TypeScript + validación runtime |
| Legacy user protection | ✅ Skip DB writes para evitar corrupción |

### RPC `update_onboarding_status`

```sql
CREATE OR REPLACE FUNCTION public.update_onboarding_status(
  p_user_id uuid, 
  p_status_json jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER  -- ✅ Correcto
```

**Lógica verificada:**
- Deep merge de `checklist_items` (preserva valores existentes)
- Actualiza `updated_at` automáticamente
- Retorna el status completo

---

## Hallazgos por Severidad

### 🟡 BAJO (Mejoras Opcionales)

#### 1. Condición de legacy user difícil de leer
**Ubicación**: `app/api/onboarding/status/route.ts:43-44`

```typescript
// Actual
const isLegacyUser = onboardingStatus === null || 
  (!onboardingStatus?.wizard_completed && !onboardingStatus?.wizard_step && onboardingStatus?.wizard_step !== 0);

// Sugerido (más claro)
const isLegacyUser = onboardingStatus === null || 
  (onboardingStatus?.wizard_step === undefined && !onboardingStatus?.wizard_completed);
```

#### 2. PDF cache sin límite de tamaño
**Ubicación**: `components/exam/pdf-generator.tsx`

```typescript
const pdfCache = new Map<string, string>();
// Potencial memory leak en uso prolongado

// Sugerido: agregar límite
const MAX_CACHE_SIZE = 10;
if (pdfCache.size >= MAX_CACHE_SIZE) {
  const firstKey = pdfCache.keys().next().value;
  pdfCache.delete(firstKey);
}
```

#### 3. Log level de import
**Ubicación**: `components/students/excel-import.tsx`

Los `logger.log('[IMPORT] ...')` deberían ser `logger.debug` en producción.

---

## Código Bien Estructurado

### 1. Onboarding Context
- ✅ `hasFetched` previene re-fetches innecesarios
- ✅ Auth listener con cleanup correcto
- ✅ Hooks especializados (`useOnboardingStep`, `useChecklistItem`)

### 2. Checklist Component
- ✅ Refs para prevenir checks concurrentes (`isCheckingRef`)
- ✅ Dismiss inteligente (localStorage solo si steps 1-3 complete)
- ✅ Responsive (desktop sidebar vs mobile bottom)
- ✅ FAB-aware positioning

### 3. iOS Safari Bug Fix
**Ubicación**: `components/ui/alert-dialog.tsx:18-24`

```typescript
// Fix iOS Safari: remove pointer-events from body when dialog closes
if (!open) {
  setTimeout(() => {
    document.body.style.removeProperty('pointer-events');
  }, 0);
}
```
Workaround correcto para bug conocido de Radix.

### 4. Student Name Utilities
**Ubicación**: `lib/utils/student-name.ts`

Abstracción limpia para manejar:
- Nombres separados (`nombres` + `apellidos`)
- Nombres combinados (solo `apellidos`)

---

## Verificaciones de Base de Datos

### Columna `onboarding_status` en `profesores`
```
✅ Existe en producción
✅ Tipo: JSONB
✅ Nullable: YES (correcto para legacy users)
✅ Default: NULL
```

### Estructura del JSON
```json
{
  "wizard_completed": boolean,
  "wizard_step": number,
  "wizard_started_at": timestamp,
  "wizard_completed_at": timestamp,
  "checklist_items": {
    "exam_created": boolean,
    "exam_published": boolean,
    "pdf_exported": boolean,
    "first_scan": boolean
  },
  "skipped": boolean,
  "skip_reason": string
}
```

### Funciones RPC Relacionadas
| Función | Security | Verificado |
|---------|----------|------------|
| `update_onboarding_status` | DEFINER | ✅ |
| `crear_estudiante_en_grupo` | DEFINER | ✅ |
| `crear_relacion_profesor_entidad` | DEFINER | ✅ |

---

## Performance

### ✅ Sin Issues Críticos

| Aspecto | Estado |
|---------|--------|
| Re-renders innecesarios | ✅ Controlados con `useCallback` |
| API calls duplicados | ✅ `hasFetched` flag previene |
| Supabase queries | ✅ Selectivas con `count: 'exact', head: true` |

### Observación
El checklist hace 3 queries paralelas en `checkProgress()`:
1. Count de exámenes creados
2. Count de exámenes publicados  
3. Count de resultados (scans)

Esto es aceptable dado que son queries livianas con `head: true`.

---

## i18n

### Archivos de traducción añadidos
- `i18n/locales/en/onboarding.json` (169 líneas)
- `i18n/locales/es/onboarding.json` (169 líneas)

### ✅ Verificado
- Todas las strings del wizard están traducidas
- Checklist items tienen título + descripción
- Excel import usa traducciones dinámicas

---

## Tests E2E

Según lo indicado por el usuario, los tests E2E pasan correctamente.

---

## Conclusión

### Aprobado para Merge

El feature está bien implementado con:
- ✅ Arquitectura limpia (context + hooks + componentes)
- ✅ Seguridad correcta (auth, RLS, ownership validation)
- ✅ UX responsive (desktop + mobile)
- ✅ i18n completo (EN + ES)
- ✅ Legacy user handling (no breaking changes)

### Mejoras Sugeridas (Post-merge)
1. Simplificar condición `isLegacyUser`
2. Agregar límite al PDF cache
3. Cambiar log level de imports a debug

---

**Firmado**: Claude Code  
**Fecha**: 2025-11-28
