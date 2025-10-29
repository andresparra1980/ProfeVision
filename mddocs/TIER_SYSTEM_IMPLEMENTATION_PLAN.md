# Plan de Implementación: Sistema de Tiers y Permisos

**Fecha**: 2025-10-29
**Estado**: Pendiente de implementación
**Prioridad**: Alta
**Estimación**: 7-9 horas de desarrollo (+1 hora por página de suscripción)

---

## Resumen Ejecutivo

Implementar un sistema de permisos por tiers (FREE, PLUS, ADMIN, GRANDFATHERED) para controlar el acceso a funcionalidades premium de ProfeVision, específicamente:

- **Escaneos de exámenes**: Límite de 50/mes para FREE
- **Generación IA de exámenes**: Límite de 1/mes para FREE
- **Reseteo mensual**: Basado en fecha de registro individual de cada usuario
- **Usuarios existentes**: Grandfathered (sin restricciones, beneficio temporal)
- **Página de Suscripción**: Reemplazar página de Reportes por "Mi Plan" con pricing cards
- **Integración futura**: Preparar estructura para Polar.sh sin implementar

---

## Configuración de Tiers

| Tier | Escaneos/mes | Gen. IA/mes | Límites adicionales | Pago |
|------|-------------|-------------|---------------------|------|
| **FREE** | 50 | 1 | Básicos | No |
| **PLUS** | 500 | 100 | Razonables | Sí |
| **ADMIN** | Ilimitado | Ilimitado | Ninguno | No |
| **GRANDFATHERED** | Ilimitado | Ilimitado | Ninguno | No |

**Nota sobre GRANDFATHERED**:
- Todos los usuarios registrados ANTES de implementar el sistema de tiers
- Beneficio **temporal** para early adopters
- Se les advertirá que en cualquier momento pueden pasar a FREE tier
- **No mostrar badge "Grandfathered"** a usuarios que no tienen ese tier

---

## IMPORTANTE: Metodología de Implementación

### ⚠️ Uso de MCP Supabase

**NO usar migraciones SQL clásicas con Supabase CLI**. Este proyecto usa:

1. **MCP Supabase** (`mcp__supabase__apply_migration`) para crear tablas y funciones
2. **Web UI de Supabase** para cambios manuales cuando sea necesario

### ⚠️ Row-Level Security (RLS)

**CRÍTICO**: Aplicar RLS en TODAS las nuevas tablas porque:
- El frontend se conecta directamente a la base de datos vía Supabase client
- Sin RLS, cualquier usuario podría modificar datos de otros usuarios
- Todas las tablas existentes tienen RLS habilitado (ver `DATABASE_SCHEMA.md`)

### ⚠️ Breaking Changes

**SIEMPRE validar** si los cambios propuestos:
- Rompen funcionalidad existente
- Requieren migración de datos
- Afectan APIs en uso
- Cambian comportamiento esperado

**Antes de implementar, PREGUNTAR al usuario** si hay dudas sobre breaking changes.

### 📚 Schema de Referencia

El schema actualizado de la base de datos está documentado en:
**`mddocs/DATABASE_SCHEMA.md`**

Consultar este archivo antes de modificar la estructura de datos.

---

## Fase 1: Base de Datos (MCP Supabase)

### 1.1 Agregar campos a tabla `profesores`

**Herramienta**: `mcp__supabase__apply_migration`

```sql
-- Migración: add_subscription_tiers_to_profesores
-- Descripción: Agrega campos de suscripción a la tabla profesores

ALTER TABLE public.profesores
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free'
  CHECK (subscription_tier IN ('free', 'plus', 'admin', 'grandfathered')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active'
  CHECK (subscription_status IN ('active', 'cancelled', 'expired')),
ADD COLUMN IF NOT EXISTS subscription_cycle_start TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS polar_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS polar_customer_id TEXT;

-- Marcar usuarios existentes como grandfathered
UPDATE public.profesores
SET subscription_tier = 'grandfathered'
WHERE created_at < now();

COMMENT ON COLUMN public.profesores.subscription_tier IS
  'Tier de suscripción: free, plus, admin, grandfathered';
COMMENT ON COLUMN public.profesores.subscription_status IS
  'Estado: active, cancelled, expired';
COMMENT ON COLUMN public.profesores.subscription_cycle_start IS
  'Fecha de inicio del ciclo mensual de facturación/límites';
COMMENT ON COLUMN public.profesores.polar_subscription_id IS
  'ID de suscripción en Polar.sh (para futura integración)';
COMMENT ON COLUMN public.profesores.polar_customer_id IS
  'ID de cliente en Polar.sh (para futura integración)';
```

**Validaciones**:
- ✅ No es breaking change: campos con DEFAULT
- ✅ Usuarios existentes automáticamente marcados como grandfathered
- ✅ Preparado para Polar.sh sin implementar integración

**RLS**: No requiere cambios (tabla ya tiene RLS habilitado)

---

### 1.2 Crear tabla `tier_limits`

**Herramienta**: `mcp__supabase__apply_migration`

```sql
-- Migración: create_tier_limits_table
-- Descripción: Configuración de límites por tier

CREATE TABLE IF NOT EXISTS public.tier_limits (
  tier TEXT PRIMARY KEY CHECK (tier IN ('free', 'plus', 'admin', 'grandfathered')),
  ai_generations_per_month INTEGER NOT NULL,
  scans_per_month INTEGER NOT NULL,
  max_students INTEGER,
  max_groups INTEGER,
  features JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar configuración inicial
INSERT INTO public.tier_limits (tier, ai_generations_per_month, scans_per_month, max_students, max_groups, features)
VALUES
  ('free', 1, 50, NULL, NULL, '{"can_export_pdf": true, "can_import_excel": true}'::jsonb),
  ('plus', 100, 500, NULL, NULL, '{"can_export_pdf": true, "can_import_excel": true, "priority_support": true}'::jsonb),
  ('admin', -1, -1, NULL, NULL, '{"unlimited": true}'::jsonb),
  ('grandfathered', -1, -1, NULL, NULL, '{"unlimited": true, "early_adopter": true}'::jsonb)
ON CONFLICT (tier) DO NOTHING;

COMMENT ON TABLE public.tier_limits IS
  'Configuración de límites por tier. -1 significa ilimitado';
COMMENT ON COLUMN public.tier_limits.ai_generations_per_month IS
  'Número de generaciones IA por mes. -1 = ilimitado';
COMMENT ON COLUMN public.tier_limits.scans_per_month IS
  'Número de escaneos por mes. -1 = ilimitado';
COMMENT ON COLUMN public.tier_limits.features IS
  'Características adicionales en formato JSON';

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_tier_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tier_limits_updated_at
BEFORE UPDATE ON public.tier_limits
FOR EACH ROW
EXECUTE FUNCTION update_tier_limits_updated_at();
```

**RLS**: Habilitar políticas de solo lectura para todos

```sql
-- RLS para tier_limits
ALTER TABLE public.tier_limits ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer (necesario para verificar límites en el cliente)
CREATE POLICY "tier_limits_select_all"
ON public.tier_limits
FOR SELECT
USING (true);

-- Solo admins pueden modificar (usar service_role desde backend)
-- No crear política de INSERT/UPDATE/DELETE para usuarios normales
```

---

