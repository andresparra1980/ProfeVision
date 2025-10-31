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

- **Fase 0**: [ ] Preparación (0/1 tarea)
- **Fase 1**: [ ] Base de Datos (0/4 tareas)
- **Fase 2**: [ ] Backend/APIs (0/5 tareas)
- **Fase 3**: [ ] Componentes Base (0/5 tareas)
- **Fase 4**: [ ] Páginas Principales (0/4 tareas)
- **Fase 5**: [ ] Integración y Testing (0/3 tareas)

**Total**: 0/22 tareas completadas

---

## Fase 0: Preparación

### 0.1 - Crear feature branch para implementación

- [ ] Verificar estado actual del repositorio
  - [ ] Ejecutar `git status` para verificar que no hay cambios pendientes
  - [ ] Verificar que estamos en la rama `main`
  - [ ] Hacer pull de últimos cambios: `git pull origin main`
- [ ] Crear y cambiar a nueva feature branch
  - [ ] Ejecutar `git checkout -b feature/tier-system-implementation`
  - [ ] Verificar que estamos en la nueva branch: `git branch --show-current`
- [ ] Validar estado del proyecto
  - [ ] Ejecutar `yarn install` para asegurar dependencias actualizadas
  - [ ] Ejecutar `yarn build` para verificar que el proyecto compila
  - [ ] Ejecutar `yarn lint` para verificar que no hay errores de linting

**Branch**: `feature/tier-system-implementation`
**Validación**: `git branch --show-current` debe mostrar `feature/tier-system-implementation`

---

### ✅ Checkpoint Fase 0

**Validación antes de continuar:**
- [ ] Feature branch creada exitosamente
- [ ] Repositorio sin cambios pendientes
- [ ] Proyecto compila sin errores
- [ ] Linter pasa sin errores
- [ ] Listo para comenzar implementación

---

## Fase 1: Base de Datos y Migraciones

### 1.1 - Agregar campos de suscripción a tabla `profesores`

- [ ] Ejecutar migración `add_subscription_tiers_to_profesores`
  - [ ] Agregar columnas: `subscription_tier`, `subscription_status`, `subscription_cycle_start`, `polar_subscription_id`, `polar_customer_id`, `first_login_completed`
  - [ ] Marcar usuarios existentes como `grandfathered` y `first_login_completed = true`
  - [ ] Validar que migración se aplicó correctamente con `mcp__supabase__list_tables`

**Archivos afectados**: Base de datos (migración)
**Herramienta**: `mcp__supabase__apply_migration`
**Validación**: Consultar tabla `profesores` y verificar nuevas columnas

---

### 1.2 - Crear tabla `tier_limits`

- [ ] Ejecutar migración `create_tier_limits_table`
  - [ ] Crear tabla con columnas: `tier`, `ai_generations_per_month`, `scans_per_month`, `max_students`, `max_groups`, `features`
  - [ ] Insertar configuración inicial para tiers: `free`, `plus`, `admin`, `grandfathered`
  - [ ] Crear trigger `update_tier_limits_updated_at`
  - [ ] Habilitar RLS con política `tier_limits_select_all`
  - [ ] Validar datos insertados correctamente

**Archivos afectados**: Base de datos (migración)
**Herramienta**: `mcp__supabase__apply_migration`
**Validación**: Consultar tabla `tier_limits` y verificar 4 filas insertadas

---

### 1.3 - Crear tabla `usage_tracking`

- [ ] Ejecutar migración `create_usage_tracking_table`
  - [ ] Crear tabla con columnas: `id`, `profesor_id`, `month_year`, `ai_generations_used`, `scans_used`, `cycle_start_date`, `cycle_end_date`
  - [ ] Crear índices para performance
  - [ ] Crear trigger `update_usage_tracking_updated_at`
  - [ ] Habilitar RLS con políticas: `usage_tracking_select_own`, `usage_tracking_insert_own`, `usage_tracking_update_own`
  - [ ] Validar estructura de tabla

**Archivos afectados**: Base de datos (migración)
**Herramienta**: `mcp__supabase__apply_migration`
**Validación**: Verificar tabla, índices y políticas RLS

