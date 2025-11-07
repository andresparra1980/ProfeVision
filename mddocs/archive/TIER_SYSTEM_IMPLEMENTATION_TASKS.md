# Sistema de Tiers - Tareas de Implementación

**Fecha de Inicio**: 2025-10-30
**Estado**: En Progreso
**Plan Base**: `TIER_SYSTEM_IMPLEMENTATION_PLAN.md`

---

## Instrucciones de Uso

- Marcar con `[x]` las tareas completadas
- Ejecutar tareas en orden dentro de cada fase
- Validar checkpoints antes de avanzar a la siguiente fase
- Cada tarea debe ser un stint rápido y preciso

---

## 📊 Progreso General

- **Fase 0**: [x] Preparación (1/1 tarea)
- **Fase 1**: [x] Base de Datos (4/4 tareas)
- **Fase 2**: [x] Backend/APIs (5/5 tareas)
- **Fase 3**: [x] Componentes Base (5/5 tareas)
- **Fase 4**: [x] Páginas Principales (4/4 tareas)
- **Fase 5**: [x] Integración y Testing (3/3 tareas)

**Total**: 22/22 tareas completadas ✅

---

## Fase 0: Preparación

### 0.1 - Crear feature branch para implementación

- [x] Verificar estado actual del repositorio
  - [x] Ejecutar `git status` para verificar que no hay cambios pendientes
  - [x] Verificar que estamos en la rama `main`
  - [x] Hacer pull de últimos cambios: `git pull origin main`
- [x] Crear y cambiar a nueva feature branch
  - [x] Ejecutar `git checkout -b feature/tier-system-implementation`
  - [x] Verificar que estamos en la nueva branch: `git branch --show-current`
- [x] Validar estado del proyecto
  - [x] Ejecutar `yarn install` para asegurar dependencias actualizadas
  - [x] Ejecutar `yarn build` para verificar que el proyecto compila
  - [x] Ejecutar `yarn lint` para verificar que no hay errores de linting

**Branch**: `feature/tier-system-implementation`
**Validación**: `git branch --show-current` debe mostrar `feature/tier-system-implementation`

---

### ✅ Checkpoint Fase 0

**Validación antes de continuar:**
- [x] Feature branch creada exitosamente
- [x] Repositorio sin cambios pendientes
- [x] Proyecto compila sin errores
- [x] Linter pasa sin errores
- [x] Listo para comenzar implementación

---

## Fase 1: Base de Datos y Migraciones

### 1.1 - Agregar campos de suscripción a tabla `profesores`

- [x] Ejecutar migración `add_subscription_tiers_to_profesores`
  - [x] Agregar columnas: `subscription_tier`, `subscription_status`, `subscription_cycle_start`, `polar_subscription_id`, `polar_customer_id`, `first_login_completed`
  - [x] Marcar usuarios existentes como `grandfathered` y `first_login_completed = true`
  - [x] Validar que migración se aplicó correctamente con `mcp__supabase__list_tables`

**Archivos afectados**: Base de datos (migración)
**Herramienta**: `mcp__supabase__apply_migration`
**Validación**: Consultar tabla `profesores` y verificar nuevas columnas

---

### 1.2 - Crear tabla `tier_limits`

- [x] Ejecutar migración `create_tier_limits_table`
  - [x] Crear tabla con columnas: `tier`, `ai_generations_per_month`, `scans_per_month`, `max_students`, `max_groups`, `features`
  - [x] Insertar configuración inicial para tiers: `free`, `plus`, `admin`, `grandfathered`
  - [x] Crear trigger `update_tier_limits_updated_at`
  - [x] Habilitar RLS con política `tier_limits_select_all`
  - [x] Validar datos insertados correctamente

**Archivos afectados**: Base de datos (migración)
**Herramienta**: `mcp__supabase__apply_migration`
**Validación**: Consultar tabla `tier_limits` y verificar 4 filas insertadas

---

### 1.3 - Crear tabla `usage_tracking`

- [x] Ejecutar migración `create_usage_tracking_table`
  - [x] Crear tabla con columnas: `id`, `profesor_id`, `month_year`, `ai_generations_used`, `scans_used`, `cycle_start_date`, `cycle_end_date`
  - [x] Crear índices para performance
  - [x] Crear trigger `update_usage_tracking_updated_at`
  - [x] Habilitar RLS con políticas: `usage_tracking_select_own`, `usage_tracking_insert_own`, `usage_tracking_update_own`
  - [x] Validar estructura de tabla

**Archivos afectados**: Base de datos (migración)
**Herramienta**: `mcp__supabase__apply_migration`
**Validación**: Verificar tabla, índices y políticas RLS

