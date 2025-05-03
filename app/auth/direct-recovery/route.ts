import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/utils/logger";
import { createServerClient } from "@supabase/ssr";
import { getSiteUrl } from "@/lib/supabase";

// Use the more reliable URL getter
const SITE_URL = getSiteUrl();

// Enhanced cookie options for better persistence
const COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7, // 7 days
  httpOnly: true,
};

export async function GET(request: NextRequest) {
  // Extract tokens from URL
  const requestUrl = new URL(request.url);

  // Look for all possible token variations
  const token = requestUrl.searchParams.get("token");
  const type = requestUrl.searchParams.get("type");
  const accessToken = requestUrl.searchParams.get("access_token");
  const refreshToken = requestUrl.searchParams.get("refresh_token");
  const code = requestUrl.searchParams.get("code");

  // Log all parameters to help debug
  logger.auth("Direct recovery request received", {
    token: token ? "exists" : "missing",
    type,
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    hasCode: !!code,
    url: request.url,
    siteUrl: SITE_URL,
  });

  // Initialize response
  let response = NextResponse.redirect(
    new URL("/auth/update-password?source=direct-recovery-flow", SITE_URL)
  );

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

        // Create URL for update-password with some debug info but without tokens
        const finalRedirectUrl = new URL("/auth/update-password", SITE_URL);
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

        // Create response with the final URL
        // We don't need to pass tokens in the URL as we have cookies set
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
  // Build the redirect URL with all available tokens
  const redirectUrl = new URL("/auth/update-password", SITE_URL);

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
  });

  // Return the redirect response
  return NextResponse.redirect(redirectUrl);
}
