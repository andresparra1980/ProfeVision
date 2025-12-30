# i18n Auth Emails - Tareas de Ejecución

## FASE 1: Edge Function Base

### 1.1 Crear estructura de directorios
- [ ] `supabase/functions/send-email/index.ts`
- [ ] `supabase/functions/send-email/_templates/`
- [ ] `supabase/functions/send-email/_translations/`

### 1.2 Handler principal (index.ts)
- [ ] Import dependencies (standardwebhooks, resend, react-email)
- [ ] Verificar método POST
- [ ] Implementar rate limiting (Map en memoria, 5/min por IP)
- [ ] Verificar webhook signature
- [ ] Parsear payload (user, email_data)
- [ ] Router por `email_action_type`:
  - `signup` → confirm-signup template
  - `recovery` → reset-password template
- [ ] Error handling con respuestas JSON apropiadas

### 1.3 Rate Limiting
```typescript
// Estructura básica
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const WINDOW_MS = 60000; // 1 minuto
```

---

## FASE 2: Traducciones

### 2.1 Crear archivos de traducción

**es.json**
- [ ] `confirmSignup.subject`: "Confirma tu cuenta en ProfeVision"
- [ ] `confirmSignup.heading`: "¡Bienvenido a ProfeVision!"
- [ ] `confirmSignup.body`: "Gracias por registrarte..."
- [ ] `confirmSignup.button`: "Confirmar Email"
- [ ] `confirmSignup.otp`: "O usa este código: {token}"
- [ ] `confirmSignup.footer`: "Si no creaste esta cuenta..."
- [ ] `resetPassword.subject`: "Restablece tu contraseña"
- [ ] `resetPassword.heading`: "Restablecer Contraseña"
- [ ] `resetPassword.body`: "Recibimos una solicitud..."
- [ ] `resetPassword.button`: "Restablecer Contraseña"
- [ ] `resetPassword.otp`: "O usa este código: {token}"
- [ ] `resetPassword.footer`: "Si no solicitaste esto..."
- [ ] `common.expires`: "Este enlace expira en 24 horas."

**en.json**
- [ ] Traducir todas las claves al inglés

**fr.json**
- [ ] Traducir todas las claves al francés

**pt.json**
- [ ] Traducir todas las claves al portugués

### 2.2 Helper de traducciones
- [ ] Función `getTranslations(locale: string)`
- [ ] Interpolación de variables `{token}`, `{name}`
- [ ] Fallback a 'es' si locale no existe

---

## FASE 3: React Email Templates

### 3.1 Base Layout (_templates/base-layout.tsx)
- [ ] Html, Head, Preview, Body, Container components
- [ ] Header: "ProfeVision" en #0b890f, bold
- [ ] Footer: "ProfeVision © 2025" en #64748b
- [ ] Props: `preview`, `children`
- [ ] Estilos inline (colores de marca)

### 3.2 Confirm Signup Template
- [ ] Importar base-layout
- [ ] Props: `token`, `token_hash`, `redirect_to`, `translations`, `supabaseUrl`
- [ ] Heading dinámico
- [ ] Body text
- [ ] Botón con link de verificación:
  ```
  ${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=signup&redirect_to=${redirect_to}
  ```
- [ ] Código OTP alternativo
- [ ] Footer con disclaimer

### 3.3 Reset Password Template
- [ ] Misma estructura que confirm-signup
- [ ] Link de verificación con `type=recovery`
- [ ] Textos específicos de reset

### 3.4 Estilos compartidos
```typescript
const styles = {
  secondary: '#bc152b',  // Logo "ProfeVision"
  primary: '#0b890f',    // Botones
  text: '#040316',
  background: '#e8ecee',
  card: '#f8f9fa',
  muted: '#64748b',
  border: '#e9e6e0',
};
```

---

## FASE 4: Integración Resend

