# Polar.sh Implementation - Production Checklist

**Branch**: `feature/polar-sh-implementation`
**Fecha**: 2025-12-06

---

## Pre-requisitos para Producción

- [ ] Todos los tests de `03_TESTING_PLAN.md` pasaron en sandbox
- [ ] Código revisado y aprobado
- [ ] Sin bugs conocidos bloqueantes
- [ ] Documentación actualizada

---

## Phase 1: Polar.sh Production Setup

### 1.1 Crear Production Organization

- [ ] Polar Dashboard → Organizations → Create Organization
- [ ] Nombre: "ProfeVision" (nombre real)
- [ ] Tipo: Production (NO sandbox)
- [ ] Completar verificación de identidad si Polar lo requiere

### 1.2 Configurar Datos de Negocio

- [ ] Settings → Business Details
- [ ] Nombre legal de la empresa
- [ ] Dirección
- [ ] Tax ID (si aplica)
- [ ] Cuenta bancaria para payouts

### 1.3 Crear Productos de Producción

#### Producto 1: ProfeVision Plus Monthly
- [ ] Products → Create Product
- [ ] Nombre: "ProfeVision Plus"
- [ ] Descripción: "Suscripción mensual a ProfeVision Plus"
- [ ] Tipo: Subscription
- [ ] Precio: $5.00 USD / month
- [ ] Copiar Product ID → `POLAR_PRODUCT_ID_MONTHLY`

#### Producto 2: ProfeVision Plus Annual
- [ ] Products → Create Product
- [ ] Nombre: "ProfeVision Plus (Anual)"
- [ ] Descripción: "Suscripción anual a ProfeVision Plus - Ahorra 17%"
- [ ] Tipo: Subscription
- [ ] Precio: $50.00 USD / year
- [ ] Copiar Product ID → `POLAR_PRODUCT_ID_ANNUAL`

### 1.4 Configurar Webhook de Producción

- [ ] Settings → Webhooks → Add Endpoint
- [ ] URL: `https://profevision.com/api/webhooks/polar`
  - (o tu dominio de producción)
- [ ] Events:
  - [x] `subscription.created`
  - [x] `subscription.updated`
  - [x] `subscription.canceled`
  - [x] `subscription.revoked`
- [ ] Copiar Webhook Secret → `POLAR_WEBHOOK_SECRET`

### 1.5 Generar Access Token de Producción

- [ ] Settings → API Keys → Create Token
- [ ] Nombre: "ProfeVision Production"
- [ ] Permisos: (los que sean necesarios)
- [ ] Copiar token → `POLAR_ACCESS_TOKEN`

### 1.6 Recopilar Variables de Producción

```env
# Production Values
POLAR_ACCESS_TOKEN=polar_pat_xxx  # pat = production access token
POLAR_WEBHOOK_SECRET=whsec_xxx
POLAR_PRODUCT_ID_MONTHLY=prod_xxx
POLAR_PRODUCT_ID_ANNUAL=prod_yyy
```

---

## Phase 2: Vercel Production Configuration

### 2.1 Configurar Environment Variables

- [ ] Vercel Dashboard → ProfeVision → Settings → Environment Variables
- [ ] Scope: **Production** (importante: NO Preview)

| Variable | Value | Encrypted |
|----------|-------|-----------|
| `POLAR_ACCESS_TOKEN` | `polar_pat_xxx` | Yes |
| `POLAR_WEBHOOK_SECRET` | `whsec_xxx` | Yes |
| `POLAR_PRODUCT_ID_MONTHLY` | `prod_xxx` | No |
| `POLAR_PRODUCT_ID_ANNUAL` | `prod_yyy` | No |

### 2.2 Verificar Otras Variables

- [ ] `NEXT_PUBLIC_APP_URL` = `https://profevision.com`
- [ ] Supabase vars correctas para prod

---

## Phase 3: Merge & Deploy

### 3.1 Preparar Merge

```bash
# Actualizar branch
git checkout feature/polar-sh-implementation
git pull origin main
git push

# Resolver conflictos si hay
```

### 3.2 Create Pull Request

- [ ] Crear PR: `feature/polar-sh-implementation` → `main`
- [ ] Título: "feat: Polar.sh payment integration"
- [ ] Descripción con resumen de cambios
- [ ] Review del código

