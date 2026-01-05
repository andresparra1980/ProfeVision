# Plus Welcome Email - Tareas de Ejecucion

## FASE 1: Traducciones

### 1.1 Crear archivo de traducciones

**Estructura:**
```
supabase/functions/send-plus-welcome/_translations/
├── index.ts
├── es.json
├── en.json
├── fr.json
└── pt.json
```

### 1.2 Contenido es.json
```json
{
  "welcomePlus": {
    "subject": "Bienvenido a ProfeVision Plus",
    "heading": "¡Bienvenido a Plus!",
    "intro": "Gracias por actualizar a ProfeVision Plus. Ahora tienes acceso a todas las funciones premium.",
    "benefitsTitle": "Tus beneficios ahora:",
    "benefits": {
      "aiUnlimited": "Generaciones de examenes con IA ilimitadas",
      "scansUnlimited": "Escaneos de examenes ilimitados",
      "exportPdf": "Exportar examenes a PDF",
      "exportLatex": "Exportar examenes a LaTeX",
      "prioritySupport": "Soporte prioritario"
    },
    "comingSoonTitle": "Próximamente:",
    "comingSoon": {
      "bulkOperations": "Operaciones masivas"
    },
    "button": "Ir al Dashboard",
    "footer": "¿Tienes preguntas? Responde a este correo y te ayudamos."
  }
}
```

### 1.3 Contenido en.json
```json
{
  "welcomePlus": {
    "subject": "Welcome to ProfeVision Plus",
    "heading": "Welcome to Plus!",
    "intro": "Thanks for upgrading to ProfeVision Plus. You now have access to all premium features.",
    "benefitsTitle": "Your benefits now:",
    "benefits": {
      "aiUnlimited": "Unlimited AI exam generations",
      "scansUnlimited": "Unlimited exam scans",
      "exportPdf": "Export exams to PDF",
      "exportLatex": "Export exams to LaTeX",
      "prioritySupport": "Priority support"
    },
    "comingSoonTitle": "Coming soon:",
    "comingSoon": {
      "bulkOperations": "Bulk operations"
    },
    "button": "Go to Dashboard",
    "footer": "Have questions? Reply to this email and we'll help you."
  }
}
```

### 1.4 Contenido fr.json
```json
{
  "welcomePlus": {
    "subject": "Bienvenue sur ProfeVision Plus",
    "heading": "Bienvenue sur Plus!",
    "intro": "Merci d'avoir souscrit a ProfeVision Plus. Vous avez maintenant acces a toutes les fonctionnalites premium.",
    "benefitsTitle": "Vos avantages maintenant:",
    "benefits": {
      "aiUnlimited": "Generations d'examens IA illimitees",
      "scansUnlimited": "Scans d'examens illimites",
      "exportPdf": "Exporter les examens en PDF",
      "exportLatex": "Exporter les examens en LaTeX",
      "prioritySupport": "Support prioritaire"
    },
    "comingSoonTitle": "Bientot:",
    "comingSoon": {
      "bulkOperations": "Operations en masse"
    },
    "button": "Aller au tableau de bord",
    "footer": "Des questions? Repondez a cet email et nous vous aiderons."
  }
}
```

### 1.5 Contenido pt.json
```json
{
  "welcomePlus": {
    "subject": "Bem-vindo ao ProfeVision Plus",
    "heading": "Bem-vindo ao Plus!",
    "intro": "Obrigado por atualizar para o ProfeVision Plus. Agora voce tem acesso a todos os recursos premium.",
    "benefitsTitle": "Seus beneficios agora:",
    "benefits": {
      "aiUnlimited": "Geracoes de exames com IA ilimitadas",
      "scansUnlimited": "Digitalizacoes de exames ilimitadas",
      "exportPdf": "Exportar exames para PDF",
      "exportLatex": "Exportar exames para LaTeX",
      "prioritySupport": "Suporte prioritario"
    },
    "comingSoonTitle": "Em breve:",
    "comingSoon": {
      "bulkOperations": "Operacoes em massa"
    },
    "button": "Ir para o Painel",
    "footer": "Tem perguntas? Responda a este email e ajudaremos."
  }
}
```

### 1.6 Helper index.ts
- [ ] Funcion `getTranslation(locale: string)`
- [ ] Import dinamico de JSONs
- [ ] Fallback a 'es' si locale invalido

---

## FASE 2: React Email Template

### 2.1 Crear estructura
```
supabase/functions/send-plus-welcome/_templates/
├── base-layout.tsx     # Copiar de send-email
└── welcome-plus.tsx    # Nuevo template
```

### 2.2 Template welcome-plus.tsx

