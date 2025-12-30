import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";

import { ConfirmSignupEmail } from "./_templates/confirm-signup.tsx";
import { ResetPasswordEmail } from "./_templates/reset-password.tsx";
import { getTranslation } from "./_translations/index.ts"; 

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;

// Rate limiting: 5 emails per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const WINDOW_MS = 60000;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("not allowed", { status: 400 });
  }

  // Rate Limiting
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  const limitData = rateLimitMap.get(ip) || { count: 0, resetAt: now + WINDOW_MS };

  if (now > limitData.resetAt) {
    limitData.count = 0;
    limitData.resetAt = now + WINDOW_MS;
  }

  if (limitData.count >= RATE_LIMIT) {
    console.warn(`Rate limit exceeded for IP: ${ip}`);
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  limitData.count++;
  rateLimitMap.set(ip, limitData);

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  const wh = new Webhook(hookSecret);

  try {
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: {
        email: string;
        user_metadata: { preferred_locale?: string; [key: string]: any };
      };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
        site_url: string;
        token_new: string;
        token_hash_new: string;
      };
    };

    console.log(`Processing ${email_action_type} for ${user.email}`);

    // Determine locale
    const supportedLocales = ["es", "en", "fr", "pt"];
    let locale = user.user_metadata?.preferred_locale;

    // Try to get locale from redirect_to if not present or to ensure freshness
    if (redirect_to) {
        try {
            const url = new URL(redirect_to);
            const urlLocale = url.searchParams.get("locale");
            if (urlLocale && supportedLocales.includes(urlLocale)) {
                locale = urlLocale;
            }
        } catch (e) {
            // ignore invalid URL
        }
    }

    if (!locale || !supportedLocales.includes(locale)) {
      locale = "es";
    }

    const t = getTranslation(locale);
    
    let html: string | null = null;
    let subject = "";

    if (email_action_type === "signup") {
        html = await renderAsync(
            React.createElement(ConfirmSignupEmail, {
                token,
                token_hash,
                redirect_to,
                supabase_url: supabaseUrl,
                translation: t.confirmSignup,
                commonTranslation: t.common,
            })
        );
        subject = t.confirmSignup.subject;
    } else if (email_action_type === "recovery") {
        html = await renderAsync(
            React.createElement(ResetPasswordEmail, {
                token,
                token_hash,
                redirect_to,
                supabase_url: supabaseUrl,
                translation: t.resetPassword,
                commonTranslation: t.common,
            })
        );
        subject = t.resetPassword.subject;
    } else {
        console.log(`Email action type ${email_action_type} not handled`);
        return new Response(JSON.stringify({ message: "Action not handled" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }

    if (html && subject) {
       const { error } = await resend.emails.send({
        from: "ProfeVision <hi@profevision.com>",
        reply_to: "info@profevision.com",
        to: [user.email],
        subject: subject,
        html: html,
      });
      if (error) {
          console.error("Resend error:", error);
          throw error;
      }
    }

  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({
        error: {
          http_code: (error as any).code || 500,
          message: (error as any).message || "Internal Server Error",
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