---

### 1.4 - Crear funciones SQL de gestión de tiers

- [x] Ejecutar migración `create_tier_management_functions`
  - [x] Crear función `calculate_cycle_dates`
  - [x] Crear función `get_or_create_usage_tracking`
  - [x] Crear función `check_feature_limit`
  - [x] Crear función `increment_feature_usage`
  - [x] Validar funciones con llamadas de prueba

**Archivos afectados**: Base de datos (migración)
**Herramienta**: `mcp__supabase__apply_migration`
**Validación**: Ejecutar `mcp__supabase__execute_sql` con llamadas de prueba a las funciones

---

### ✅ Checkpoint Fase 1

**Validación antes de continuar:**
- [x] Todas las tablas creadas: `profesores` (modificada), `tier_limits`, `usage_tracking`
- [x] Todas las funciones SQL operativas
- [x] RLS habilitado en todas las tablas
- [x] Datos de prueba insertados correctamente en `tier_limits`
- [x] Consultar advisors de seguridad: `mcp__supabase__get_advisors` (type: security)

---

## Fase 2: Backend y APIs

### 2.1 - Crear servicio de Tiers

- [x] Crear archivo `lib/services/tier-service.ts`
  - [x] Implementar clase `TierService` con métodos:
    - [x] `checkFeatureAccess(profesorId, feature)`
    - [x] `incrementUsage(profesorId, feature)`
    - [x] `getTierLimits(tier)`
    - [x] `getCurrentTier(profesorId)`
    - [x] `getUsageStats(profesorId)`
  - [x] Agregar tipos TypeScript: `SubscriptionTier`, `Feature`, `TierLimits`, `UsageStats`
  - [x] Validar que el servicio compila sin errores

**Archivos nuevos**: `lib/services/tier-service.ts`
**Validación**: Compilación TypeScript exitosa

---

### 2.2 - Modificar API de escaneo para validar límites

- [x] Modificar `app/api/exams/save-results/route.ts`
  - [x] Importar `TierService`
  - [x] Agregar verificación de límite con `checkFeatureAccess(profesor.id, 'scan')`
  - [x] Retornar error 403 si límite alcanzado
  - [x] Incrementar contador con `incrementUsage(profesor.id, 'scan')`
  - [x] Validar que no rompe funcionalidad existente

**Archivos modificados**: `app/api/exams/save-results/route.ts`
**Validación**: Probar escaneo manual con usuario Free (simular límite alcanzado)

---

### 2.3 - Modificar API de Chat IA para validar límites

- [x] Modificar `app/api/chat/route.ts`
  - [x] Importar `TierService`
  - [x] Agregar verificación de límite con `checkFeatureAccess(profesor.id, 'ai_generation')`
  - [x] Retornar error 403 si límite alcanzado
  - [x] Incrementar contador SOLO después de generación exitosa con `incrementUsage(profesor.id, 'ai_generation')`
  - [x] Validar que no rompe funcionalidad existente

**Archivos modificados**: `app/api/chat/route.ts`
**Validación**: Probar generación IA con usuario Free (simular límite alcanzado)

---

### 2.4 - Crear API de estadísticas de uso

- [x] Crear archivo `app/api/tiers/usage/route.ts`
  - [x] Implementar `GET` handler
  - [x] Verificar autenticación con `verifyTeacherAuth`
  - [x] Obtener estadísticas con `TierService.getUsageStats(profesor.id)`
  - [x] Retornar JSON con estructura: `tier`, `ai_generation`, `scans`, `cycle`
  - [x] Validar respuesta con Postman o curl

**Archivos nuevos**: `app/api/tiers/usage/route.ts`
**Validación**: Llamar API y verificar respuesta JSON

---

### 2.5 - Crear APIs de primer login

- [x] Crear archivo `app/api/tiers/check-welcome/route.ts`
  - [x] Implementar `GET` handler
  - [x] Verificar si usuario debe ver modal de bienvenida
  - [x] Retornar `{ showWelcome: boolean }`
- [x] Crear archivo `app/api/tiers/complete-welcome/route.ts`
  - [x] Implementar `POST` handler
  - [x] Actualizar `first_login_completed = true`
  - [x] Retornar `{ success: boolean }`
- [x] Validar ambas APIs

**Archivos nuevos**: `app/api/tiers/check-welcome/route.ts`, `app/api/tiers/complete-welcome/route.ts`
**Validación**: Llamar APIs con usuario de prueba

---

### ✅ Checkpoint Fase 2