### 4.1 Configurar cliente Resend
```typescript
import { Resend } from 'npm:resend@4.0.0';
const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
```

### 4.2 Envío de email
- [ ] Configurar `from: 'ProfeVision <hi@profevision.com>'`
- [ ] Configurar `replyTo: 'info@profevision.com'`
- [ ] `to: [user.email]`
- [ ] `subject` desde traducciones
- [ ] `html` desde React Email render

### 4.3 Error handling
- [ ] Capturar errores de Resend
- [ ] Logging de errores
- [ ] Respuesta apropiada al webhook

---

## FASE 5: Modificar apps/web

### 5.1 signUpWithRedirect (lib/supabase.ts)
```typescript
// Agregar preferred_locale a user_metadata
options: {
  data: {
    ...userData,
    preferred_locale: locale || 'es'  // NUEVO
  },
  emailRedirectTo: callbackUrl,
}
```

### 5.2 Verificar flujo existente
- [ ] Confirmar que `locale` se pasa correctamente desde formulario de registro
- [ ] Verificar que callback maneja locale correctamente

---

## FASE 6: Testing Local

### 6.1 Setup
```bash
# Terminal 1: Serve function
supabase functions serve send-email --env-file supabase/functions/.env

# Crear .env con:
RESEND_API_KEY=re_xxxx
SEND_EMAIL_HOOK_SECRET=test_secret
```

### 6.2 Test payloads

**Signup (es)**
```bash
curl -X POST http://localhost:54321/functions/v1/send-email \
  -H "Content-Type: application/json" \
  -H "webhook-id: test-id" \
  -H "webhook-timestamp: $(date +%s)" \
  -H "webhook-signature: v1,xxx" \
  -d '{
    "user": {
      "email": "test@example.com",
      "user_metadata": { "preferred_locale": "es" }
    },
    "email_data": {
      "token": "123456",
      "token_hash": "abc123",
      "redirect_to": "http://localhost:3000/es/dashboard",
      "email_action_type": "signup",
      "site_url": "http://localhost:3000"
    }
  }'
```

**Recovery (en)**
```bash
# Mismo curl pero con:
# - "preferred_locale": "en"
# - "email_action_type": "recovery"
```

### 6.3 Verificaciones
- [ ] Email llega correctamente
- [ ] Subject en idioma correcto
- [ ] Body en idioma correcto
- [ ] Links funcionan
- [ ] OTP se muestra
- [ ] Branding correcto

---

## FASE 7: Deploy & Activación

### 7.1 Configurar secrets en Supabase
```bash
# Crear supabase/functions/.env
RESEND_API_KEY=re_xxxxxxxxxxxx
SEND_EMAIL_HOOK_SECRET=<copiar de dashboard>

# Subir secrets
supabase secrets set --env-file supabase/functions/.env
```

### 7.2 Deploy function
```bash
supabase functions deploy send-email --no-verify-jwt
```

### 7.3 Activar hook en Supabase Dashboard
1. Auth → Hooks → Add Hook
2. Type: Send Email
3. Hook type: HTTPS
4. URL: `https://<project-ref>.supabase.co/functions/v1/send-email`
5. Generate Secret → copiar a .env
6. Create

### 7.4 Test en producción
- [ ] Registro nuevo usuario (es)
- [ ] Registro nuevo usuario (en)
- [ ] Reset password (es)
- [ ] Reset password (en)
- [ ] Verificar logs en Supabase Dashboard

---

## Checklist Final

- [ ] Edge function desplegada
- [ ] Hook configurado en dashboard
- [ ] Emails llegan en 4 idiomas
- [ ] Links de verificación funcionan
- [ ] Rate limiting activo
- [ ] Logs sin errores
- [ ] PR listo para merge

---

## Rollback

Si hay problemas:
1. Desactivar hook en Supabase Dashboard (Auth → Hooks → Delete)
2. Supabase volverá a usar emails nativos automáticamente