### 1.3 Crear tabla `usage_tracking`

**Herramienta**: `mcp__supabase__apply_migration`

```sql
-- Migración: create_usage_tracking_table
-- Descripción: Tracking mensual de uso por profesor

CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesor_id UUID NOT NULL REFERENCES public.profesores(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Formato: YYYY-MM
  ai_generations_used INTEGER DEFAULT 0,
  scans_used INTEGER DEFAULT 0,
  cycle_start_date TIMESTAMPTZ NOT NULL,
  cycle_end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(profesor_id, month_year)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_usage_tracking_profesor_id
  ON public.usage_tracking(profesor_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_month_year
  ON public.usage_tracking(month_year);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_cycle_dates
  ON public.usage_tracking(cycle_start_date, cycle_end_date);

COMMENT ON TABLE public.usage_tracking IS
  'Tracking mensual de uso de features limitadas por tier';
COMMENT ON COLUMN public.usage_tracking.month_year IS
  'Formato YYYY-MM. Basado en el ciclo personal del profesor, no el mes calendario';
COMMENT ON COLUMN public.usage_tracking.cycle_start_date IS
  'Fecha de inicio del ciclo mensual (ej: si se registró el 15, ciclo inicia día 15)';

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_usage_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER usage_tracking_updated_at
BEFORE UPDATE ON public.usage_tracking
FOR EACH ROW
EXECUTE FUNCTION update_usage_tracking_updated_at();
```

**RLS**: Solo el profesor puede ver/modificar su propio uso

```sql
-- RLS para usage_tracking
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Política: Profesores solo ven su propio usage
CREATE POLICY "usage_tracking_select_own"
ON public.usage_tracking
FOR SELECT
USING (profesor_id = auth.uid());

-- Política: Profesores pueden insertar su propio usage
CREATE POLICY "usage_tracking_insert_own"
ON public.usage_tracking
FOR INSERT
WITH CHECK (profesor_id = auth.uid());

-- Política: Profesores pueden actualizar su propio usage
CREATE POLICY "usage_tracking_update_own"
ON public.usage_tracking
FOR UPDATE
USING (profesor_id = auth.uid())
WITH CHECK (profesor_id = auth.uid());
```

---

### 1.4 Funciones SQL

**Herramienta**: `mcp__supabase__apply_migration`

```sql
-- Migración: create_tier_management_functions
-- Descripción: Funciones para gestión de tiers y límites

-- ============================================
-- FUNCIÓN: calculate_cycle_dates
-- Calcula inicio y fin del ciclo mensual basado en fecha de registro
-- ============================================
CREATE OR REPLACE FUNCTION calculate_cycle_dates(
  p_registration_date TIMESTAMPTZ,
  p_reference_date TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE(
  cycle_start TIMESTAMPTZ,
  cycle_end TIMESTAMPTZ,
  month_year TEXT
) AS $$
DECLARE
  v_day_of_month INTEGER;
  v_current_cycle_start TIMESTAMPTZ;
  v_current_cycle_end TIMESTAMPTZ;
BEGIN
  -- Obtener día del mes de registro (1-31)
  v_day_of_month := EXTRACT(DAY FROM p_registration_date);

  -- Calcular inicio del ciclo actual
  -- Si estamos después del día de ciclo, el ciclo inició este mes
  -- Si estamos antes, el ciclo inició el mes pasado
  IF EXTRACT(DAY FROM p_reference_date) >= v_day_of_month THEN
    v_current_cycle_start := date_trunc('month', p_reference_date) + (v_day_of_month - 1) * INTERVAL '1 day';
  ELSE
    v_current_cycle_start := date_trunc('month', p_reference_date - INTERVAL '1 month') + (v_day_of_month - 1) * INTERVAL '1 day';
  END IF;

  -- Fin del ciclo: 1 mes después, 1 segundo antes del siguiente ciclo
  v_current_cycle_end := v_current_cycle_start + INTERVAL '1 month' - INTERVAL '1 second';

  RETURN QUERY SELECT
    v_current_cycle_start,
    v_current_cycle_end,
    to_char(v_current_cycle_start, 'YYYY-MM');
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_cycle_dates IS
  'Calcula el inicio y fin del ciclo mensual basado en la fecha de registro del profesor';

-- ============================================
-- FUNCIÓN: get_or_create_usage_tracking
-- Obtiene o crea el registro de tracking para el ciclo actual
-- ============================================
CREATE OR REPLACE FUNCTION get_or_create_usage_tracking(
  p_profesor_id UUID
)
RETURNS TABLE(
  id UUID,
  ai_generations_used INTEGER,
  scans_used INTEGER,
  cycle_start_date TIMESTAMPTZ,
  cycle_end_date TIMESTAMPTZ
) AS $$
DECLARE
  v_registration_date TIMESTAMPTZ;
  v_cycle_start TIMESTAMPTZ;
  v_cycle_end TIMESTAMPTZ;
  v_month_year TEXT;
  v_usage_record RECORD;
BEGIN
  -- Obtener fecha de registro del profesor
  SELECT subscription_cycle_start INTO v_registration_date
  FROM public.profesores
  WHERE profesores.id = p_profesor_id;

  IF v_registration_date IS NULL THEN
    RAISE EXCEPTION 'Profesor no encontrado o sin fecha de ciclo';
  END IF;

  -- Calcular fechas del ciclo actual
  SELECT * INTO v_cycle_start, v_cycle_end, v_month_year
  FROM calculate_cycle_dates(v_registration_date);

  -- Buscar registro existente
  SELECT * INTO v_usage_record
  FROM public.usage_tracking
  WHERE usage_tracking.profesor_id = p_profesor_id
    AND usage_tracking.month_year = v_month_year;

  -- Si no existe, crear
  IF v_usage_record IS NULL THEN
    INSERT INTO public.usage_tracking (
      profesor_id,
      month_year,
      ai_generations_used,
      scans_used,
      cycle_start_date,
      cycle_end_date
    ) VALUES (
      p_profesor_id,
      v_month_year,
      0,
      0,
      v_cycle_start,
      v_cycle_end
    )
    RETURNING * INTO v_usage_record;
  END IF;

  -- Retornar registro
  RETURN QUERY SELECT
    v_usage_record.id,
    v_usage_record.ai_generations_used,
    v_usage_record.scans_used,
    v_usage_record.cycle_start_date,
    v_usage_record.cycle_end_date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_or_create_usage_tracking IS
  'Obtiene o crea el registro de tracking para el ciclo mensual actual del profesor';

-- ============================================
-- FUNCIÓN: check_feature_limit
-- Verifica si el profesor puede usar una feature
-- ============================================
CREATE OR REPLACE FUNCTION check_feature_limit(
  p_profesor_id UUID,
  p_feature TEXT -- 'ai_generation' o 'scan'
)
RETURNS TABLE(
  can_use BOOLEAN,
  current_usage INTEGER,
  limit_value INTEGER,
  tier TEXT,
  days_until_reset INTEGER
) AS $$
DECLARE
  v_tier TEXT;
  v_limit INTEGER;
  v_usage INTEGER;
  v_usage_tracking RECORD;
BEGIN
  -- Obtener tier del profesor
  SELECT subscription_tier INTO v_tier
  FROM public.profesores
  WHERE id = p_profesor_id;

  IF v_tier IS NULL THEN
    RAISE EXCEPTION 'Profesor no encontrado';
  END IF;

  -- Si es tier ilimitado, permitir siempre
  IF v_tier IN ('admin', 'grandfathered', 'plus') THEN
    -- Obtener límite para mostrar (aunque no se aplique estrictamente para plus)
    SELECT
      CASE
        WHEN p_feature = 'ai_generation' THEN ai_generations_per_month
        WHEN p_feature = 'scan' THEN scans_per_month
      END INTO v_limit
    FROM public.tier_limits
    WHERE tier = v_tier;

    -- Para tiers ilimitados o -1, siempre permitir
    IF v_limit = -1 OR v_tier IN ('admin', 'grandfathered') THEN
      RETURN QUERY SELECT true, 0, -1, v_tier, 0;
      RETURN;
    END IF;
  END IF;

  -- Obtener o crear tracking del ciclo actual
  SELECT * INTO v_usage_tracking
  FROM get_or_create_usage_tracking(p_profesor_id);

  -- Obtener límite para el tier
  SELECT
    CASE
      WHEN p_feature = 'ai_generation' THEN ai_generations_per_month
      WHEN p_feature = 'scan' THEN scans_per_month
    END INTO v_limit
  FROM public.tier_limits
  WHERE tier = v_tier;

  -- Obtener uso actual
  v_usage := CASE
    WHEN p_feature = 'ai_generation' THEN v_usage_tracking.ai_generations_used
    WHEN p_feature = 'scan' THEN v_usage_tracking.scans_used
  END;

  -- Verificar si puede usar
  RETURN QUERY SELECT
    (v_usage < v_limit OR v_limit = -1),
    v_usage,
    v_limit,
    v_tier,
    EXTRACT(DAY FROM v_usage_tracking.cycle_end_date - now())::INTEGER;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_feature_limit IS
  'Verifica si el profesor puede usar una feature limitada por tier';

-- ============================================
-- FUNCIÓN: increment_feature_usage
-- Incrementa el contador de uso de una feature
-- ============================================
CREATE OR REPLACE FUNCTION increment_feature_usage(
  p_profesor_id UUID,
  p_feature TEXT -- 'ai_generation' o 'scan'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_usage_tracking RECORD;
  v_can_use BOOLEAN;
BEGIN
  -- Verificar si puede usar
  SELECT check_feature_limit.can_use INTO v_can_use
  FROM check_feature_limit(p_profesor_id, p_feature);

  IF NOT v_can_use THEN
    RETURN false;
  END IF;

  -- Obtener o crear tracking
  SELECT * INTO v_usage_tracking
  FROM get_or_create_usage_tracking(p_profesor_id);

  -- Incrementar contador
  IF p_feature = 'ai_generation' THEN
    UPDATE public.usage_tracking
    SET ai_generations_used = ai_generations_used + 1
    WHERE id = v_usage_tracking.id;
  ELSIF p_feature = 'scan' THEN
    UPDATE public.usage_tracking
    SET scans_used = scans_used + 1
    WHERE id = v_usage_tracking.id;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_feature_usage IS
  'Incrementa el contador de uso de una feature. Retorna false si excede límite';
```

