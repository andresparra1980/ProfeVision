# Polar.sh Implementation - Testing Plan

**Branch**: `feature/polar-sh-implementation`
**Fecha**: 2025-12-06
**Ambiente**: Polar Sandbox + Vercel Preview + Supabase Prod

---

## Pre-requisitos

- [ ] Polar Sandbox Organization creada
- [ ] Productos de prueba creados (Monthly + Annual)
- [ ] Webhook configurado apuntando a preview URL
- [ ] Env vars configuradas en Vercel Preview
- [ ] Deploy preview activo
- [ ] Usuario de prueba identificado en BD

---

## Test Cards (Polar usa Stripe bajo el capó)

| Número | Resultado |
|--------|-----------|
| `4242 4242 4242 4242` | Pago exitoso |
| `4000 0000 0000 0002` | Tarjeta declinada |
| `4000 0000 0000 9995` | Fondos insuficientes |
| `4000 0000 0000 3220` | Requiere 3D Secure |
| `4000 0025 0000 3155` | 3D Secure requerido siempre |

**Datos adicionales para test cards**:
- Fecha expiración: cualquier fecha futura (ej: 12/34)
- CVC: cualquier 3 dígitos (ej: 123)
- ZIP: cualquier código (ej: 12345)

---

## Test Suite

### 1. Checkout Flow Tests

#### 1.1 Checkout Exitoso - Plan Mensual
**Objetivo**: Verificar flujo completo de upgrade a Plus Monthly

**Pasos**:
1. Login con usuario de prueba (tier: free)
2. Navegar a `/dashboard/reports` (Mi Plan)
3. Verificar que muestra tier "Free"
4. Click en botón "Upgrade to Plus"
5. Seleccionar plan Mensual ($5/mes)
6. En modal Polar, ingresar:
   - Email: (debe coincidir con usuario)
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
7. Confirmar pago

**Resultado esperado**:
- [ ] Checkout completa sin errores
- [ ] Webhook recibido (verificar logs Vercel)
- [ ] BD actualizada:
  - `subscription_tier` = 'plus'
  - `subscription_status` = 'active'
  - `polar_customer_id` tiene valor
  - `polar_subscription_id` tiene valor
- [ ] UI refleja nuevo tier
- [ ] Toast de éxito mostrado

---

#### 1.2 Checkout Exitoso - Plan Anual
**Objetivo**: Verificar upgrade a Plus Annual

**Pasos**: Similar a 1.1 pero seleccionando plan Anual ($50/año)

**Resultado esperado**: Mismo que 1.1

---

#### 1.3 Checkout Fallido - Tarjeta Declinada
**Objetivo**: Verificar manejo de error de pago

**Pasos**:
1. Iniciar checkout
2. Usar card: `4000 0000 0000 0002`
3. Intentar pagar

**Resultado esperado**:
- [ ] Error mostrado en modal Polar
- [ ] Usuario puede reintentar con otra tarjeta
- [ ] BD NO modificada
- [ ] No se envía webhook

---

#### 1.4 Checkout Fallido - Fondos Insuficientes
**Objetivo**: Verificar manejo de fondos insuficientes

**Pasos**:
1. Iniciar checkout
2. Usar card: `4000 0000 0000 9995`
3. Intentar pagar

**Resultado esperado**:
- [ ] Error específico mostrado
- [ ] BD NO modificada

---

#### 1.5 Checkout con 3D Secure
**Objetivo**: Verificar flujo 3D Secure

**Pasos**:
1. Iniciar checkout
2. Usar card: `4000 0000 0000 3220`
3. Completar challenge 3D Secure (auto-aprobado en sandbox)
4. Confirmar pago

**Resultado esperado**:
- [ ] 3D Secure challenge aparece
- [ ] Después de completar, pago exitoso
- [ ] BD actualizada correctamente

---

#### 1.6 Checkout Cancelado por Usuario
**Objetivo**: Verificar que cerrar modal no afecta nada

**Pasos**:
1. Iniciar checkout
2. Cerrar modal sin completar pago

**Resultado esperado**:
- [ ] Modal cierra correctamente
- [ ] BD NO modificada
- [ ] Usuario puede reiniciar checkout

---

### 2. Webhook Tests

#### 2.1 Webhook - Signature Verification
**Objetivo**: Verificar que rechaza webhooks sin firma válida

**Pasos**:
1. Enviar POST a `/api/webhooks/polar` sin header de firma
2. Enviar POST con firma inválida

