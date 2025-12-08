# Polar.sh Implementation - Execution Phases

**Branch**: `feature/polar-sh-implementation`
**Fecha**: 2025-12-06

---

## Phase 0: Polar.sh Dashboard Setup (Manual)

**Owner**: Usuario
**Tiempo estimado**: 30 min

### 0.1 Crear Cuenta Polar.sh
- [ ] Ir a https://polar.sh
- [ ] Crear cuenta con email/GitHub
- [ ] Verificar email

### 0.2 Crear Sandbox Organization
- [ ] Dashboard → Settings → Create Sandbox Organization
- [ ] Nombre: "ProfeVision Sandbox" (o similar)

### 0.3 Crear Productos
- [ ] Products → Create Product
- [ ] **Producto 1**: ProfeVision Plus Monthly
  - Type: Subscription
  - Price: $5 USD / month
  - Copiar Product ID → `POLAR_PRODUCT_ID_MONTHLY`
  
- [ ] **Producto 2**: ProfeVision Plus Annual
  - Type: Subscription
  - Price: $50 USD / year
  - Copiar Product ID → `POLAR_PRODUCT_ID_ANNUAL`

### 0.4 Configurar Webhook
- [ ] Settings → Webhooks → Add Endpoint
- [ ] URL: `https://[tu-preview].vercel.app/api/webhooks/polar`
- [ ] Events to subscribe:
  - `subscription.created`
  - `subscription.updated`
  - `subscription.canceled`
  - `subscription.revoked`
  - `subscription.active` (opcional)
- [ ] Copiar Webhook Secret → `POLAR_WEBHOOK_SECRET`

### 0.5 Obtener Access Token
- [ ] Settings → API Keys → Create Token
- [ ] Copiar token → `POLAR_ACCESS_TOKEN`

### 0.6 Deliverables
```env
POLAR_ACCESS_TOKEN=polar_sat_xxx
POLAR_WEBHOOK_SECRET=whsec_xxx
POLAR_PRODUCT_ID_MONTHLY=prod_xxx
POLAR_PRODUCT_ID_ANNUAL=prod_yyy
```

---

## Phase 1: Backend - Webhook Handler

**Tiempo estimado**: 1 hora

### 1.1 Instalar Dependencia
```bash
yarn add @polar-sh/checkout
```

### 1.2 Crear Webhook Route
**Archivo**: `app/api/webhooks/polar/route.ts`

```typescript
// Pseudocódigo - estructura
export async function POST(request: NextRequest) {
  // 1. Verificar firma del webhook
  // 2. Parsear evento
  // 3. Switch por tipo de evento
  //    - subscription.created → upgrade a plus
  //    - subscription.canceled → marcar cancelled
  //    - subscription.revoked → downgrade a free
  // 4. Actualizar BD via service_role client
  // 5. Retornar 200 OK
}
```

### 1.3 Crear Servicio Polar (opcional)
**Archivo**: `lib/polar/webhook-handler.ts`

Funciones:
- `verifyWebhookSignature(payload, signature, secret)`
- `handleSubscriptionCreated(event)`
- `handleSubscriptionCanceled(event)`
- `handleSubscriptionRevoked(event)`
- `findProfesorByEmail(email)`

### 1.4 Tests Unitarios (opcional)
- Mock de eventos Polar
- Verificar actualización de BD

---

## Phase 2: Frontend - Checkout Integration

**Tiempo estimado**: 1.5 horas

### 2.1 Crear Componente Checkout
**Archivo**: `components/polar/checkout-button.tsx`

```typescript
// Wrapper del Polar Checkout Embed
// Props: productId, customerEmail, onSuccess, onError
```

### 2.2 Modificar Página Mi Plan
**Archivo**: `app/[locale]/dashboard/reports/page.tsx`

Cambios:
- Importar componente checkout
- Reemplazar toast "próximamente" por checkout real
- Agregar toggle mensual/anual
- Pasar email del usuario al checkout

### 2.3 Agregar Link "Gestionar Suscripción"
- Solo visible para tier Plus
- Redirige a Polar Customer Portal

### 2.4 Success/Error Handling
- Toast de éxito después del pago
- Refresh de datos del usuario
- Manejo de errores de checkout

---

## Phase 3: Environment Setup

**Tiempo estimado**: 30 min

### 3.1 Variables Locales
**Archivo**: `.env.local`
```env
POLAR_ACCESS_TOKEN=polar_sat_xxx
POLAR_WEBHOOK_SECRET=whsec_xxx
POLAR_PRODUCT_ID_MONTHLY=prod_xxx
POLAR_PRODUCT_ID_ANNUAL=prod_yyy
```

### 3.2 Variables Vercel (Preview)
- Dashboard Vercel → Settings → Environment Variables
- Scope: Preview only
- Agregar las 4 variables

### 3.3 Actualizar .env.example
```env
# Polar.sh
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
POLAR_PRODUCT_ID_MONTHLY=
POLAR_PRODUCT_ID_ANNUAL=
```

---

## Phase 4: Deploy & Test

**Tiempo estimado**: 2 horas

### 4.1 Deploy Preview
```bash
git add .
git commit -m "feat: polar.sh integration"
git push -u origin feature/polar-sh-implementation
```

### 4.2 Configurar Webhook URL en Polar
- Actualizar URL con la preview URL real de Vercel

### 4.3 Ejecutar Test Suite
- Ver `03_TESTING_PLAN.md`

### 4.4 Fix Issues
- Debug webhook si es necesario
- Verificar logs de Vercel

---

## Phase 5: Production Release

**Tiempo estimado**: 1 hora

Ver `04_PRODUCTION_CHECKLIST.md` para detalles completos.

### 5.1 Crear Production Org en Polar
### 5.2 Crear Productos Reales
### 5.3 Configurar Webhook Producción
### 5.4 Actualizar Env Vars en Vercel (Production)
### 5.5 Deploy a main
### 5.6 Verificar primer pago real (opcional - $5 test)

---

## Timeline Estimado

| Phase | Tiempo | Dependencias |
|-------|--------|--------------|
| Phase 0 | 30 min | - |
| Phase 1 | 1 hora | Phase 0 |
| Phase 2 | 1.5 horas | Phase 1 |
| Phase 3 | 30 min | Phase 0 |
| Phase 4 | 2 horas | Phase 1, 2, 3 |
| Phase 5 | 1 hora | Phase 4 completado exitosamente |

**Total**: ~6.5 horas

---

## Rollback Plan

Si algo falla en producción:

1. **Revertir código**: `git revert` del merge commit
2. **Desactivar webhook** en Polar dashboard
3. **Usuarios afectados**: Contactar manualmente si hubo cobros
4. **BD**: Los cambios en profesores son reversibles manualmente

---

## Definition of Done

- [ ] Webhook recibe y procesa eventos correctamente
- [ ] Checkout modal funciona en página Mi Plan
- [ ] Usuario puede upgrade de Free a Plus
- [ ] BD se actualiza con polar_customer_id y polar_subscription_id
- [ ] Usuario puede cancelar desde Polar portal
- [ ] Cancelación actualiza status en BD
- [ ] Al expirar, usuario vuelve a Free
- [ ] Logs adecuados para debugging
- [ ] Documentación actualizada