**Validación antes de continuar:**
- [x] `TierService` funciona correctamente
- [x] API de escaneo valida límites
- [x] API de Chat IA valida límites
- [x] API de estadísticas retorna datos correctos
- [x] APIs de primer login funcionan
- [x] Ejecutar `yarn build` sin errores

---

## Fase 3: Componentes Base de Frontend

### 3.1 - Crear hook `useTierLimits`

- [x] Crear archivo `lib/hooks/useTierLimits.ts`
  - [x] Implementar hook que llama a `/api/tiers/usage`
  - [x] Estado: `usage`, `loading`, `error`
  - [x] Métodos: `refetch`, `canUseScan`, `canUseAI`
  - [x] Auto-refresh cada 5 minutos
  - [x] Validar hook con componente de prueba

**Archivos nuevos**: `lib/hooks/useTierLimits.ts`
**Validación**: Crear componente temporal que use el hook

---

### 3.2 - Crear componente `TierBadge`

- [x] Crear archivo `components/shared/tier-badge.tsx`
  - [x] Implementar componente con prop `tier` y `size`
  - [x] Configuración de colores e íconos para cada tier: `free`, `plus`, `admin`, `grandfathered`
  - [x] Usar Lucide icons: `Star`, `Crown`, `Shield`, `Sparkles`
  - [x] Validar renderizado en Storybook o página de prueba

**Archivos nuevos**: `components/shared/tier-badge.tsx`
**Validación**: Renderizar badge con cada tier

---

### 3.3 - Crear componente `UsageIndicator`

- [x] Crear archivo `components/shared/usage-indicator.tsx`
  - [x] Implementar componente con props: `label`, `used`, `limit`, `warningThreshold`
  - [x] Usar `Progress` de Shadcn UI
  - [x] Mostrar barra de progreso con colores según porcentaje
  - [x] Manejar caso ilimitado (`limit === -1`)
  - [x] Validar renderizado

**Archivos nuevos**: `components/shared/usage-indicator.tsx`
**Validación**: Renderizar con diferentes valores de uso

---

### 3.4 - Crear componente `LimitReachedModal`

- [x] Crear archivo `components/shared/limit-reached-modal.tsx`
  - [x] Implementar modal con `AlertDialog` de Shadcn UI
  - [x] Props: `open`, `onOpenChange`, `feature`, `daysUntilReset`
  - [x] Mostrar mensaje de límite alcanzado
  - [x] Mostrar días hasta reseteo
  - [x] Incluir botón "Entendido" (upgrade vendrá después)
  - [x] Validar funcionamiento

**Archivos nuevos**: `components/shared/limit-reached-modal.tsx`
**Validación**: Abrir modal de prueba

---

### 3.5 - Crear componente `PricingCard`

- [x] Crear archivo `components/shared/pricing-card.tsx`
  - [x] Implementar componente con prop `tier` y `onUpgrade`
  - [x] Mostrar nombre, precio, descripción
  - [x] Lista de features con checkmarks
  - [x] Badge "Recomendado" para Plus
  - [x] Badge "Plan Actual" si `isCurrentPlan`
  - [x] Botón de upgrade
  - [x] Validar renderizado

**Archivos nuevos**: `components/shared/pricing-card.tsx`
**Validación**: Renderizar card de Free y Plus

---

### ✅ Checkpoint Fase 3

**Validación antes de continuar:**
- [x] Todos los componentes base funcionan
- [x] Hook `useTierLimits` retorna datos correctos
- [x] Componentes se renderizan sin errores
- [x] Ejecutar `yarn build` sin errores

---

## Fase 4: Páginas Principales

### 4.1 - Crear página de Suscripción (Dashboard)

- [x] Reemplazar `app/[locale]/dashboard/reports/page.tsx` completamente
  - [x] Implementar página con `useTierLimits`
  - [x] Mostrar `TierBadge` en header
  - [x] Mostrar warning para usuarios `grandfathered`
  - [x] Card de "Uso Actual" con `UsageIndicator` para AI y Scans
  - [x] Sección de Pricing con 2 `PricingCard` (Free y Plus)
  - [x] Card de FAQ
  - [x] Handler `handleUpgrade` con toast "Próximamente disponible"
  - [x] Validar página en navegador
- [x] Modificar `components/dashboard/dashboard-sidebar.tsx`
  - [x] Cambiar título de "Reports" a "Mi Plan" / "Suscripción"
  - [x] Cambiar ícono a `Crown`
  - [x] Validar cambio en sidebar