**Resultado esperado**:
- [ ] Retorna 401 Unauthorized
- [ ] Log de error registrado
- [ ] BD NO modificada

**Cómo probar**:
```bash
curl -X POST https://[preview-url]/api/webhooks/polar \
  -H "Content-Type: application/json" \
  -d '{"type": "subscription.created"}'
```

---

#### 2.2 Webhook - Evento Desconocido
**Objetivo**: Verificar manejo de eventos no suscritos

**Pasos**: Enviar evento de tipo no manejado (si es posible desde Polar dashboard)

**Resultado esperado**:
- [ ] Retorna 200 OK (acknowledge)
- [ ] Log indica evento ignorado
- [ ] BD NO modificada

---

#### 2.3 Webhook - Usuario No Encontrado
**Objetivo**: Verificar manejo cuando email no existe en BD

**Pasos**:
1. Hacer checkout con email que no existe en auth.users
2. Verificar webhook

**Resultado esperado**:
- [ ] Webhook retorna 200 (para evitar retries)
- [ ] Log de warning con email no encontrado
- [ ] BD NO modificada
- [ ] Posible notificación/alerta para admin

---

#### 2.4 Webhook - Idempotencia
**Objetivo**: Verificar que procesar mismo evento 2 veces no causa problemas

**Pasos**:
1. Completar checkout exitoso
2. Desde Polar dashboard, re-enviar el webhook

**Resultado esperado**:
- [ ] Segunda ejecución no falla
- [ ] BD no tiene cambios duplicados
- [ ] Log indica evento ya procesado (opcional)

---

### 3. Subscription Lifecycle Tests

#### 3.1 Cancelación de Suscripción
**Objetivo**: Verificar flujo de cancelación

**Pre-requisitos**: Usuario con tier Plus activo

**Pasos**:
1. Ir a `/dashboard/reports`
2. Click "Gestionar suscripción" (o similar)
3. Redirige a Polar Customer Portal
4. Cancelar suscripción desde Polar
5. Verificar webhook `subscription.canceled`

**Resultado esperado**:
- [ ] Webhook recibido
- [ ] BD actualizada:
  - `subscription_status` = 'cancelled'
  - `subscription_tier` = 'plus' (mantiene hasta expirar)
- [ ] UI muestra estado "Cancela al final del periodo"

---

#### 3.2 Expiración de Suscripción
**Objetivo**: Verificar downgrade automático al expirar

**Nota**: Difícil de probar en sandbox porque requiere esperar fin de periodo. Verificar con Polar si hay forma de acelerar.

**Resultado esperado** (cuando ocurra):
- [ ] Webhook `subscription.revoked` recibido
- [ ] BD actualizada:
  - `subscription_tier` = 'free'
  - `subscription_status` = 'expired'
- [ ] Usuario pierde beneficios Plus

---

#### 3.3 Reactivación de Suscripción
**Objetivo**: Verificar que usuario puede re-suscribirse

**Pre-requisitos**: Usuario que fue Plus y ahora es Free

**Pasos**:
1. Completar nuevo checkout

**Resultado esperado**:
- [ ] Checkout exitoso
- [ ] BD actualizada a Plus nuevamente
- [ ] `polar_subscription_id` nuevo (diferente al anterior)

---

### 4. UI/UX Tests

#### 4.1 Página Mi Plan - Usuario Free
**Pasos**: Navegar a `/dashboard/reports` como usuario Free

**Verificar**:
- [ ] Muestra badge "Free"
- [ ] Muestra uso del mes (AI generations, scans)
- [ ] Muestra cards Free vs Plus
- [ ] Botón "Upgrade to Plus" visible
- [ ] NO muestra "Gestionar suscripción"

---

#### 4.2 Página Mi Plan - Usuario Plus
**Pasos**: Navegar a `/dashboard/reports` como usuario Plus

**Verificar**:
- [ ] Muestra badge "Plus"
- [ ] Muestra uso ilimitado (o no muestra límites)
- [ ] Card Plus marcada como "Plan Actual"
- [ ] NO muestra botón "Upgrade"
- [ ] Muestra link "Gestionar suscripción"

---

#### 4.3 Página Mi Plan - Usuario Grandfathered
**Pasos**: Navegar a `/dashboard/reports` como usuario Grandfathered

**Verificar**:
- [ ] Muestra badge "Early Adopter" (o similar)
- [ ] Muestra warning de beneficio temporal
- [ ] Puede hacer upgrade a Plus (para "asegurar" beneficios)