---

### 1.4 - Crear funciones SQL de gestión de tiers

- [ ] Ejecutar migración `create_tier_management_functions`
  - [ ] Crear función `calculate_cycle_dates`
  - [ ] Crear función `get_or_create_usage_tracking`
  - [ ] Crear función `check_feature_limit`
  - [ ] Crear función `increment_feature_usage`
  - [ ] Validar funciones con llamadas de prueba

**Archivos afectados**: Base de datos (migración)
**Herramienta**: `mcp__supabase__apply_migration`
**Validación**: Ejecutar `mcp__supabase__execute_sql` con llamadas de prueba a las funciones

---

### ✅ Checkpoint Fase 1

**Validación antes de continuar:**
- [ ] Todas las tablas creadas: `profesores` (modificada), `tier_limits`, `usage_tracking`
- [ ] Todas las funciones SQL operativas
- [ ] RLS habilitado en todas las tablas
- [ ] Datos de prueba insertados correctamente en `tier_limits`
- [ ] Consultar advisors de seguridad: `mcp__supabase__get_advisors` (type: security)

---

## Fase 2: Backend y APIs

### 2.1 - Crear servicio de Tiers

- [ ] Crear archivo `lib/services/tier-service.ts`
  - [ ] Implementar clase `TierService` con métodos:
    - [ ] `checkFeatureAccess(profesorId, feature)`
    - [ ] `incrementUsage(profesorId, feature)`
    - [ ] `getTierLimits(tier)`
    - [ ] `getCurrentTier(profesorId)`
    - [ ] `getUsageStats(profesorId)`
  - [ ] Agregar tipos TypeScript: `SubscriptionTier`, `Feature`, `TierLimits`, `UsageStats`
  - [ ] Validar que el servicio compila sin errores

**Archivos nuevos**: `lib/services/tier-service.ts`
**Validación**: Compilación TypeScript exitosa

---

### 2.2 - Modificar API de escaneo para validar límites

- [ ] Modificar `app/api/exams/save-results/route.ts`
  - [ ] Importar `TierService`
  - [ ] Agregar verificación de límite con `checkFeatureAccess(profesor.id, 'scan')`
  - [ ] Retornar error 403 si límite alcanzado
  - [ ] Incrementar contador con `incrementUsage(profesor.id, 'scan')`
  - [ ] Validar que no rompe funcionalidad existente

**Archivos modificados**: `app/api/exams/save-results/route.ts`
**Validación**: Probar escaneo manual con usuario Free (simular límite alcanzado)

---

### 2.3 - Modificar API de Chat IA para validar límites

- [ ] Modificar `app/api/chat/route.ts`
  - [ ] Importar `TierService`
  - [ ] Agregar verificación de límite con `checkFeatureAccess(profesor.id, 'ai_generation')`
  - [ ] Retornar error 403 si límite alcanzado
  - [ ] Incrementar contador SOLO después de generación exitosa con `incrementUsage(profesor.id, 'ai_generation')`
  - [ ] Validar que no rompe funcionalidad existente

**Archivos modificados**: `app/api/chat/route.ts`
**Validación**: Probar generación IA con usuario Free (simular límite alcanzado)

---

### 2.4 - Crear API de estadísticas de uso

- [ ] Crear archivo `app/api/tiers/usage/route.ts`
  - [ ] Implementar `GET` handler
  - [ ] Verificar autenticación con `verifyTeacherAuth`
  - [ ] Obtener estadísticas con `TierService.getUsageStats(profesor.id)`
  - [ ] Retornar JSON con estructura: `tier`, `ai_generation`, `scans`, `cycle`
  - [ ] Validar respuesta con Postman o curl

**Archivos nuevos**: `app/api/tiers/usage/route.ts`
**Validación**: Llamar API y verificar respuesta JSON

---

### 2.5 - Crear APIs de primer login

- [ ] Crear archivo `app/api/tiers/check-welcome/route.ts`
  - [ ] Implementar `GET` handler
  - [ ] Verificar si usuario debe ver modal de bienvenida
  - [ ] Retornar `{ showWelcome: boolean }`