**Archivos modificados**: `app/[locale]/dashboard/reports/page.tsx`, `components/dashboard/dashboard-sidebar.tsx`
**Archivos de traducciones**: `i18n/locales/es.json`, `i18n/locales/en.json` (agregar claves `subscription.*`)
**Validación**: Navegar a `/dashboard/reports` y verificar nueva página

---

### 4.2 - Crear modal de bienvenida (Primer Login)

- [x] Crear archivo `lib/hooks/useWelcomeModal.ts`
  - [x] Implementar hook que llama a `/api/tiers/check-welcome`
  - [x] Estado: `showWelcome`, `setShowWelcome`, `loading`
  - [x] Validar hook
- [x] Crear archivo `components/shared/welcome-tier-modal.tsx`
  - [x] Implementar modal con `Dialog` de Shadcn UI
  - [x] Props: `open`, `onOpenChange`, `onComplete`
  - [x] Mostrar título de bienvenida
  - [x] Mostrar toggle mensual/anual (crear `BillingPeriodToggle`)
  - [x] Mostrar 2 `PricingCardV2` (Free y Plus) con precios dinámicos
  - [x] Botón "Continuar con plan Free" que llama a `/api/tiers/complete-welcome`
  - [x] Validar modal
- [x] Integrar en `app/[locale]/dashboard/layout.tsx`
  - [x] Agregar `useWelcomeModal` hook
  - [x] Renderizar `WelcomeTierModal`
  - [x] Validar que se muestra solo en primer login

**Archivos nuevos**: `lib/hooks/useWelcomeModal.ts`, `components/shared/welcome-tier-modal.tsx`
**Archivos modificados**: `app/[locale]/dashboard/layout.tsx`
**Validación**: Crear usuario nuevo y verificar modal de bienvenida

---

### 4.3 - Crear componentes de pricing mejorados

- [x] Crear archivo `components/shared/pricing-card-v2.tsx`
  - [x] Versión mejorada de `PricingCard` con soporte para billing mensual/anual
  - [x] Props: `tier`, `billingPeriod`, `onUpgrade`, `compact`
  - [x] Mostrar precio dinámico según `billingPeriod`
  - [x] Badge "Precio de lanzamiento"
  - [x] Validar renderizado
- [x] Crear archivo `components/shared/billing-period-toggle.tsx`
  - [x] Toggle con `Switch` de Shadcn UI
  - [x] Props: `period`, `onChange`, `className`
  - [x] Mostrar "Mensual" y "Anual" con badge "Ahorra 17%"
  - [x] Validar funcionamiento

**Archivos nuevos**: `components/shared/pricing-card-v2.tsx`, `components/shared/billing-period-toggle.tsx`
**Validación**: Renderizar componentes y verificar cambio de precio

---

### 4.4 - Actualizar página pública de Pricing

- [x] Reemplazar `app/[locale]/(website)/pricing/page.tsx` completamente
  - [x] Estado: `billingPeriod` con toggle
  - [x] Renderizar `BillingPeriodToggle`
  - [x] Renderizar 2 `PricingCardV2` (Free y Plus)
  - [x] Hero section con título "Precios de Lanzamiento"
  - [x] Botón de CTA "Comenzar Gratis"
  - [x] Validar página pública

**Archivos modificados**: `app/[locale]/(website)/pricing/page.tsx`
**Validación**: Navegar a `/pricing` y verificar nueva página

---

### ✅ Checkpoint Fase 4

**Validación antes de continuar:**
- [x] Página de suscripción funciona en dashboard
- [x] Modal de bienvenida se muestra en primer login
- [x] Página pública de pricing actualizada
- [x] Todas las traducciones agregadas
- [x] Ejecutar `yarn build` sin errores

---

## Fase 5: Integración y Testing

### 5.1 - Integrar validación de límites en Scan Wizard

- [x] Modificar `components/exam/scan-wizard.tsx`
  - [x] Agregar `useTierLimits` hook
  - [x] Mostrar `UsageIndicator` en paso de instrucciones
  - [x] Verificar `canUseScan` antes de permitir captura
  - [x] Mostrar `LimitReachedModal` si no puede escanear
  - [x] Validar flujo completo de escaneo

**Archivos modificados**: `components/exam/scan-wizard.tsx`, `components/exam/wizard-steps/instructions.tsx`
**Validación**: ✅ Integración completada, componentes funcionando correctamente

---

### 5.2 - Integrar validación de límites en AI Chat

- [x] Modificar `app/[locale]/dashboard/exams/ai-exams-creation-chat/components/ChatPanel.tsx`
  - [x] Agregar `useTierLimits` hook
  - [x] Deshabilitar botón de generar si `!canUseAI`
  - [x] Mostrar warning cuando se acerque al límite
  - [x] Mostrar `LimitReachedModal` si no puede generar
  - [x] Validar flujo completo de generación IA

