# Polar.sh Implementation - Project Context

**Branch**: `feature/polar-sh-implementation`
**Fecha**: 2025-12-06
**Status**: Planning

---

## 1. Objetivo

Integrar Polar.sh como procesador de pagos para suscripciones de ProfeVision Plus.

---

## 2. Productos a Vender

| Producto | Precio | Billing |
|----------|--------|---------|
| ProfeVision Plus Monthly | $5 USD | Mensual |
| ProfeVision Plus Annual | $50 USD | Anual (ahorra 17%) |

---

## 3. Infraestructura Existente

### 3.1 Base de Datos (Supabase)

#### Tabla `profesores` - Campos de Suscripción
```sql
subscription_tier        TEXT DEFAULT 'grandfathered'  -- free, plus, admin, grandfathered
subscription_status      TEXT DEFAULT 'active'         -- active, cancelled, past_due
subscription_cycle_start TIMESTAMPTZ                   -- inicio ciclo facturación
polar_subscription_id    TEXT                          -- ID suscripción Polar
polar_customer_id        TEXT                          -- ID cliente Polar
```

#### Tabla `tier_limits` (4 rows)
| tier | ai_generations_per_month | scans_per_month | max_students | max_groups |
|------|--------------------------|-----------------|--------------|------------|
| free | 1 | 50 | 100 | 5 |
| plus | -1 (ilimitado) | -1 | -1 | -1 |
| admin | -1 | -1 | -1 | -1 |
| grandfathered | -1 | -1 | -1 | -1 |

#### Tabla `usage_tracking`
- Tracking mensual por profesor
- Campos: `ai_generations_used`, `scans_used`, `cycle_start_date`, `cycle_end_date`

#### Funciones SQL
- `check_feature_limit(profesor_id, feature)` → verifica límites
- `increment_feature_usage(profesor_id, feature)` → incrementa uso
- `get_or_create_usage_tracking(profesor_id)` → obtiene/crea tracking
- `calculate_cycle_dates(cycle_start)` → calcula fechas ciclo

### 3.2 Backend Existente

#### TierService (`lib/services/tier-service.ts`)
```typescript
class TierService {
  static checkFeatureAccess(supabase, profesorId, feature)
  static incrementUsage(supabase, profesorId, feature, amount)
  static getTierLimits(supabase, tier)
  static getCurrentTier(supabase, profesorId)
  static getUsageStats(supabase, profesorId)
  static shouldShowWelcome(supabase, profesorId)
  static completeWelcome(supabase, profesorId)
  static isAdmin(supabase, profesorId)
}
```

#### APIs Existentes
- `GET /api/tiers/usage` - estadísticas de uso
- `GET /api/tiers/check-welcome` - verificar primer login
- `POST /api/tiers/complete-welcome` - marcar welcome completado

### 3.3 Frontend Existente

#### Página "Mi Plan" (`app/[locale]/dashboard/reports/page.tsx`)
- Muestra tier actual
- Muestra uso de features
- Cards de pricing (Free vs Plus)
- Botón "Upgrade" (actualmente muestra toast "próximamente")

#### Componentes Disponibles
- `components/shared/tier-badge.tsx` - badge de tier
- `components/shared/usage-indicator.tsx` - barra de progreso uso
- `components/shared/limit-reached-modal.tsx` - modal límite alcanzado
- `components/shared/pricing-card.tsx` - card de pricing

---

## 4. Flujo de Usuario Objetivo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario en /dashboard/reports (Mi Plan)                  │
│    - Ve su tier actual (Free)                               │
│    - Ve uso del mes                                         │
│    - Ve cards Free vs Plus                                  │
│    - Click "Upgrade to Plus"                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Modal de Polar Checkout (embedded)                       │
│    - Selecciona plan (Monthly/Annual)                       │
│    - Ingresa datos de pago                                  │
│    - Confirma compra                                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Polar procesa pago                                       │
│    - Envía webhook a /api/webhooks/polar                    │
│    - Evento: subscription.created                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Webhook actualiza BD                                     │
│    - Busca profesor por email                               │
│    - Actualiza subscription_tier = 'plus'                   │
│    - Guarda polar_customer_id, polar_subscription_id        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Usuario regresa a ProfeVision                            │
│    - Ve toast "¡Bienvenido a Plus!"                         │
│    - Tier actualizado en UI                                 │
│    - Límites ilimitados                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Flujo de Cancelación

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario en /dashboard/reports (Mi Plan)                  │
│    - Ve su tier Plus activo                                 │
│    - Click "Gestionar suscripción"                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Redirige a Polar Customer Portal                         │
│    - Usuario cancela desde Polar                            │
│    - Polar envía webhook subscription.canceled              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Webhook actualiza BD                                     │
│    - subscription_status = 'cancelled'                      │
│    - Usuario mantiene acceso hasta fin de periodo           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Al expirar periodo (webhook subscription.revoked)        │
│    - subscription_tier = 'free'                             │
│    - subscription_status = 'expired'                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Archivos a Crear/Modificar

### Nuevos Archivos
| Archivo | Propósito |
|---------|-----------|
| `app/api/webhooks/polar/route.ts` | Webhook endpoint |
| `lib/polar/client.ts` | Cliente Polar (opcional) |
| `components/polar/checkout-button.tsx` | Botón con checkout embed |

### Archivos a Modificar
| Archivo | Cambio |
|---------|--------|
| `app/[locale]/dashboard/reports/page.tsx` | Integrar checkout real |
| `.env.local` | Agregar POLAR_* vars |
| `package.json` | Agregar @polar-sh/checkout |

---

## 7. Variables de Entorno Requeridas

```env
# Polar.sh - Sandbox (testing)
POLAR_ACCESS_TOKEN=polar_sat_xxx
POLAR_WEBHOOK_SECRET=whsec_xxx
POLAR_PRODUCT_ID_MONTHLY=prod_xxx
POLAR_PRODUCT_ID_ANNUAL=prod_yyy

# URLs
NEXT_PUBLIC_APP_URL=https://profevision.com
```

---

## 8. Dependencias a Instalar

```bash
yarn add @polar-sh/checkout
```

---

## 9. Documentación de Referencia

- Polar.sh Docs: `mddocs/polar-sh-documentation/`
  - `00_introduction_and_quickstart.md`
  - `02_checkout_integration.md`
  - `07_webhooks_and_events.md`
- Database Schema: `mddocs/DATABASE_SCHEMA.md`
- Tier System Plan: `mddocs/archive/TIER_SYSTEM_IMPLEMENTATION_PLAN.md`