- [ ] Crear archivo `app/api/tiers/complete-welcome/route.ts`
  - [ ] Implementar `POST` handler
  - [ ] Actualizar `first_login_completed = true`
  - [ ] Retornar `{ success: boolean }`
- [ ] Validar ambas APIs

**Archivos nuevos**: `app/api/tiers/check-welcome/route.ts`, `app/api/tiers/complete-welcome/route.ts`
**Validación**: Llamar APIs con usuario de prueba

---

### ✅ Checkpoint Fase 2

**Validación antes de continuar:**
- [ ] `TierService` funciona correctamente
- [ ] API de escaneo valida límites
- [ ] API de Chat IA valida límites
- [ ] API de estadísticas retorna datos correctos
- [ ] APIs de primer login funcionan
- [ ] Ejecutar `yarn build` sin errores

---

## Fase 3: Componentes Base de Frontend

### 3.1 - Crear hook `useTierLimits`

- [ ] Crear archivo `lib/hooks/useTierLimits.ts`
  - [ ] Implementar hook que llama a `/api/tiers/usage`
  - [ ] Estado: `usage`, `loading`, `error`
  - [ ] Métodos: `refetch`, `canUseScan`, `canUseAI`
  - [ ] Auto-refresh cada 5 minutos
  - [ ] Validar hook con componente de prueba

**Archivos nuevos**: `lib/hooks/useTierLimits.ts`
**Validación**: Crear componente temporal que use el hook

---

### 3.2 - Crear componente `TierBadge`

- [ ] Crear archivo `components/shared/tier-badge.tsx`
  - [ ] Implementar componente con prop `tier` y `size`
  - [ ] Configuración de colores e íconos para cada tier: `free`, `plus`, `admin`, `grandfathered`
  - [ ] Usar Lucide icons: `Star`, `Crown`, `Shield`, `Sparkles`
  - [ ] Validar renderizado en Storybook o página de prueba

**Archivos nuevos**: `components/shared/tier-badge.tsx`
**Validación**: Renderizar badge con cada tier

---

### 3.3 - Crear componente `UsageIndicator`

- [ ] Crear archivo `components/shared/usage-indicator.tsx`
  - [ ] Implementar componente con props: `label`, `used`, `limit`, `warningThreshold`
  - [ ] Usar `Progress` de Shadcn UI
  - [ ] Mostrar barra de progreso con colores según porcentaje
  - [ ] Manejar caso ilimitado (`limit === -1`)
  - [ ] Validar renderizado

**Archivos nuevos**: `components/shared/usage-indicator.tsx`
**Validación**: Renderizar con diferentes valores de uso

---

### 3.4 - Crear componente `LimitReachedModal`

- [ ] Crear archivo `components/shared/limit-reached-modal.tsx`
  - [ ] Implementar modal con `AlertDialog` de Shadcn UI
  - [ ] Props: `open`, `onOpenChange`, `feature`, `daysUntilReset`
  - [ ] Mostrar mensaje de límite alcanzado
  - [ ] Mostrar días hasta reseteo
  - [ ] Incluir botón "Entendido" (upgrade vendrá después)
  - [ ] Validar funcionamiento

**Archivos nuevos**: `components/shared/limit-reached-modal.tsx`
**Validación**: Abrir modal de prueba

---

### 3.5 - Crear componente `PricingCard`

- [ ] Crear archivo `components/shared/pricing-card.tsx`
  - [ ] Implementar componente con prop `tier` y `onUpgrade`
  - [ ] Mostrar nombre, precio, descripción
  - [ ] Lista de features con checkmarks
  - [ ] Badge "Recomendado" para Plus
  - [ ] Badge "Plan Actual" si `isCurrentPlan`
  - [ ] Botón de upgrade
  - [ ] Validar renderizado

**Archivos nuevos**: `components/shared/pricing-card.tsx`
**Validación**: Renderizar card de Free y Plus

---

### ✅ Checkpoint Fase 3

**Validación antes de continuar:**
- [ ] Todos los componentes base funcionan
- [ ] Hook `useTierLimits` retorna datos correctos
- [ ] Componentes se renderizan sin errores
- [ ] Ejecutar `yarn build` sin errores