**Archivos modificados**: `app/[locale]/dashboard/exams/ai-exams-creation-chat/components/ChatPanel.tsx`
**Validación**: ✅ Integración completada, validaciones funcionando correctamente

---

### 5.3 - Testing manual y validación final

- [x] Testing de flujos principales
  - [x] Registro de nuevo usuario → Ver modal de bienvenida → Continuar con Free
  - [x] Usuario Free: Escanear 50 exámenes → Verificar límite alcanzado
  - [x] Usuario Free: Generar 1 examen con IA → Verificar límite alcanzado
  - [x] Usuario Grandfathered: Verificar uso ilimitado + warning temporal
  - [x] Navegar a página "Mi Plan" → Verificar estadísticas
  - [x] Navegar a página pública `/pricing` → Verificar precios
- [x] Validar advisors de seguridad
  - [x] Ejecutar `mcp__supabase__get_advisors` (type: security)
  - [x] Sin issues críticos relacionados con el sistema de tiers
  - [x] Issues pre-existentes documentados (no bloqueantes)
- [x] Build de producción
  - [x] Ejecutar `yarn build`
  - [x] ✅ 0 errores TypeScript
  - [x] ✅ Build exitoso
- [x] Git commit y documentación
  - [x] Crear commit con todos los cambios (commit 74bdfa0)
  - [x] Actualizar `TIER_SYSTEM_IMPLEMENTATION_TASKS.md` con estado completado

**Validación final**: ✅ Todas las funcionalidades del sistema de tiers operativas

---

## ✅ Checkpoint Final

**Lista de verificación completa:**
- [x] Base de datos: Tablas, funciones y RLS configurados
- [x] Backend: APIs y servicio de tiers funcionando
- [x] Frontend: Componentes base renderizando correctamente
- [x] Páginas: Suscripción, bienvenida y pricing operativas
- [x] Integración: Límites aplicados en escaneo y generación IA
- [x] Testing: Flujos principales validados
- [x] Advisors: Sin issues críticos (issues pre-existentes documentados)
- [x] Build: Compilación exitosa sin errores (yarn build ✅)
- [x] Commit: Cambios guardados en Git (commit 74bdfa0)

**Estado final**: ✅ Sistema de Tiers implementado completamente

**Fecha de finalización**: 2025-11-04
**Commits**:
- Fase 0-4: commits anteriores
- Fase 5: commit 74bdfa0 (feat(tiers): integrar validación de límites en Scan Wizard y AI Chat)

---

## Notas de Implementación

### Consideraciones Importantes

1. **Usuarios existentes**: Automáticamente marcados como `grandfathered` al aplicar primera migración
2. **RLS**: Crítico para seguridad, validar políticas en todas las tablas
3. **Breaking changes**: Ninguno esperado, campos con DEFAULT y funcionalidad opcional
4. **Precios actuales**: $5/mes o $50/año (precio de lanzamiento)
5. **Polar.sh**: Estructura preparada pero NO implementada (webhooks pendientes)

### Dependencias entre Fases

- **Fase 2 depende de Fase 1**: Backend necesita tablas y funciones
- **Fase 3 depende de Fase 2**: Componentes necesitan APIs
- **Fase 4 depende de Fase 3**: Páginas usan componentes base
- **Fase 5 depende de Fases 1-4**: Integración y testing finales

### Rollback en caso de error

Si alguna migración falla, revertir con:
```sql
-- Revertir 1.1
ALTER TABLE public.profesores
DROP COLUMN IF EXISTS subscription_tier,
DROP COLUMN IF EXISTS subscription_status,
DROP COLUMN IF EXISTS subscription_cycle_start,
DROP COLUMN IF EXISTS polar_subscription_id,
DROP COLUMN IF EXISTS polar_customer_id,
DROP COLUMN IF EXISTS first_login_completed;

-- Revertir 1.2
DROP TABLE IF EXISTS public.tier_limits CASCADE;

-- Revertir 1.3
DROP TABLE IF EXISTS public.usage_tracking CASCADE;

-- Revertir 1.4
DROP FUNCTION IF EXISTS calculate_cycle_dates;
DROP FUNCTION IF EXISTS get_or_create_usage_tracking;
DROP FUNCTION IF EXISTS check_feature_limit;
DROP FUNCTION IF EXISTS increment_feature_usage;
```

---

**Archivo creado**: 2025-10-30
**Última actualización**: 2025-10-30
**Versión**: 1.0.0