---

#### 4.4 Toggle Mensual/Anual
**Pasos**: En página Mi Plan, toggle entre mensual y anual

**Verificar**:
- [ ] Precios cambian correctamente ($5/mes vs $50/año)
- [ ] Badge "Ahorra 17%" visible en anual
- [ ] Checkout usa producto correcto según selección

---

### 5. Edge Cases

#### 5.1 Múltiples Tabs
**Objetivo**: Verificar comportamiento con múltiples tabs

**Pasos**:
1. Abrir Mi Plan en 2 tabs
2. Hacer upgrade en tab 1
3. Verificar tab 2

**Resultado esperado**:
- [ ] Tab 2 eventualmente refleja nuevo tier
- [ ] No hay errores de estado inconsistente

---

#### 5.2 Checkout Timeout
**Objetivo**: Verificar comportamiento si checkout toma mucho tiempo

**Pasos**:
1. Iniciar checkout
2. Esperar sin completar (5+ minutos)
3. Intentar completar

**Resultado esperado**:
- [ ] Checkout maneja timeout gracefully
- [ ] Usuario puede reiniciar

---

#### 5.3 Email Mismatch
**Objetivo**: Verificar si usuario cambia email en checkout

**Pasos**:
1. Iniciar checkout con email pre-llenado
2. Cambiar a email diferente
3. Completar pago

**Resultado esperado**:
- [ ] Documentar comportamiento (¿permite Polar cambiar email?)
- [ ] Si permite, webhook usa email nuevo
- [ ] Puede resultar en usuario no encontrado

---

### 6. Performance Tests

#### 6.1 Webhook Response Time
**Objetivo**: Verificar que webhook responde rápido

**Métrica**: Webhook debe responder en < 5 segundos

**Verificar en logs**:
- [ ] Tiempo de procesamiento del webhook
- [ ] No hay timeouts

---

### 7. Security Tests

#### 7.1 Webhook sin HTTPS
**Objetivo**: Verificar que solo acepta HTTPS en producción

**Nota**: Vercel preview ya es HTTPS, esto es más relevante para prod.

---

#### 7.2 Rate Limiting (si aplica)
**Objetivo**: Verificar protección contra flood de webhooks

**Nota**: Polar tiene su propio rate limiting, pero verificar comportamiento.

---

## Test Results Template

| Test ID | Test Name | Status | Notes |
|---------|-----------|--------|-------|
| 1.1 | Checkout Mensual | ⬜ | |
| 1.2 | Checkout Anual | ⬜ | |
| 1.3 | Tarjeta Declinada | ⬜ | |
| 1.4 | Fondos Insuficientes | ⬜ | |
| 1.5 | 3D Secure | ⬜ | |
| 1.6 | Checkout Cancelado | ⬜ | |
| 2.1 | Webhook Signature | ⬜ | |
| 2.2 | Evento Desconocido | ⬜ | |
| 2.3 | Usuario No Encontrado | ⬜ | |
| 2.4 | Idempotencia | ⬜ | |
| 3.1 | Cancelación | ⬜ | |
| 3.2 | Expiración | ⬜ | |
| 3.3 | Reactivación | ⬜ | |
| 4.1 | UI Free | ⬜ | |
| 4.2 | UI Plus | ⬜ | |
| 4.3 | UI Grandfathered | ⬜ | |
| 4.4 | Toggle Billing | ⬜ | |
| 5.1 | Múltiples Tabs | ⬜ | |
| 5.2 | Checkout Timeout | ⬜ | |
| 5.3 | Email Mismatch | ⬜ | |
| 6.1 | Webhook Performance | ⬜ | |

**Legend**: ⬜ Pending | ✅ Pass | ❌ Fail | ⏭️ Skipped

---

## Debugging Tips

### Ver logs de webhook en Vercel
```
Vercel Dashboard → Project → Deployments → [Preview] → Functions → api/webhooks/polar
```

### Ver eventos en Polar
```
Polar Dashboard → Webhooks → [Endpoint] → Events
```

### Verificar BD manualmente
```sql
SELECT id, subscription_tier, subscription_status, 
       polar_customer_id, polar_subscription_id
FROM profesores
WHERE id = '[user-id]';
```

### Re-enviar webhook desde Polar
```
Polar Dashboard → Webhooks → [Endpoint] → Events → [Event] → Resend
```
