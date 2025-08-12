import { createServerClient } from "@supabase/ssr";
import type { Session, AuthError } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/utils/logger";


export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const requestOrigin = forwardedHost && forwardedProto
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const token = requestUrl.searchParams.get("token");
  const type = requestUrl.searchParams.get("type");
  const urlLocale = requestUrl.searchParams.get('locale');
  const flow = requestUrl.searchParams.get('flow') || requestUrl.searchParams.get('pv');
  
  // 🌍 Detectar idioma preferido del usuario
  const acceptLanguage = request.headers.get('accept-language');
  const preferredLocale = (urlLocale === 'en' || urlLocale === 'es')
    ? urlLocale
    : (acceptLanguage?.startsWith('en') ? 'en' : 'es');
  
  logger.auth("Auth callback received", {
    type,
    hasCode: !!code,
    preferredLocale,
    url: request.url,
  });
  
  // 🌍 Helper para construir URLs localizadas
  const buildLocalizedUrls = (loc: 'es' | 'en') => ({
    login: `/${loc}/auth/${loc === 'es' ? 'iniciar-sesion' : 'login'}`,
    emailConfirmed: `/${loc}/auth/${loc === 'es' ? 'email-confirmado' : 'email-confirmed'}`,
    updatePassword: `/${loc}/auth/${loc === 'es' ? 'actualizar-contrasena' : 'update-password'}`,
  });
  let localizedUrls = buildLocalizedUrls(preferredLocale as 'es' | 'en');

  // If neither code nor type is present, redirect to login
  if (!code && !type) {
    logger.auth("Missing both code and type, redirecting to login", { type });
    return NextResponse.redirect(new URL(localizedUrls.login, requestOrigin));
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string) {
            request.cookies.delete(name);
          },
        },
      }
    );

    let sessionResult: { data: { session: Session | null }, error: AuthError | null } = { data: { session: null }, error: null };
    if (code) {
      logger.auth("Attempting to exchange code for session", { type });
      sessionResult = await supabase.auth.exchangeCodeForSession(code);
      logger.auth("Exchange result", {
        success: !sessionResult.error,
        hasSession: !!sessionResult.data.session,
        errorMessage: sessionResult.error?.message,
      });
    } else {
      logger.auth("No code provided; skipping session exchange", { type, hasToken: !!token });
    }

    // 🌍 Re-resolver locale con user_metadata si existe
    try {
      const metaLocale = sessionResult.data.session?.user?.user_metadata?.preferred_locale;
      if (metaLocale === 'en' || metaLocale === 'es') {
        localizedUrls = buildLocalizedUrls(metaLocale);
      }
    } catch (_) {
      // ignore metadata read errors
    }

    // 🌍 Redirect to localized confirmation page
    if (type === "email_confirmation" || type === "signup" || flow === 'signup' || (!type && code)) {
      logger.auth("Confirmation type, redirecting to email-confirmed", { type });
      return NextResponse.redirect(new URL(localizedUrls.emailConfirmed, requestOrigin));
    }

    // 🌍 Handle password recovery
    if (type === "recovery") {
      logger.auth("Recovery type, redirecting to update-password", { type });
      return NextResponse.redirect(new URL(localizedUrls.updatePassword, requestOrigin));
    }

    // 🌍 For other auth types
    logger.auth("Other auth type, redirecting to login", { type });
    return NextResponse.redirect(new URL(localizedUrls.login, requestOrigin));
  } catch (error: unknown) {
    logger.auth("Error during auth callback", {
      error: error instanceof Error ? error : new Error("Unknown error"),
      type,
    });
    return NextResponse.redirect(
      new URL(`${localizedUrls.login}?error=auth_callback_error`, requestOrigin)
    );
  }
}
