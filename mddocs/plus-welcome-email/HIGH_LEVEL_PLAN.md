# Plus Welcome Email - Plan de Alto Nivel

## Objetivo

Enviar un correo de bienvenida personalizado cuando un usuario se suscribe al plan PLUS, detallando las ventajas obtenidas en el idioma preferido del usuario.

## Alcance

| Email Type | Incluido | Notas |
|------------|----------|-------|
| Welcome Plus | ✅ | Se envia al completar suscripcion |
| Subscription Cancelled | ❌ | Fase posterior |
| Subscription Expired | ❌ | Fase posterior |

## Locales Soportados

- `es` (default)
- `en`
- `fr`
- `pt`

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                     POLAR WEBHOOK                               │
│         onSubscriptionCreated → API Route                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │ 
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│           apps/web/api/webhooks/polar/route.ts                  │
│                                                                 │
│  1. Recibe evento subscription.created                          │
│  2. Actualiza profesor a tier: plus                             │
│  3. Obtiene preferred_locale del usuario                        │
│  4. Llama a edge function send-plus-welcome                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ POST (internal call)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│       supabase/functions/send-plus-welcome/index.ts             │
│                                                                 │
│  1. Validar request (API key interna)                           │
│  2. Get locale desde payload                                    │
│  3. Render React Email template (welcome-plus)                  │
│  4. Send via Resend API                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Contenido del Email

### Ventajas PLUS a comunicar:

| Ventaja | ES | EN |
|---------|----|----|
| AI Generations | Generaciones AI ilimitadas | Unlimited AI generations |
| Scans | Escaneos ilimitados | Unlimited scans |
| Export | Exportar PDF y LaTeX | Export to PDF and LaTeX |
| Support | Soporte prioritario | Priority support |
| Bulk Ops | Operaciones masivas (Pronto) | Bulk operations (Coming soon) |

### Estructura del correo:

```
┌─────────────────────────────────────────────┐
│  ProfeVision                                │  ← H1, #bc152b (rojo), bold
├─────────────────────────────────────────────┤
│                                             │
│  🎉 Welcome to Plus!                        │
│                                             │
│  Thanks for upgrading...                    │
│                                             │
│  Your benefits now:                         │
│  ✓ Unlimited AI generations                 │
│  ✓ Unlimited scans                          │
│  ✓ PDF & LaTeX export                       │
│  ✓ Priority support                         │
│                                             │
│  Coming soon:                               │
│  ⏳ Bulk operations                          │
│                                             │
│  ┌─────────────────┐                        │
│  │  Go to Dashboard │                       │  ← #0b890f bg (verde)
│  └─────────────────┘                        │
│                                             │
│  Questions? Reply to this email.            │
│                                             │
├─────────────────────────────────────────────┤
│  ProfeVision © 2025                         │  ← #bc152b (rojo)
└─────────────────────────────────────────────┘
```

## Configuracion Email

| Campo | Valor |
|-------|-------|
| From | `hi@profevision.com` |
| Reply-To | `info@profevision.com` |
| Subject (ES) | "Bienvenido a ProfeVision Plus" |
| Subject (EN) | "Welcome to ProfeVision Plus" |

## Estructura de Archivos

```
supabase/functions/send-plus-welcome/
├── index.ts                      # Handler principal
├── _templates/
│   └── welcome-plus.tsx          # Template bienvenida Plus
└── _shared/
    └── (symlink o copia de base-layout y translations)

apps/web/app/api/webhooks/polar/
└── route.ts                      # Modificar para llamar send-plus-welcome
```

## Deteccion de Locale

1. Obtener `profesor_id` desde metadata del webhook
2. Query a Supabase: `auth.users` → `raw_user_meta_data.preferred_locale`
3. Fallback: `es`

```typescript
// En el webhook handler
const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profesorId);
const locale = authUser?.user?.user_metadata?.preferred_locale || 'es';
```

## Secrets Requeridos

```bash
# Ya existentes
RESEND_API_KEY=re_xxxxxxxxxxxx

# Nuevo (para validar llamadas internas)
SEND_PLUS_WELCOME_SECRET=<random string>
```

## Flujo de Datos

```
1. Usuario completa checkout en Polar
2. Polar envia webhook subscription.created
3. Webhook handler:
   a. Actualiza profesor.subscription_tier = 'plus'
   b. Obtiene email y locale del usuario
   c. POST a edge function send-plus-welcome
4. Edge function:
   a. Valida secret
   b. Renderiza template con locale
   c. Envia email via Resend
5. Usuario recibe correo de bienvenida
```

## Timeline Estimado

| Fase | Tiempo |
|------|--------|
| Template React Email | 30 min |
| Traducciones (4 idiomas) | 20 min |
| Edge Function | 30 min |
| Modificar Polar webhook | 15 min |
| Testing Local | 20 min |
| Deploy | 10 min |
| **Total** | ~2 hrs |

## Decisiones Tecnicas

| Decision | Eleccion | Razon |
|----------|----------|-------|
| Edge function separada | Si | No mezclar auth emails con marketing |
| Llamada desde webhook | Directa | No necesita cola, es inmediato |
| Traducciones | JSON embebido | Consistente con send-email |
| Validacion | API secret | Simple, suficiente para llamada interna |

## Consideraciones

1. **Idempotencia**: El email solo se envia en `subscription.created`, no en `subscription.active`
2. **Error handling**: Si falla el envio, loguear pero no fallar el webhook
3. **Rate limit**: No necesario, solo 1 email por suscripcion
4. **Testing**: Usar Resend test mode para desarrollo

## Preguntas Resueltas

- ¿Donde obtener locale? → `auth.users.raw_user_meta_data.preferred_locale`
- ¿Edge function nueva o extender existente? → Nueva, separar concerns
- ¿Cuando enviar? → Solo en `subscription.created`