---

## Fase 4: Páginas Principales

### 4.1 - Crear página de Suscripción (Dashboard)

- [ ] Reemplazar `app/[locale]/dashboard/reports/page.tsx` completamente
  - [ ] Implementar página con `useTierLimits`
  - [ ] Mostrar `TierBadge` en header
  - [ ] Mostrar warning para usuarios `grandfathered`
  - [ ] Card de "Uso Actual" con `UsageIndicator` para AI y Scans
  - [ ] Sección de Pricing con 2 `PricingCard` (Free y Plus)
  - [ ] Card de FAQ
  - [ ] Handler `handleUpgrade` con toast "Próximamente disponible"
  - [ ] Validar página en navegador
- [ ] Modificar `components/dashboard/dashboard-sidebar.tsx`
  - [ ] Cambiar título de "Reports" a "Mi Plan" / "Suscripción"
  - [ ] Cambiar ícono a `Crown`
  - [ ] Validar cambio en sidebar

**Archivos modificados**: `app/[locale]/dashboard/reports/page.tsx`, `components/dashboard/dashboard-sidebar.tsx`
**Archivos de traducciones**: `i18n/locales/es.json`, `i18n/locales/en.json` (agregar claves `subscription.*`)
**Validación**: Navegar a `/dashboard/reports` y verificar nueva página

---

### 4.2 - Crear modal de bienvenida (Primer Login)

- [ ] Crear archivo `lib/hooks/useWelcomeModal.ts`
  - [ ] Implementar hook que llama a `/api/tiers/check-welcome`
  - [ ] Estado: `showWelcome`, `setShowWelcome`, `loading`
  - [ ] Validar hook
- [ ] Crear archivo `components/shared/welcome-tier-modal.tsx`
  - [ ] Implementar modal con `Dialog` de Shadcn UI
  - [ ] Props: `open`, `onOpenChange`, `onComplete`
  - [ ] Mostrar título de bienvenida
  - [ ] Mostrar toggle mensual/anual (crear `BillingPeriodToggle`)
  - [ ] Mostrar 2 `PricingCardV2` (Free y Plus) con precios dinámicos
  - [ ] Botón "Continuar con plan Free" que llama a `/api/tiers/complete-welcome`
  - [ ] Validar modal
- [ ] Integrar en `app/[locale]/dashboard/layout.tsx`
  - [ ] Agregar `useWelcomeModal` hook
  - [ ] Renderizar `WelcomeTierModal`
  - [ ] Validar que se muestra solo en primer login

**Archivos nuevos**: `lib/hooks/useWelcomeModal.ts`, `components/shared/welcome-tier-modal.tsx`
**Archivos modificados**: `app/[locale]/dashboard/layout.tsx`
**Validación**: Crear usuario nuevo y verificar modal de bienvenida

---

### 4.3 - Crear componentes de pricing mejorados

- [ ] Crear archivo `components/shared/pricing-card-v2.tsx`
  - [ ] Versión mejorada de `PricingCard` con soporte para billing mensual/anual
  - [ ] Props: `tier`, `billingPeriod`, `onUpgrade`, `compact`
  - [ ] Mostrar precio dinámico según `billingPeriod`
  - [ ] Badge "Precio de lanzamiento"
  - [ ] Validar renderizado
- [ ] Crear archivo `components/shared/billing-period-toggle.tsx`
  - [ ] Toggle con `Switch` de Shadcn UI
  - [ ] Props: `period`, `onChange`, `className`
  - [ ] Mostrar "Mensual" y "Anual" con badge "Ahorra 17%"
  - [ ] Validar funcionamiento

**Archivos nuevos**: `components/shared/pricing-card-v2.tsx`, `components/shared/billing-period-toggle.tsx`
**Validación**: Renderizar componentes y verificar cambio de precio

---

### 4.4 - Actualizar página pública de Pricing

