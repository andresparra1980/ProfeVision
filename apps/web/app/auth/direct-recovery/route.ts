import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/utils/logger";
import { createServerClient } from "@supabase/ssr";
import { routeMappings } from "@/i18n/route-constants";

export async function GET(request: NextRequest) {
  // Extract tokens from URL
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const requestOrigin = forwardedHost && forwardedProto
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin;

  // Look for all possible token variations
  const token = requestUrl.searchParams.get("token");
  const type = requestUrl.searchParams.get("type");
  const accessToken = requestUrl.searchParams.get("access_token");
  const refreshToken = requestUrl.searchParams.get("refresh_token");
  const code = requestUrl.searchParams.get("code");

  // 🌍 Determinar locale prioritariamente por query param, luego header
  const urlLocale = requestUrl.searchParams.get('locale');
  const acceptLanguage = request.headers.get('accept-language');
  const supportedLocales = ['es', 'en', 'fr', 'pt'];
  const preferredLocale = (urlLocale && supportedLocales.includes(urlLocale))
    ? urlLocale
    : (acceptLanguage?.startsWith('en') ? 'en' : 'es');
  
  // 🌍 Construir URL localizada para update-password usando routeMappings
  const updatePasswordSlug = routeMappings.updatePassword[preferredLocale] || routeMappings.updatePassword.es;
  const localizedUpdatePassword = preferredLocale === 'es' 
    ? `/auth/${updatePasswordSlug}` 
    : `/${preferredLocale}/auth/${updatePasswordSlug}`;

  // Log all parameters to help debug
  logger.auth("Direct recovery request received", {
    token: token ? "exists" : "missing",
    type,
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    hasCode: !!code,
    preferredLocale,
    url: request.url,
    origin: requestOrigin,
  });

  // Initialize response with localized URL
  let response = NextResponse.redirect(
    new URL(`${localizedUpdatePassword}?source=direct-recovery-flow`, requestOrigin)
  );

  // Enhanced cookie options for better persistence across domains
  // Adjust for localhost (http) where SameSite=None + secure is invalid
  const isSecureOrigin = requestOrigin.startsWith("https://");
  const sameSitePolicy: 'lax' | 'none' = isSecureOrigin ? 'none' : 'lax';
  const COOKIE_OPTIONS = {
    path: "/",
    sameSite: sameSitePolicy,
    secure: isSecureOrigin,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
  };

  // If we have a code, try to exchange it for a session
  if (code) {
    try {
      logger.auth(
        "Attempting to exchange code for session in direct-recovery",
        { code: "exists" }
      );

      // Create server client
        const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value;
            },
            set(name: string, value: string, options: Record<string, unknown>) {
              // Ensure options contains path and secure flags
              const cookieOptions = {
                ...COOKIE_OPTIONS,
                ...options,
              };

              // Set in response
              response.cookies.set({
                name,
                value,
                ...cookieOptions,
              });

              // Log cookie setting
              logger.auth(`Setting cookie ${name}`, {
                cookieLength: value.length,
                options: JSON.stringify(cookieOptions),
              });
            },
            remove(name: string, _options: Record<string, unknown>) {
              response.cookies.delete({
                name,
                ...COOKIE_OPTIONS,
              });
            },
          },
        }
      );

      // Exchange code for session
      const sessionResult = await supabase.auth.exchangeCodeForSession(code);

      // Log the cookies being set
      const cookieNames = response.cookies.getAll().map((c) => c.name);

      logger.auth("Exchange result in direct-recovery", {
        success: !sessionResult.error,
        hasSession: !!sessionResult.data.session,
        errorMessage: sessionResult.error?.message,
        hasCookies: cookieNames.length > 0,
        cookieNames: cookieNames.join(", "),
      });

      // If we have a session, we can redirect directly
      if (sessionResult.data.session) {
        logger.auth(
          "Successfully obtained session, redirecting to update-password"
        );

        // 🌍 Create URL for localized update-password with some debug info but without tokens
        const finalRedirectUrl = new URL(localizedUpdatePassword, requestOrigin);
        finalRedirectUrl.searchParams.set(
          "source",
          "direct-recovery-with-session"
        );
        finalRedirectUrl.searchParams.set("timestamp", Date.now().toString());
        finalRedirectUrl.searchParams.set("debug", "true");

        // Session user ID may be helpful for debugging (just use a partial to avoid leaking full IDs)
        if (sessionResult.data.session.user?.id) {
          const partialId = sessionResult.data.session.user.id.substring(0, 6);
          finalRedirectUrl.searchParams.set("uid", partialId);
        }

        // Extract the session token as a fallback in case cookies don't work
        // This is for browser compatibility - some browsers may not correctly handle cookies in redirects
        if (sessionResult.data.session.access_token) {
          finalRedirectUrl.searchParams.set(
            "access_token",
            sessionResult.data.session.access_token
          );
        }

        // Create response with the final URL
        response = NextResponse.redirect(finalRedirectUrl);

        // Manually copy all cookies from the previous response to ensure they're preserved
        const cookies = Array.from(response.cookies.getAll());

        // Log important auth cookies for debugging
        const hasSbAuth = cookies.some((c) => c.name.includes("sb-auth"));
        const hasSbId = cookies.some((c) => c.name.includes("sb-id"));

        logger.auth("Final cookies being set", {
          count: cookies.length,
          hasSbAuth,
          hasSbId,
        });

        // Return the response with cookies
        return response;
      }

      // If we couldn't get a session but have tokens, continue with token passing
      if (sessionResult.error) {
        logger.auth("Failed to exchange code but continuing with tokens", {
          error: sessionResult.error.message,
        });
      }
    } catch (error) {
      logger.auth("Exception during code exchange", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      // Continue to try token passing approach
    }
  }

  // If we get here, we need to try passing tokens directly
  // 🌍 Build the redirect URL with all available tokens using localized URL
  const redirectUrl = new URL(localizedUpdatePassword, requestOrigin);

  // Add any tokens we have to the redirect
  if (token) redirectUrl.searchParams.set("token", token);
  if (type) redirectUrl.searchParams.set("type", type);
  if (accessToken) redirectUrl.searchParams.set("access_token", accessToken);
  if (refreshToken) redirectUrl.searchParams.set("refresh_token", refreshToken);
  if (code) redirectUrl.searchParams.set("code", code); // Include the code as well

  // Add debugging flag
  redirectUrl.searchParams.set("source", "direct-recovery-fallback");
  redirectUrl.searchParams.set("timestamp", Date.now().toString());
  redirectUrl.searchParams.set("debug", "true");

  logger.auth("Direct recovery redirecting with fallback approach", {
    destination: redirectUrl
      .toString()
      .replace(/token=[^&]+/, "token=REDACTED"),
    type,
    locale: preferredLocale,
  });

  // Return the redirect response
  return NextResponse.redirect(redirectUrl);
}
