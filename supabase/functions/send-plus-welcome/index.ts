import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";

import { WelcomePlusEmail } from "./_templates/welcome-plus.tsx";
import { getTranslation } from "./_translations/index.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const internalSecret = Deno.env.get("SEND_PLUS_WELCOME_SECRET") as string;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Validar secret interno
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${internalSecret}`) {
    console.warn(`[send-plus-welcome] Unauthorized request`);
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { email, locale, dashboardUrl } = await req.json();

    if (!email) {
      console.error(`[send-plus-welcome] Missing email in request`);
      return new Response(JSON.stringify({ error: "email required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supportedLocales = ["es", "en", "fr", "pt"];
    const finalLocale = supportedLocales.includes(locale) ? locale : "es";

    console.log(`[send-plus-welcome] Processing welcome email for ${email} (locale: ${finalLocale})`);

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
      console.error(`[send-plus-welcome] Resend error:`, error);
      throw error;
    }

    console.log(`[send-plus-welcome] Welcome Plus email sent successfully to ${email}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[send-plus-welcome] Error sending welcome plus email:`, errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