```tsx
import {
  Text,
  Button,
  Section,
  Heading,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { BaseLayout, styles } from "./base-layout.tsx";

interface WelcomePlusEmailProps {
  dashboardUrl: string;
  translation: {
    subject: string;
    heading: string;
    intro: string;
    benefitsTitle: string;
    benefits: {
      aiUnlimited: string;
      scansUnlimited: string;
      exportPdf: string;
      exportLatex: string;
      prioritySupport: string;
    };
    comingSoonTitle: string;
    comingSoon: {
      bulkOperations: string;
    };
    button: string;
    footer: string;
  };
}

export const WelcomePlusEmail = ({
  dashboardUrl,
  translation: t,
}: WelcomePlusEmailProps) => {
  const benefitsList = [
    t.benefits.aiUnlimited,
    t.benefits.scansUnlimited,
    t.benefits.exportPdf,
    t.benefits.exportLatex,
    t.benefits.prioritySupport,
  ];

  const comingSoonList = [
    t.comingSoon.bulkOperations,
  ];

  return (
    <BaseLayout preview={t.subject}>
      <Heading style={headingStyle}>{t.heading}</Heading>
      
      <Text style={textStyle}>{t.intro}</Text>
      
      <Text style={benefitsTitleStyle}>{t.benefitsTitle}</Text>
      
      <Section style={benefitsSection}>
        {benefitsList.map((benefit, i) => (
          <Text key={i} style={benefitItemStyle}>✓ {benefit}</Text>
        ))}
      </Section>

      <Text style={comingSoonTitleStyle}>{t.comingSoonTitle}</Text>
      
      <Section style={comingSoonSection}>
        {comingSoonList.map((item, i) => (
          <Text key={i} style={comingSoonItemStyle}>⏳ {item}</Text>
        ))}
      </Section>
      
      <Section style={buttonSection}>
        <Button style={buttonStyle} href={dashboardUrl}>
          {t.button}
        </Button>
      </Section>
      
      <Text style={footerStyle}>{t.footer}</Text>
    </BaseLayout>
  );
};

// Estilos
const headingStyle = {
  color: "#040316",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 24px",
};

const textStyle = {
  color: "#040316",
  fontSize: "16px",
  lineHeight: "1.5",
  margin: "0 0 16px",
};

const benefitsTitleStyle = {
  color: "#040316",
  fontSize: "16px",
  fontWeight: "600",
  margin: "24px 0 12px",
};

const benefitsSection = {
  margin: "0 0 24px",
};

const benefitItemStyle = {
  color: "#040316",
  fontSize: "15px",
  lineHeight: "1.8",
  margin: "0",
  paddingLeft: "8px",
};

const comingSoonTitleStyle = {
  color: "#64748b",
  fontSize: "15px",
  fontWeight: "600",
  margin: "24px 0 12px",
};

const comingSoonSection = {
  margin: "0 0 24px",
  padding: "12px",
  backgroundColor: "#f0f0f0",
  borderRadius: "4px",
};

const comingSoonItemStyle = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "1.8",
  margin: "0",
  paddingLeft: "8px",
  fontStyle: "italic" as const,
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const buttonStyle = {
  backgroundColor: "#0b890f",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const footerStyle = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "24px 0 0",
};

export default WelcomePlusEmail;
```

---

## FASE 3: Edge Function

### 3.1 Crear estructura
```bash
mkdir -p supabase/functions/send-plus-welcome/_templates
mkdir -p supabase/functions/send-plus-welcome/_translations
```

### 3.2 Handler principal (index.ts)

```typescript
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";

import { WelcomePlusEmail } from "./_templates/welcome-plus.tsx";
import { getTranslation } from "./_translations/index.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const internalSecret = Deno.env.get("SEND_PLUS_WELCOME_SECRET") as string;
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Validar secret interno
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${internalSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { email, locale, dashboardUrl } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "email required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supportedLocales = ["es", "en", "fr", "pt"];
    const finalLocale = supportedLocales.includes(locale) ? locale : "es";

    const t = getTranslation(finalLocale);

    const html = await renderAsync(
      React.createElement(WelcomePlusEmail, {
        dashboardUrl: dashboardUrl || "https://app.profevision.com/dashboard",
        translation: t.welcomePlus,
      })
    );

    const { error } = await resend.emails.send({
      from: "ProfeVision <hi@profevision.com>",
      reply_to: "info@profevision.com",
      to: [email],
      subject: t.welcomePlus.subject,
      html: html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log(`Welcome Plus email sent to ${email} (locale: ${finalLocale})`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending welcome plus email:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
```

---

## FASE 4: Modificar Polar Webhook

### 4.1 Actualizar route.ts

Agregar al final de `onSubscriptionCreated`:

```typescript
onSubscriptionCreated: async (payload) => {
  // ... codigo existente ...

  await updateProfesorSubscription(profesorId, { /* ... */ });

  // NUEVO: Enviar email de bienvenida
  try {
    // Obtener email y locale del usuario
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profesorId);
    
    if (authUser?.user?.email) {
      const locale = authUser.user.user_metadata?.preferred_locale || 'es';
      const dashboardUrl = `https://app.profevision.com/${locale}/dashboard`;

      // Llamar edge function
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-plus-welcome`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.SEND_PLUS_WELCOME_SECRET}`,
          },
          body: JSON.stringify({
            email: authUser.user.email,
            locale,
            dashboardUrl,
          }),
        }
      );

      if (!response.ok) {
        logger.warn("Failed to send welcome plus email:", await response.text());
      } else {
        logger.log(`Welcome Plus email sent to: ${authUser.user.email}`);
      }
    }
  } catch (emailError) {
    // No fallar el webhook si el email falla
    logger.error("Error sending welcome plus email:", emailError);
  }

  logger.log(`Upgrade a Plus completado para profesor: ${profesorId}`);
},
```

### 4.2 Agregar env variable
- [ ] Agregar `SEND_PLUS_WELCOME_SECRET` a `.env.local`
- [ ] Agregar a Vercel environment variables
- [ ] Agregar a Supabase secrets

---

## FASE 5: Testing

### 5.1 Verificar secrets en Supabase
Los secretos ya estan cargados en Supabase:
- [ ] `RESEND_API_KEY` ✓ (ya existe)
- [ ] `SEND_PLUS_WELCOME_SECRET` ✓ (ya existe)
- [ ] `SUPABASE_URL` ✓ (ya existe)

No necesario crear `.env` locales.

### 5.2 Test directo a edge function (una vez deployada)
```bash
# Obtener el secret de Supabase
SEND_PLUS_WELCOME_SECRET=<copiar de Supabase Dashboard>

curl -X POST https://<project-ref>.supabase.co/functions/v1/send-plus-welcome \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SEND_PLUS_WELCOME_SECRET" \
  -d '{
    "email": "test@example.com",
    "locale": "es",
    "dashboardUrl": "https://app.profevision.com/es/dashboard"
  }'
```

### 5.3 Test por idioma
- [ ] `locale: "es"` → Subject: "Bienvenido a ProfeVision Plus"
- [ ] `locale: "en"` → Subject: "Welcome to ProfeVision Plus"
- [ ] `locale: "fr"` → Subject: "Bienvenue sur ProfeVision Plus"
- [ ] `locale: "pt"` → Subject: "Bem-vindo ao ProfeVision Plus"

### 5.4 Test completo (desde webhook)
1. [ ] Crear test subscription en Polar (modo test)
2. [ ] Verificar que webhook se dispara
3. [ ] Verificar que email llega
4. [ ] Verificar contenido segun idioma

### 5.5 Verificaciones del Email
- [ ] Subject en idioma correcto
- [ ] Lista de beneficios completa (5 items)
- [ ] Seccion "Coming soon" con Bulk Operations
- [ ] Boton redirige al dashboard
- [ ] Colores de marca correctos (#0b890f botones, #bc152b header)
- [ ] Footer con copyright ProfeVision © 2025

---

## FASE 6: Deploy

### 6.1 Deploy edge function
```bash
supabase functions deploy send-plus-welcome --no-verify-jwt
```

### 6.2 Verificar secrets
Los secretos ya estan configurados:
- [ ] `RESEND_API_KEY` en Supabase ✓
- [ ] `SEND_PLUS_WELCOME_SECRET` en Supabase ✓
- [ ] `SEND_PLUS_WELCOME_SECRET` en Vercel (env vars) ✓

No requiere configuracion adicional.

### 6.3 Verificar en produccion
- [ ] Crear test subscription en Polar (modo test)
- [ ] Verificar que email llega a inbox
- [ ] Verificar logs en Supabase Dashboard → Functions

---

## Checklist Final

- [ ] Traducciones en 4 idiomas creadas
- [ ] Template React Email creado y testeado
- [ ] Edge function desplegada a Supabase
- [ ] Polar webhook modificado (apps/web)
- [ ] Secrets verificados en Supabase ✓ (ya existen)
- [ ] Test con suscripcion real en Polar exitoso
- [ ] Logs sin errores en Supabase Dashboard
- [ ] PR mergeado a main

---

## Rollback

Si hay problemas:
1. Comentar el bloque de envio de email en `webhooks/polar/route.ts`
2. El upgrade a Plus seguira funcionando, solo sin email de bienvenida
3. Deploy del webhook sin el codigo de email

---

## Archivos a Crear/Modificar

| Archivo | Accion | Notas |
|---------|--------|-------|
| `supabase/functions/send-plus-welcome/index.ts` | Crear | Handler principal |
| `supabase/functions/send-plus-welcome/_templates/base-layout.tsx` | Copiar | De send-email |
| `supabase/functions/send-plus-welcome/_templates/welcome-plus.tsx` | Crear | Template nuevo |
| `supabase/functions/send-plus-welcome/_translations/index.ts` | Crear | Helper de traducciones |
| `supabase/functions/send-plus-welcome/_translations/es.json` | Crear | Traducciones ES |
| `supabase/functions/send-plus-welcome/_translations/en.json` | Crear | Traducciones EN |
| `supabase/functions/send-plus-welcome/_translations/fr.json` | Crear | Traducciones FR |
| `supabase/functions/send-plus-welcome/_translations/pt.json` | Crear | Traducciones PT |
| `apps/web/app/api/webhooks/polar/route.ts` | Modificar | Agregar llamada a edge function |

**No requiere:**
- `.env.local` (secrets ya en Supabase)
- Cambios en Vercel (variable ya configurada)