**RLS**: Las funciones se ejecutan con permisos del usuario llamante (SECURITY INVOKER por defecto).

---

## Fase 2: Backend (APIs y Lógica)

### 2.1 Servicio de Tiers

**Archivo nuevo**: `lib/services/tier-service.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/types/database'

type SubscriptionTier = 'free' | 'plus' | 'admin' | 'grandfathered'
type Feature = 'ai_generation' | 'scan'

interface TierLimits {
  tier: SubscriptionTier
  ai_generations_per_month: number
  scans_per_month: number
  max_students: number | null
  max_groups: number | null
  features: Record<string, any>
}

interface UsageStats {
  can_use: boolean
  current_usage: number
  limit_value: number
  tier: SubscriptionTier
  days_until_reset: number
}

export class TierService {
  /**
   * Verifica si un profesor puede usar una feature
   */
  static async checkFeatureAccess(
    profesorId: string,
    feature: Feature
  ): Promise<UsageStats> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .rpc('check_feature_limit', {
        p_profesor_id: profesorId,
        p_feature: feature,
      })
      .single()

    if (error) throw error
    return data
  }

  /**
   * Incrementa el uso de una feature
   * Retorna false si excede el límite
   */
  static async incrementUsage(
    profesorId: string,
    feature: Feature
  ): Promise<boolean> {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('increment_feature_usage', {
      p_profesor_id: profesorId,
      p_feature: feature,
    })

    if (error) throw error
    return data
  }

  /**
   * Obtiene los límites de un tier
   */
  static async getTierLimits(tier: SubscriptionTier): Promise<TierLimits> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('tier_limits')
      .select('*')
      .eq('tier', tier)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Obtiene el tier del profesor actual
   */
  static async getCurrentTier(profesorId: string): Promise<SubscriptionTier> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('profesores')
      .select('subscription_tier')
      .eq('id', profesorId)
      .single()

    if (error) throw error
    return data.subscription_tier as SubscriptionTier
  }

  /**
   * Obtiene estadísticas de uso completas
   */
  static async getUsageStats(profesorId: string) {
    const [aiStats, scanStats, tier] = await Promise.all([
      this.checkFeatureAccess(profesorId, 'ai_generation'),
      this.checkFeatureAccess(profesorId, 'scan'),
      this.getCurrentTier(profesorId),
    ])

    return {
      tier,
      ai: aiStats,
      scans: scanStats,
    }
  }
}
```

---

### 2.2 Modificar API de Escaneo

**Archivo**: `app/api/exams/save-results/route.ts`

**Cambios**:
1. Importar `TierService`
2. Verificar límite antes de guardar
3. Incrementar contador si OK
4. Retornar error 403 si excede límite

```typescript
// Agregar al inicio del POST handler (después de autenticación)
import { TierService } from '@/lib/services/tier-service'

// ... código de autenticación existente ...

// NUEVO: Verificar límite de escaneos
try {
  const canScan = await TierService.checkFeatureAccess(
    profesor.id,
    'scan'
  )

  if (!canScan.can_use) {
    return NextResponse.json(
      {
        error: 'SCAN_LIMIT_REACHED',
        message: 'Has alcanzado el límite de escaneos para tu tier',
        details: {
          current_usage: canScan.current_usage,
          limit: canScan.limit_value,
          tier: canScan.tier,
          days_until_reset: canScan.days_until_reset,
        },
      },
      { status: 403 }
    )
  }

  // Incrementar contador de uso
  const incremented = await TierService.incrementUsage(profesor.id, 'scan')
  if (!incremented) {
    return NextResponse.json(
      { error: 'Failed to increment usage counter' },
      { status: 500 }
    )
  }
} catch (error) {
  console.error('Error checking tier limits:', error)
  // Continuar sin bloquear (fail open) en caso de error del sistema
}

// ... resto del código existente ...
```

---

### 2.3 Modificar API de Chat IA

**Archivo**: `app/api/chat/route.ts`

**Cambios similares**:

```typescript
// Después de verifyTeacherAuth()
import { TierService } from '@/lib/services/tier-service'

// NUEVO: Verificar límite de generaciones IA
try {
  const canGenerate = await TierService.checkFeatureAccess(
    profesor.id,
    'ai_generation'
  )

  if (!canGenerate.can_use) {
    return NextResponse.json(
      {
        error: 'AI_GENERATION_LIMIT_REACHED',
        message: 'Has alcanzado el límite de generaciones IA para tu tier',
        details: {
          current_usage: canGenerate.current_usage,
          limit: canGenerate.limit_value,
          tier: canGenerate.tier,
          days_until_reset: canGenerate.days_until_reset,
        },
      },
      { status: 403 }
    )
  }

  // Incrementar contador SOLO si la generación es exitosa
  // (mover esto al final del handler, después de la respuesta exitosa)

} catch (error) {
  console.error('Error checking tier limits:', error)
  // Continuar sin bloquear
}

// ... resto del código ...

// AL FINAL, después de generar exitosamente el examen:
try {
  await TierService.incrementUsage(profesor.id, 'ai_generation')
} catch (error) {
  console.error('Error incrementing AI usage:', error)
  // No bloquear si falla el incremento
}
```

---

### 2.4 Nueva API: Obtener estadísticas de uso

**Archivo nuevo**: `app/api/tiers/usage/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyTeacherAuth } from '@/lib/auth/verify-teacher'
import { TierService } from '@/lib/services/tier-service'

export async function GET(request: NextRequest) {
  try {
    // Autenticación
    const { profesor } = await verifyTeacherAuth(request)
    if (!profesor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Obtener estadísticas
    const stats = await TierService.getUsageStats(profesor.id)

    return NextResponse.json({
      tier: stats.tier,
      ai_generation: {
        used: stats.ai.current_usage,
        limit: stats.ai.limit_value,
        remaining: stats.ai.limit_value === -1
          ? -1
          : stats.ai.limit_value - stats.ai.current_usage,
        can_use: stats.ai.can_use,
      },
      scans: {
        used: stats.scans.current_usage,
        limit: stats.scans.limit_value,
        remaining: stats.scans.limit_value === -1
          ? -1
          : stats.scans.limit_value - stats.scans.current_usage,
        can_use: stats.scans.can_use,
      },
      cycle: {
        days_until_reset: stats.ai.days_until_reset,
      },
    })
  } catch (error) {
    console.error('Error fetching usage stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage stats' },
      { status: 500 }
    )
  }
}
```

---

### 2.5 Preparar estructura para Polar.sh

**Archivo nuevo**: `app/api/webhooks/polar/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

/**
 * WEBHOOK DE POLAR.SH
 *
 * Documentación: https://docs.polar.sh/developers/webhooks
 *
 * Eventos esperados:
 * - subscription.created: Nueva suscripción
 * - subscription.updated: Cambio en suscripción
 * - subscription.cancelled: Cancelación
 * - subscription.expired: Expiración
 *
 * TODO: Implementar cuando se active Polar.sh
 *
 * Configuración requerida:
 * 1. POLAR_WEBHOOK_SECRET en .env
 * 2. Configurar URL del webhook en Polar.sh dashboard
 * 3. Verificar firma del webhook (security)
 */

export async function POST(request: NextRequest) {
  // TODO: Implementar cuando se integre Polar.sh

  return NextResponse.json(
    {
      error: 'Not implemented',
      message: 'Polar.sh integration pending'
    },
    { status: 501 }
  )
}

/**
 * EJEMPLO DE IMPLEMENTACIÓN FUTURA:
 *
 * const body = await request.text()
 * const signature = request.headers.get('polar-signature')
 *
 * // Verificar firma
 * const isValid = verifyPolarSignature(body, signature, process.env.POLAR_WEBHOOK_SECRET)
 * if (!isValid) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
 *
 * const event = JSON.parse(body)
 *
 * switch (event.type) {
 *   case 'subscription.created':
 *     // Actualizar tier del profesor a 'plus'
 *     // Guardar polar_subscription_id y polar_customer_id
 *     break
 *
 *   case 'subscription.updated':
 *     // Actualizar estado de suscripción
 *     break
 *
 *   case 'subscription.cancelled':
 *   case 'subscription.expired':
 *     // Cambiar tier a 'free'
 *     // Mantener polar_subscription_id para referencia
 *     break
 * }
 */
```

---

## Fase 3: Frontend (UI/UX)

### 3.1 Hook personalizado

**Archivo nuevo**: `lib/hooks/useTierLimits.ts`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface TierUsage {
  tier: 'free' | 'plus' | 'admin' | 'grandfathered'
  ai_generation: {
    used: number
    limit: number
    remaining: number
    can_use: boolean
  }
  scans: {
    used: number
    limit: number
    remaining: number
    can_use: boolean
  }
  cycle: {
    days_until_reset: number
  }
}