### 3.3 Merge

- [ ] Aprobar PR
- [ ] Merge to main
- [ ] Verificar que Vercel inicia deploy automático

### 3.4 Monitorear Deploy

- [ ] Vercel Dashboard → Deployments
- [ ] Esperar que deploy complete sin errores
- [ ] Verificar build logs

---

## Phase 4: Post-Deploy Verification

### 4.1 Verificar Webhook Endpoint

```bash
# Health check (debería retornar 405 Method Not Allowed para GET)
curl -I https://profevision.com/api/webhooks/polar
```

### 4.2 Verificar Página Mi Plan

- [ ] Navegar a `/dashboard/reports`
- [ ] Verificar que carga sin errores
- [ ] Verificar que botón Upgrade está visible

### 4.3 Test de Integración (Opcional pero Recomendado)

Si quieres verificar con un pago real de $5:

- [ ] Login con tu cuenta
- [ ] Ir a Mi Plan
- [ ] Click Upgrade
- [ ] Completar pago con tarjeta real
- [ ] Verificar webhook en logs de Vercel
- [ ] Verificar BD actualizada
- [ ] Cancelar suscripción inmediatamente desde Polar portal (para no cobrar siguiente mes)

---

## Phase 5: Monitoring Setup

### 5.1 Alertas de Errores

- [ ] Configurar alertas en Vercel para errores en `/api/webhooks/polar`
- [ ] O usar servicio de monitoring (Sentry, etc.)

### 5.2 Dashboard de Métricas (Opcional)

- [ ] Polar Dashboard → Analytics
- [ ] Verificar que muestra suscripciones
- [ ] Configurar notificaciones de nuevas suscripciones

### 5.3 Logs

- [ ] Verificar que logs de webhook son accesibles
- [ ] Configurar retención de logs si es necesario

---

## Phase 6: Documentation & Communication

### 6.1 Actualizar Documentación

- [ ] README.md si es necesario
- [ ] `.env.example` con nuevas variables
- [ ] Cualquier doc interno

### 6.2 Comunicar a Usuarios (si aplica)

- [ ] Anuncio de nueva feature de suscripción
- [ ] Actualizar página de pricing pública
- [ ] Email a usuarios grandfathered (opcional)

---

## Rollback Plan

### Si algo falla después del deploy:

1. **Desactivar Webhook en Polar**
   - Polar Dashboard → Webhooks → Disable endpoint
   - Esto previene más eventos mientras solucionas

2. **Revertir Código (si es necesario)**
   ```bash
   git revert [merge-commit-hash]
   git push origin main
   ```

3. **Usuarios Afectados**
   - Si hubo cobros, contactar soporte de Polar para refunds
   - Actualizar BD manualmente si es necesario

4. **Comunicar**
   - Notificar a usuarios afectados
   - Documentar el incidente

---

## Emergency Contacts

- **Polar Support**: support@polar.sh
- **Polar Status**: https://status.polar.sh
- **Vercel Support**: (tu plan de soporte)

---

## Checklist Final

| Item | Status |
|------|--------|
| Polar Production Org creada | ⬜ |
| Productos creados | ⬜ |
| Webhook configurado | ⬜ |
| Access Token generado | ⬜ |
| Env vars en Vercel | ⬜ |
| PR creado y aprobado | ⬜ |
| Merged a main | ⬜ |
| Deploy exitoso | ⬜ |
| Webhook endpoint responde | ⬜ |
| UI funciona correctamente | ⬜ |
| Test de pago real (opcional) | ⬜ |
| Monitoring configurado | ⬜ |
| Documentación actualizada | ⬜ |

---

## Post-Launch Monitoring (Primeras 48 horas)

### Día 1
- [ ] Verificar logs de webhook cada pocas horas
- [ ] Verificar Polar dashboard por nuevas suscripciones
- [ ] Responder rápido a cualquier error

### Día 2
- [ ] Review de métricas
- [ ] Verificar que no hay errores recurrentes
- [ ] Documentar cualquier issue encontrado

### Semana 1
- [ ] Review completo de la integración
- [ ] Ajustes basados en feedback
- [ ] Considerar mejoras (ej: emails de bienvenida)

---

**Fecha de Go-Live Planeada**: ________________

**Responsable**: ________________

**Aprobado por**: ________________
