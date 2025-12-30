# i18n Auth Emails - Plan de Alto Nivel

## Objetivo

Reemplazar los email templates nativos de Supabase por un sistema custom que envíe correos de autenticación en el idioma del usuario usando React Email + Resend.

## Alcance

| Email Type | Incluido | Notas |
|------------|----------|-------|
| Confirm Signup | ✅ | Confirmación de registro |
| Reset Password | ✅ | Recuperación de contraseña |
| Magic Link | ❌ | Fase posterior |
| Email Change | ❌ | No implementar |

## Locales Soportados

- `es` (default)
- `en`
- `fr`
- `pt`

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE AUTH                               │
│         Send Email Hook → Edge Function                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │ POST (signed webhook)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│           supabase/functions/send-email/index.ts                │
│                                                                 │
│  1. Rate limit check (in-memory, 5 emails/min per IP)           │
│  2. Verify webhook signature (standardwebhooks)                 │
│  3. Extract email_action_type (signup | recovery)               │
│  4. Get locale: user_metadata.preferred_locale || 'es'          │
│  5. Render React Email template                                 │
│  6. Send via Resend API                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Configuración Email

| Campo | Valor |
|-------|-------|
| From | `hi@profevision.com` |
| Reply-To | `info@profevision.com` |
| Branding | "ProfeVision" texto en `#bc152b` (rojo/secondary) |
| Botones | `#0b890f` (verde/primary) |

## Estructura de Archivos

```
supabase/functions/send-email/
├── index.ts                      # Handler principal
├── _templates/
│   ├── base-layout.tsx           # Layout compartido (header/footer)
│   ├── confirm-signup.tsx        # Template confirmación
│   └── reset-password.tsx        # Template recovery
└── _translations/
    ├── es.json
    ├── en.json
    ├── fr.json
    └── pt.json
```

## Detección de Locale

1. Edge function extrae `user.user_metadata.preferred_locale`
2. Fallback: `es`

**Modificación requerida en apps/web:**
- `signUpWithRedirect()` debe guardar `preferred_locale` en `user_metadata`

## Colores (Light Mode)

| Variable | Hex | Uso |
|----------|-----|-----|
| secondary | `#bc152b` | Logo "ProfeVision" (header/footer) |
| primary | `#0b890f` | Botones, links |
| text | `#040316` | Texto principal |
| background | `#e8ecee` | Fondo body |
| card | `#f8f9fa` | Fondo contenedor |
| muted | `#64748b` | Texto secundario/footer |
| border | `#e9e6e0` | Bordes |

## Diseño Email

```
┌─────────────────────────────────────────────┐
│  ProfeVision                                │  ← H1, #bc152b (rojo), bold
├─────────────────────────────────────────────┤
│                                             │
│  Heading                                    │
│                                             │
│  Body text...                               │
│                                             │
│  ┌─────────────────┐                        │
│  │  BUTTON         │                        │  ← #0b890f bg (verde)
│  └─────────────────┘                        │
│                                             │
│  Código alternativo: 123456                 │
│                                             │
│  Footer text...                             │
│                                             │
├─────────────────────────────────────────────┤
│  ProfeVision © 2025                         │  ← #bc152b (rojo)
└─────────────────────────────────────────────┘
```

## Secrets Requeridos

```bash
RESEND_API_KEY=re_xxxxxxxxxxxx
SEND_EMAIL_HOOK_SECRET=<generado en Supabase dashboard>
```

## Workflow de Desarrollo

1. Sistema de emails viejo sigue activo durante desarrollo
2. Hook solo se activa al configurarlo en Supabase Dashboard
3. Test local con `supabase functions serve`
4. Deploy con `supabase functions deploy send-email --no-verify-jwt`
5. Activar hook cuando esté listo para producción

## Timeline Estimado

| Fase | Tiempo |
|------|--------|
| Edge Function Base | 30 min |
| Traducciones | 15 min |
| Templates | 45 min |
| Resend Integration | 15 min |
| apps/web changes | 10 min |
| Testing Local | 20 min |
| Deploy & Activate | 15 min |
| **Total** | ~2.5 hrs |

## Decisiones Técnicas

| Decisión | Elección | Razón |
|----------|----------|-------|
| Rate limit | In-memory Map | Simple, suficiente para edge stateless |
| Translations | Embedded JSON | Deno no puede importar de apps/web |
| Templates | React Email | Docs oficiales Supabase |
| Email provider | Resend | Ya configurado, dominio verificado |