- [ ] Reemplazar `app/[locale]/(website)/pricing/page.tsx` completamente
  - [ ] Estado: `billingPeriod` con toggle
  - [ ] Renderizar `BillingPeriodToggle`
  - [ ] Renderizar 2 `PricingCardV2` (Free y Plus)
  - [ ] Hero section con título "Precios de Lanzamiento"
  - [ ] Botón de CTA "Comenzar Gratis"
  - [ ] Validar página pública

**Archivos modificados**: `app/[locale]/(website)/pricing/page.tsx`
**Validación**: Navegar a `/pricing` y verificar nueva página

---

### ✅ Checkpoint Fase 4

**Validación antes de continuar:**
- [ ] Página de suscripción funciona en dashboard
- [ ] Modal de bienvenida se muestra en primer login
- [ ] Página pública de pricing actualizada
- [ ] Todas las traducciones agregadas
- [ ] Ejecutar `yarn build` sin errores

---

## Fase 5: Integración y Testing

### 5.1 - Integrar validación de límites en Scan Wizard

- [ ] Modificar `components/exam/scan-wizard.tsx`
  - [ ] Agregar `useTierLimits` hook
  - [ ] Mostrar `UsageIndicator` en paso de instrucciones
  - [ ] Verificar `canUseScan` antes de permitir captura
  - [ ] Mostrar `LimitReachedModal` si no puede escanear
  - [ ] Validar flujo completo de escaneo

**Archivos modificados**: `components/exam/scan-wizard.tsx`
**Validación**: Probar escaneo con usuario Free cercano al límite

---

### 5.2 - Integrar validación de límites en AI Chat

- [ ] Modificar `app/[locale]/dashboard/exams/ai-exams-creation-chat/page.tsx`
  - [ ] Agregar `useTierLimits` hook
  - [ ] Deshabilitar botón de generar si `!canUseAI`
  - [ ] Mostrar warning cuando se acerque al límite
  - [ ] Mostrar `LimitReachedModal` si no puede generar
  - [ ] Validar flujo completo de generación IA

**Archivos modificados**: `app/[locale]/dashboard/exams/ai-exams-creation-chat/page.tsx`
**Validación**: Probar generación IA con usuario Free en límite

---

### 5.3 - Testing manual y validación final

- [ ] Testing de flujos principales
  - [ ] Registro de nuevo usuario → Ver modal de bienvenida → Continuar con Free
  - [ ] Usuario Free: Escanear 50 exámenes → Verificar límite alcanzado
  - [ ] Usuario Free: Generar 1 examen con IA → Verificar límite alcanzado
  - [ ] Usuario Grandfathered: Verificar uso ilimitado + warning temporal
  - [ ] Navegar a página "Mi Plan" → Verificar estadísticas
  - [ ] Navegar a página pública `/pricing` → Verificar precios
- [ ] Validar advisors de seguridad
  - [ ] Ejecutar `mcp__supabase__get_advisors` (type: security)
  - [ ] Ejecutar `mcp__supabase__get_advisors` (type: performance)
  - [ ] Resolver cualquier issue reportado
- [ ] Build de producción
  - [ ] Ejecutar `yarn build`
  - [ ] Verificar 0 errores TypeScript
  - [ ] Verificar 0 errores ESLint
- [ ] Git commit y documentación
  - [ ] Crear commit con todos los cambios
  - [ ] Actualizar `TIER_SYSTEM_IMPLEMENTATION_PLAN.md` con estado "Completado"

**Validación final**: Todas las funcionalidades del sistema de tiers operativas

---

## ✅ Checkpoint Final

**Lista de verificación completa:**
- [ ] Base de datos: Tablas, funciones y RLS configurados
- [ ] Backend: APIs y servicio de tiers funcionando
- [ ] Frontend: Componentes base renderizando correctamente
- [ ] Páginas: Suscripción, bienvenida y pricing operativas
- [ ] Integración: Límites aplicados en escaneo y generación IA
- [ ] Testing: Todos los flujos validados manualmente
- [ ] Advisors: Sin issues de seguridad o performance
- [ ] Build: Compilación exitosa sin errores
- [ ] Commit: Cambios guardados en Git

**Estado final**: ✅ Sistema de Tiers implementado completamente

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