export function useTierLimits() {
  const [usage, setUsage] = useState<TierUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fetchUsage = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/tiers/usage')

      if (!res.ok) {
        throw new Error('Failed to fetch usage')
      }

      const data = await res.json()
      setUsage(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsage()

    // Refrescar cada 5 minutos
    const interval = setInterval(fetchUsage, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return {
    usage,
    loading,
    error,
    refetch: fetchUsage,
    canUseScan: usage?.scans.can_use ?? false,
    canUseAI: usage?.ai_generation.can_use ?? false,
  }
}
```

---

### 3.2 Componente TierBadge

**Archivo nuevo**: `components/shared/tier-badge.tsx`

```typescript
import { Badge } from '@/components/ui/badge'
import { Crown, Sparkles, Shield, Star } from 'lucide-react'

interface TierBadgeProps {
  tier: 'free' | 'plus' | 'admin' | 'grandfathered'
  size?: 'sm' | 'md' | 'lg'
}

const tierConfig = {
  free: {
    label: 'Free',
    icon: Star,
    className: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  plus: {
    label: 'Plus',
    icon: Crown,
    className: 'bg-amber-100 text-amber-700 border-amber-300',
  },
  admin: {
    label: 'Admin',
    icon: Shield,
    className: 'bg-purple-100 text-purple-700 border-purple-300',
  },
  grandfathered: {
    label: 'Early Adopter',
    icon: Sparkles,
    className: 'bg-blue-100 text-blue-700 border-blue-300',
  },
}

export function TierBadge({ tier, size = 'md' }: TierBadgeProps) {
  const config = tierConfig[tier]
  const Icon = config.icon

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  return (
    <Badge className={`${config.className} ${sizeClasses[size]} flex items-center gap-1.5`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
```

---

### 3.3 Componente UsageIndicator

**Archivo nuevo**: `components/shared/usage-indicator.tsx`

```typescript
import { Progress } from '@/components/ui/progress'
import { AlertCircle } from 'lucide-react'

interface UsageIndicatorProps {
  label: string
  used: number
  limit: number
  warningThreshold?: number // Default 80%
}

export function UsageIndicator({
  label,
  used,
  limit,
  warningThreshold = 80,
}: UsageIndicatorProps) {
  const isUnlimited = limit === -1
  const percentage = isUnlimited ? 0 : (used / limit) * 100
  const isWarning = percentage >= warningThreshold
  const isExceeded = percentage >= 100

  if (isUnlimited) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground">Ilimitado ∞</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={isWarning ? 'text-amber-600' : 'text-muted-foreground'}>
          {used} / {limit}
        </span>
      </div>

      <Progress
        value={Math.min(percentage, 100)}
        className={
          isExceeded
            ? 'bg-red-200 [&>div]:bg-red-500'
            : isWarning
            ? 'bg-amber-200 [&>div]:bg-amber-500'
            : ''
        }
      />

      {isWarning && (
        <div className="flex items-center gap-2 text-xs text-amber-600">
          <AlertCircle className="h-3 w-3" />
          {isExceeded
            ? 'Límite alcanzado'
            : `${(limit - used)} restantes`}
        </div>
      )}
    </div>
  )
}
```

---

### 3.4 Modal LimitReached

**Archivo nuevo**: `components/shared/limit-reached-modal.tsx`

```typescript
'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Crown } from 'lucide-react'

interface LimitReachedModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature: 'ai_generation' | 'scan'
  daysUntilReset: number
}

export function LimitReachedModal({
  open,
  onOpenChange,
  feature,
  daysUntilReset,
}: LimitReachedModalProps) {
  const featureLabel = feature === 'ai_generation'
    ? 'generación de exámenes con IA'
    : 'escaneo de exámenes'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Límite alcanzado
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Has alcanzado el límite mensual de {featureLabel} para tu plan Free.
            </p>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">
                Tu límite se resetea en:
              </p>
              <p className="text-2xl font-bold text-foreground">
                {daysUntilReset} {daysUntilReset === 1 ? 'día' : 'días'}
              </p>
            </div>

            <div className="border-l-4 border-amber-500 pl-4">
              <p className="font-medium text-foreground">¿Necesitas más?</p>
              <p className="text-sm">
                Actualiza a <strong>ProfeVision Plus</strong> para acceso ilimitado.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            Entendido
          </AlertDialogAction>
          {/* TODO: Cuando se integre Polar.sh, agregar botón de upgrade */}
          {/* <Button variant="default" className="bg-amber-500">
            Actualizar a Plus
          </Button> */}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

---

### 3.5 Página "Mi Plan / Suscripción"

**Objetivo**: Reemplazar la página de Reportes (actualmente hardcoded y en desarrollo) por una página completa de gestión de suscripción.

**Ubicación actual**: `app/[locale]/dashboard/reports/page.tsx`
**Nueva ubicación**: **Mantener misma ruta** (no breaking change en navegación)

#### Cambios en Sidebar

**Archivo**: `components/dashboard/dashboard-sidebar.tsx`

Modificar la entrada de "Reports" (líneas 79-83):

```typescript
// ANTES:
{
  title: t('navigation.reports'),
  href: '/dashboard/reports',
  icon: BarChart3,
},

// DESPUÉS:
{
  title: t('navigation.subscription'),  // "Mi Plan" o "Suscripción"
  href: '/dashboard/reports',  // Mantener URL para no romper
  icon: Crown,  // Cambiar a icono Crown para indicar tiers
},
```

**Imports a agregar**:
```typescript
import { Crown } from 'lucide-react';
```

#### Componente PricingCard

**Archivo nuevo**: `components/shared/pricing-card.tsx`

```typescript
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, X, Crown, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface PricingTier {
  name: 'free' | 'plus'
  displayName: string
  price: string
  priceDescription: string
  features: {
    name: string
    included: boolean
    value?: string
  }[]
  isCurrentPlan: boolean
  isRecommended?: boolean
}

interface PricingCardProps {
  tier: PricingTier
  onUpgrade?: () => void
}

export function PricingCard({ tier, onUpgrade }: PricingCardProps) {
  const t = useTranslations('subscription')

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all',
        tier.isCurrentPlan && 'border-primary border-2',
        tier.isRecommended && 'shadow-lg scale-105'
      )}
    >
      {tier.isRecommended && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-white px-4 py-1 text-xs font-bold rounded-bl-lg">
          {t('recommended')}
        </div>
      )}

      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-2xl">
            {tier.name === 'plus' ? (
              <Crown className="h-6 w-6 text-amber-500" />
            ) : (
              <Sparkles className="h-6 w-6 text-gray-400" />
            )}
            {tier.displayName}
          </CardTitle>
          {tier.isCurrentPlan && (
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
              {t('currentPlan')}
            </span>
          )}
        </div>
        <CardDescription className="mt-4">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-foreground">{tier.price}</span>
            <span className="text-muted-foreground">/ {tier.priceDescription}</span>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ul className="space-y-3 mb-6">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              {feature.included ? (
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <X className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className={cn(
                  'text-sm',
                  !feature.included && 'text-muted-foreground line-through'
                )}>
                  {feature.name}
                </span>
                {feature.value && (
                  <span className="text-sm font-semibold text-primary ml-1">
                    {feature.value}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>

        {!tier.isCurrentPlan && tier.name === 'plus' && (
          <Button
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            size="lg"
          >
            <Crown className="h-4 w-4 mr-2" />
            {t('upgradeButton')}
          </Button>
        )}

        {tier.isCurrentPlan && tier.name === 'free' && (
          <Button
            onClick={onUpgrade}
            className="w-full"
            variant="outline"
            size="lg"
          >
            {t('considerUpgrade')}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
```

#### Nueva Página de Suscripción

**Archivo**: `app/[locale]/dashboard/reports/page.tsx` (reemplazar completamente)

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { PricingCard } from '@/components/shared/pricing-card'
import { UsageIndicator } from '@/components/shared/usage-indicator'
import { TierBadge } from '@/components/shared/tier-badge'
import { useTierLimits } from '@/lib/hooks/useTierLimits'
import { AlertTriangle, Crown, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

export default function SubscriptionPage() {
  const t = useTranslations('subscription')
  const { usage, loading } = useTierLimits()
  const [showGrandfatheredWarning, setShowGrandfatheredWarning] = useState(false)

  useEffect(() => {
    // Mostrar warning si es grandfathered
    if (usage?.tier === 'grandfathered') {
      setShowGrandfatheredWarning(true)
    }
  }, [usage])

  const handleUpgrade = () => {
    // TODO: Integrar con Polar.sh cuando esté listo
    toast.info(t('upgradeComingSoon'), {
      description: t('upgradeComingSoonDescription')
    })
  }

  const freeTierConfig = {
    name: 'free' as const,
    displayName: t('tiers.free.name'),
    price: '$0',
    priceDescription: t('pricing.month'),
    isCurrentPlan: usage?.tier === 'free',
    features: [
      { name: t('features.aiGenerations', { count: 1 }), included: true, value: '1/mes' },
      { name: t('features.scans', { count: 50 }), included: true, value: '50/mes' },
      { name: t('features.unlimitedStudents'), included: true },
      { name: t('features.unlimitedGroups'), included: true },
      { name: t('features.pdfExport'), included: true },
      { name: t('features.prioritySupport'), included: false },
      { name: t('features.advancedAnalytics'), included: false },
    ],
  }

  const plusTierConfig = {
    name: 'plus' as const,
    displayName: t('tiers.plus.name'),
    price: '$9.99',
    priceDescription: t('pricing.month'),
    isCurrentPlan: usage?.tier === 'plus' || usage?.tier === 'admin',
    isRecommended: true,
    features: [
      { name: t('features.aiGenerations', { count: 100 }), included: true, value: '100/mes' },
      { name: t('features.scans', { count: 500 }), included: true, value: '500/mes' },
      { name: t('features.unlimitedStudents'), included: true },
      { name: t('features.unlimitedGroups'), included: true },
      { name: t('features.pdfExport'), included: true },
      { name: t('features.prioritySupport'), included: true },
      { name: t('features.advancedAnalytics'), included: true },
    ],
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        {usage && (
          <TierBadge tier={usage.tier} size="lg" />
        )}
      </div>

      {/* Grandfathered Warning (solo para usuarios grandfathered) */}
      {showGrandfatheredWarning && usage?.tier === 'grandfathered' && (
        <Alert variant="default" className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900 dark:text-blue-100">
            {t('grandfathered.title')}
          </AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-200">
            {t('grandfathered.description')}
          </AlertDescription>
        </Alert>
      )}

      {/* Uso Actual (solo para FREE, PLUS y GRANDFATHERED) */}
      {usage && usage.tier !== 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {t('currentUsage.title')}
            </CardTitle>
            <CardDescription>
              {t('currentUsage.description', { days: usage.cycle.days_until_reset })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UsageIndicator
              label={t('features.aiGenerations_short')}
              used={usage.ai_generation.used}
              limit={usage.ai_generation.limit}
            />
            <UsageIndicator
              label={t('features.scans_short')}
              used={usage.scans.used}
              limit={usage.scans.limit}
            />
          </CardContent>
        </Card>
      )}

      {/* Pricing Section */}
      <div>
        <h3 className="text-2xl font-bold mb-6">{t('pricing.title')}</h3>
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl">
          <PricingCard tier={freeTierConfig} onUpgrade={handleUpgrade} />
          <PricingCard tier={plusTierConfig} onUpgrade={handleUpgrade} />
        </div>
      </div>

      {/* FAQ o Info Adicional */}
      <Card>
        <CardHeader>
          <CardTitle>{t('faq.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">{t('faq.q1')}</h4>
            <p className="text-sm text-muted-foreground">{t('faq.a1')}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">{t('faq.q2')}</h4>
            <p className="text-sm text-muted-foreground">{t('faq.a2')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### Traducciones necesarias

Agregar a `i18n/locales/es.json` y `en.json`:

```json
{
  "subscription": {
    "title": "Mi Plan",
    "description": "Gestiona tu suscripción y revisa tu uso mensual",
    "currentPlan": "Plan Actual",
    "recommended": "Recomendado",
    "upgradeButton": "Actualizar a Plus",
    "considerUpgrade": "Actualizar plan",
    "upgradeComingSoon": "Próximamente disponible",
    "upgradeComingSoonDescription": "La función de upgrade estará disponible pronto",

    "tiers": {
      "free": { "name": "Free" },
      "plus": { "name": "Plus" }
    },

    "pricing": {
      "title": "Elige tu plan",
      "month": "mes"
    },

    "features": {
      "aiGenerations": "{count} generaciones con IA",
      "aiGenerations_short": "Generaciones IA",
      "scans": "{count} escaneos",
      "scans_short": "Escaneos",
      "unlimitedStudents": "Estudiantes ilimitados",
      "unlimitedGroups": "Grupos ilimitados",
      "pdfExport": "Exportar a PDF",
      "prioritySupport": "Soporte prioritario",
      "advancedAnalytics": "Analíticas avanzadas"
    },

    "currentUsage": {
      "title": "Uso del mes actual",
      "description": "Tu límite se resetea en {days} días"
    },

    "grandfathered": {
      "title": "Beneficio Early Adopter (Temporal)",
      "description": "Como usuario temprano, actualmente tienes acceso ilimitado. Este beneficio es temporal y en cualquier momento podrías pasar al plan Free. Te recomendamos actualizar a Plus para mantener acceso ilimitado permanente."
    },

    "faq": {
      "title": "Preguntas Frecuentes",
      "q1": "¿Cuándo se resetean mis límites?",
      "a1": "Tus límites se resetean mensualmente basado en tu fecha de registro. Por ejemplo, si te registraste el día 15, tus límites se resetean cada día 15 del mes.",
      "q2": "¿Puedo cambiar de plan en cualquier momento?",
      "a2": "Sí, puedes actualizar a Plus en cualquier momento. Los cambios se aplicarán inmediatamente."
    }
  },

  "navigation": {
    "subscription": "Mi Plan"
  }
}
```

---

### 3.6 Integración en flujos existentes

**Archivos a modificar**:

1. **Scan Wizard** (`components/exam/scan-wizard.tsx`):
   ```typescript
   // Agregar useTierLimits
   const { canUseScan, usage } = useTierLimits()

   // Mostrar UsageIndicator en paso de instrucciones
   // Verificar canUseScan antes de permitir captura
   // Mostrar LimitReachedModal si no puede escanear
   ```

2. **AI Chat** (`app/[locale]/dashboard/exams/ai-exams-creation-chat/page.tsx`):
   ```typescript
   // Similar a scan wizard
   // Deshabilitar botón de generar si !canUseAI
   // Mostrar warning cuando se acerque al límite
   ```

3. **Dashboard** (`app/[locale]/dashboard/page.tsx`):
   ```typescript
   // Agregar TierBadge en header de usuario
   // Agregar tarjeta con resumen de uso (UsageIndicator)
   ```

---

## Fase 4: Tipos y Validaciones

### 4.1 Actualizar database.ts

**Archivo**: `lib/types/database.ts`

Agregar a la interfaz `Profesor`:
```typescript
export interface Profesor {
  // ... campos existentes ...
  subscription_tier: 'free' | 'plus' | 'admin' | 'grandfathered'
  subscription_status: 'active' | 'cancelled' | 'expired'
  subscription_cycle_start: string
  polar_subscription_id: string | null
  polar_customer_id: string | null
}
```

Agregar nuevas interfaces:
```typescript
export interface TierLimits {
  tier: 'free' | 'plus' | 'admin' | 'grandfathered'
  ai_generations_per_month: number
  scans_per_month: number
  max_students: number | null
  max_groups: number | null
  features: Record<string, any>
  created_at: string
  updated_at: string
}

export interface UsageTracking {
  id: string
  profesor_id: string
  month_year: string
  ai_generations_used: number
  scans_used: number
  cycle_start_date: string
  cycle_end_date: string
  created_at: string
  updated_at: string
}
```

---

### 4.2 Tipos auxiliares

**Archivo nuevo**: `lib/types/tiers.ts`

```typescript
export type SubscriptionTier = 'free' | 'plus' | 'admin' | 'grandfathered'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired'
export type Feature = 'ai_generation' | 'scan'

export interface TierFeatureCheck {
  can_use: boolean
  current_usage: number
  limit_value: number
  tier: SubscriptionTier
  days_until_reset: number
}

export interface UsageStatsResponse {
  tier: SubscriptionTier
  ai_generation: {
    used: number
    limit: number
    remaining: number
    can_use: boolean
  }
  scans: {
    used: number
    limit: number
    remaining: number
    can_use: boolean
  }
  cycle: {
    days_until_reset: number
  }
}

// Para futura integración con Polar.sh
export interface PolarSubscription {
  id: string
  customer_id: string
  status: 'active' | 'cancelled' | 'expired'
  plan_id: string
  current_period_start: string
  current_period_end: string
}

export interface PolarWebhookEvent {
  type: 'subscription.created' | 'subscription.updated' | 'subscription.cancelled' | 'subscription.expired'
  data: PolarSubscription
}
```

---

### 4.3 Schemas Zod

**Archivo**: Agregar a `lib/validations/tier-schemas.ts` (nuevo)

```typescript
import { z } from 'zod'

export const SubscriptionTierSchema = z.enum(['free', 'plus', 'admin', 'grandfathered'])

export const FeatureSchema = z.enum(['ai_generation', 'scan'])

export const UsageStatsSchema = z.object({
  tier: SubscriptionTierSchema,
  ai_generation: z.object({
    used: z.number(),
    limit: z.number(),
    remaining: z.number(),
    can_use: z.boolean(),
  }),
  scans: z.object({
    used: z.number(),
    limit: z.number(),
    remaining: z.number(),
    can_use: z.boolean(),
  }),
  cycle: z.object({
    days_until_reset: z.number(),
  }),
})
```

---

## Fase 5: Internacionalización

### 5.1 Traducciones Español

**Archivo**: `i18n/locales/es.json`

Agregar al JSON existente:
```json
{
  "tiers": {
    "free": "Gratis",
    "plus": "Plus",
    "admin": "Admin",
    "grandfathered": "Early Adopter",

    "limits": {
      "ai_generation": "Generación con IA",
      "scans": "Escaneos",
      "unlimited": "Ilimitado",
      "used": "usado",
      "of": "de",
      "remaining": "restantes"
    },

    "messages": {
      "limit_reached": "Has alcanzado el límite de {feature} para tu plan {tier}",
      "limit_warning": "Te quedan {remaining} {feature} este mes",
      "resets_in": "Se resetea en {days} días",
      "upgrade_to_plus": "Actualiza a ProfeVision Plus para acceso ilimitado"
    },

    "features": {
      "ai_exams": "Exámenes con IA",
      "scan_exams": "Escaneo de exámenes",
      "pdf_export": "Exportar a PDF",
      "excel_import": "Importar desde Excel",
      "priority_support": "Soporte prioritario"
    },

    "errors": {
      "SCAN_LIMIT_REACHED": "Has alcanzado el límite de escaneos mensuales",
      "AI_GENERATION_LIMIT_REACHED": "Has alcanzado el límite de generaciones con IA mensuales"
    }
  }
}
```

---

### 5.2 Traducciones Inglés

**Archivo**: `i18n/locales/en.json`

```json
{
  "tiers": {
    "free": "Free",
    "plus": "Plus",
    "admin": "Admin",
    "grandfathered": "Early Adopter",

    "limits": {
      "ai_generation": "AI Generation",
      "scans": "Scans",
      "unlimited": "Unlimited",
      "used": "used",
      "of": "of",
      "remaining": "remaining"
    },

    "messages": {
      "limit_reached": "You've reached the {feature} limit for your {tier} plan",
      "limit_warning": "You have {remaining} {feature} left this month",
      "resets_in": "Resets in {days} days",
      "upgrade_to_plus": "Upgrade to ProfeVision Plus for unlimited access"
    },

    "features": {
      "ai_exams": "AI-powered Exams",
      "scan_exams": "Exam Scanning",
      "pdf_export": "PDF Export",
      "excel_import": "Excel Import",
      "priority_support": "Priority Support"
    },

    "errors": {
      "SCAN_LIMIT_REACHED": "You've reached your monthly scan limit",
      "AI_GENERATION_LIMIT_REACHED": "You've reached your monthly AI generation limit"
    }
  }
}
```

---

## Fase 6: Testing y Documentación

### 6.1 Testing Manual

**Checklist de pruebas**:

- [ ] **Crear usuario nuevo**
  - [ ] Verificar que sea tier 'free' por defecto
  - [ ] Verificar que `subscription_cycle_start` sea fecha actual

- [ ] **Probar límites FREE**
  - [ ] Generar 1 examen con IA ✓
  - [ ] Intentar generar 2do examen → debe fallar con error 403
  - [ ] Escanear 50 exámenes ✓
  - [ ] Intentar escanear 51vo → debe fallar con error 403

- [ ] **Usuarios existentes**
  - [ ] Verificar que sean 'grandfathered'
  - [ ] Verificar que puedan escanear/generar sin límites

- [ ] **Ciclo mensual**
  - [ ] Usuario registrado el 15/01 a las 10:00
  - [ ] Verificar que ciclo sea del 15 al 14 del mes siguiente
  - [ ] Usar 50 escaneos
  - [ ] El 16/02, verificar que contador se resetee a 0

- [ ] **Tier PLUS**
  - [ ] Cambiar tier manualmente en BD a 'plus'
  - [ ] Verificar límite de 500 escaneos y 100 IA
  - [ ] Verificar que no bloquee antes de alcanzar límite

- [ ] **Tier ADMIN**
  - [ ] Cambiar tier a 'admin'
  - [ ] Verificar sin límites

- [ ] **UI/UX**
  - [ ] TierBadge muestra correctamente en dashboard
  - [ ] UsageIndicator actualiza en tiempo real
  - [ ] LimitReachedModal aparece cuando se alcanza límite
  - [ ] Textos en español e inglés correctos

---

### 6.2 Actualizar DATABASE_SCHEMA.md

Agregar las nuevas tablas y campos a `mddocs/DATABASE_SCHEMA.md`:

1. Campos de `profesores`:
   - `subscription_tier`
   - `subscription_status`
   - `subscription_cycle_start`
   - `polar_subscription_id`
   - `polar_customer_id`

2. Nueva tabla `tier_limits`
3. Nueva tabla `usage_tracking`
4. Nuevas funciones SQL

---

### 6.3 Actualizar CLAUDE.md

Agregar sección sobre sistema de tiers:

```markdown
## Sistema de Tiers y Permisos

### Tiers Disponibles

ProfeVision implementa un sistema de 4 tiers:

- **FREE**: 50 escaneos/mes, 1 generación IA/mes
- **PLUS**: 500 escaneos/mes, 100 generaciones IA/mes
- **ADMIN**: Sin límites
- **GRANDFATHERED**: Sin límites (usuarios existentes antes del sistema)

### Verificación de Límites

Usar `TierService` para verificar límites:

```typescript
import { TierService } from '@/lib/services/tier-service'

// Verificar si puede usar feature
const canScan = await TierService.checkFeatureAccess(profesorId, 'scan')

// Incrementar uso
await TierService.incrementUsage(profesorId, 'scan')
```

### Ciclo Mensual

Los límites se resetean mensualmente basado en la fecha de registro de cada usuario:
- Usuario registrado el 15 → ciclo del 15 al 14
- Usuario registrado el 1 → ciclo del 1 al 31/30

### Integración Polar.sh

Preparado para integración futura con webhook en `/api/webhooks/polar`.
```

---

## Orden de Ejecución Recomendado

### Día 1 (2-3 horas): Base de datos
1. ✅ Fase 1.1: Agregar campos a `profesores`
2. ✅ Fase 1.2: Crear tabla `tier_limits`
3. ✅ Fase 1.3: Crear tabla `usage_tracking`
4. ✅ Fase 1.4: Crear funciones SQL
5. ✅ Fase 4.1-4.3: Actualizar tipos TypeScript

### Día 2 (2-3 horas): Backend
6. ✅ Fase 2.1: Crear `TierService`
7. ✅ Fase 2.4: API de usage stats
8. ✅ Fase 2.2: Modificar API de escaneo
9. ✅ Fase 2.3: Modificar API de chat IA
10. ✅ Fase 2.5: Estructura Polar.sh

### Día 3 (2-3 horas): Frontend + Testing
11. ✅ Fase 5: i18n (traducciones)
12. ✅ Fase 3.1: Hook `useTierLimits`
13. ✅ Fase 3.2-3.4: Componentes UI (TierBadge, UsageIndicator, LimitReachedModal)
14. ✅ Fase 3.5: Página "Mi Plan/Suscripción" (PricingCard + nueva página)
15. ✅ Fase 3.6: Integrar en flujos existentes
16. ✅ Fase 6: Testing y documentación

---

## Archivos a Crear/Modificar

### Nuevos archivos (19)

**Base de datos (via MCP)**:
- 4 migraciones vía `mcp__supabase__apply_migration`

**Backend**:
- `lib/services/tier-service.ts`
- `lib/types/tiers.ts`
- `lib/validations/tier-schemas.ts`
- `app/api/tiers/usage/route.ts`
- `app/api/webhooks/polar/route.ts`

**Frontend**:
- `lib/hooks/useTierLimits.ts`
- `components/shared/tier-badge.tsx`
- `components/shared/usage-indicator.tsx`
- `components/shared/limit-reached-modal.tsx`
- `components/shared/pricing-card.tsx` ⭐ **NUEVO**

**i18n**:
- Claves en `es.json` y `en.json` (tiers + subscription)

**Documentación**:
- Actualizar `mddocs/DATABASE_SCHEMA.md`
- Actualizar `CLAUDE.md`

### Archivos modificados (5)

- `app/api/exams/save-results/route.ts`
- `app/api/chat/route.ts`
- `lib/types/database.ts`
- `app/[locale]/dashboard/reports/page.tsx` ⭐ **REEMPLAZO COMPLETO**
- `components/dashboard/dashboard-sidebar.tsx` ⭐ **NUEVO** (cambiar "Reportes" → "Mi Plan")

---

## Consideraciones de Seguridad

### 1. Row-Level Security (RLS)

**CRÍTICO**: Todas las nuevas tablas tienen RLS habilitado.

- `tier_limits`: Solo lectura para todos (necesario para UI)
- `usage_tracking`: Profesores solo ven/modifican su propio registro
- Funciones SQL ejecutan con permisos del usuario llamante

### 2. Verificación en Backend

**NUNCA confiar en verificaciones del frontend**. Siempre verificar límites en el servidor:

```typescript
// ❌ MAL - solo en frontend
if (canUseScan) {
  await saveResults()
}

// ✅ BIEN - verificar en API
// app/api/exams/save-results/route.ts
const canScan = await TierService.checkFeatureAccess(profesorId, 'scan')
if (!canScan.can_use) {
  return NextResponse.json({ error: 'LIMIT_REACHED' }, { status: 403 })
}
```

### 3. Race Conditions

El uso de `UNIQUE(profesor_id, month_year)` en `usage_tracking` previene condiciones de carrera al crear múltiples registros del mismo mes.

### 4. Fail Open vs Fail Closed

En caso de error del sistema de tiers, el comportamiento actual es **fail open** (permitir uso):

```typescript
try {
  const canUse = await TierService.checkFeatureAccess(...)
  if (!canUse.can_use) return error()
} catch (error) {
  // Error del sistema - permitir continuar
  console.error('Tier check failed, allowing usage')
}
```

**Decisión de diseño**: Preferimos permitir uso temporalmente que bloquear a usuarios pagos por un bug del sistema de tiers.

---

## Breaking Changes

### ❌ Ninguno

Esta implementación **NO introduce breaking changes**:

- ✅ Campos nuevos en `profesores` tienen valores DEFAULT
- ✅ Usuarios existentes automáticamente marcados como 'grandfathered' (sin restricciones)
- ✅ APIs existentes funcionan sin cambios (las verificaciones son nuevas, no reemplazan lógica)
- ✅ Frontend funciona sin cambios (componentes de tier son opcionales)
- ✅ Tipos TypeScript se extienden sin romper tipos existentes

### Migración de Datos

**Automática**: La migración incluye UPDATE para marcar usuarios existentes:

```sql
UPDATE public.profesores
SET subscription_tier = 'grandfathered'
WHERE created_at < now();
```

---

## Métricas de Éxito

### KPIs a monitorear

1. **Adopción del sistema**
   - % de usuarios nuevos en tier FREE
   - % de conversión FREE → PLUS (cuando se active Polar.sh)

2. **Uso de límites**
   - Promedio de escaneos usados por usuarios FREE
   - Promedio de generaciones IA usadas por usuarios FREE
   - % de usuarios que alcanzan límites

3. **Experiencia de usuario**
   - Tasa de error por límites alcanzados
   - Tiempo promedio para renovación de límites

### Queries útiles

```sql
-- Distribución de tiers
SELECT subscription_tier, COUNT(*)
FROM profesores
GROUP BY subscription_tier;

-- Uso promedio de usuarios FREE
SELECT
  AVG(scans_used) as avg_scans,
  AVG(ai_generations_used) as avg_ai
FROM usage_tracking ut
JOIN profesores p ON p.id = ut.profesor_id
WHERE p.subscription_tier = 'free'
  AND ut.month_year = to_char(now(), 'YYYY-MM');

-- Usuarios que alcanzaron límites
SELECT COUNT(DISTINCT profesor_id)
FROM usage_tracking ut
JOIN profesores p ON p.id = ut.profesor_id
JOIN tier_limits tl ON tl.tier = p.subscription_tier
WHERE (ut.scans_used >= tl.scans_per_month
   OR ut.ai_generations_used >= tl.ai_generations_per_month)
  AND ut.month_year = to_char(now(), 'YYYY-MM');
```

---

## Próximos Pasos (Post-implementación)

### Fase Futura: Integración Polar.sh

Cuando se decida activar pagos:

1. **Configurar Polar.sh**
   - Crear cuenta
   - Configurar productos y precios
   - Obtener API keys

2. **Implementar webhook**
   - Completar `app/api/webhooks/polar/route.ts`
   - Configurar verificación de firma
   - Manejar eventos de suscripción

3. **Crear flujo de upgrade**
   - Página de pricing
   - Botón "Upgrade to Plus" funcional
   - Redirect a checkout de Polar.sh

4. **Dashboard de facturación**
   - Ver historial de pagos
   - Descargar facturas
   - Cancelar suscripción

---

## Soporte y Mantenimiento

### Documentación de referencia

- **Polar.sh Docs**: https://docs.polar.sh/
- **Supabase RLS**: https://supabase.com/docs/guides/auth/row-level-security
- **Next.js API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

### Contacto

Para dudas o problemas con esta implementación, revisar:

1. Este documento (`TIER_SYSTEM_IMPLEMENTATION_PLAN.md`)
2. Schema de base de datos (`DATABASE_SCHEMA.md`)
3. Documentación general (`CLAUDE.md`)

---

**Última actualización**: 2025-10-29
**Versión del plan**: 1.0
**Estado**: Listo para implementar
