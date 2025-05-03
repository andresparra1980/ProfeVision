import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/utils/logger";
import { createServerClient } from "@supabase/ssr";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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
  });

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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
              request.cookies.set({
                name,
                value,
                ...options,
              });
              response = NextResponse.next({
                request: {
                  headers: request.headers,
                },
              });
              response.cookies.set({
                name,
                value,
                ...options,
              });
            },
            remove(name: string, _options: Record<string, unknown>) {
              request.cookies.delete(name);
              response.cookies.delete(name);
            },
          },
        }
      );

      // Exchange code for session
      const sessionResult = await supabase.auth.exchangeCodeForSession(code);

      logger.auth("Exchange result in direct-recovery", {
        success: !sessionResult.error,
        hasSession: !!sessionResult.data.session,
        errorMessage: sessionResult.error?.message,
      });

      // If we have a session, we can redirect directly
      if (sessionResult.data.session) {
        logger.auth(
          "Successfully obtained session, redirecting to update-password"
        );
        return NextResponse.redirect(
          new URL(
            "/auth/update-password?source=direct-recovery-with-session",
            SITE_URL
          )
        );
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

  // Build the redirect URL with all available tokens
  const redirectUrl = new URL("/auth/update-password", SITE_URL);

  // Add any tokens we have to the redirect
  if (token) redirectUrl.searchParams.set("token", token);
  if (type) redirectUrl.searchParams.set("type", type);
  if (accessToken) redirectUrl.searchParams.set("access_token", accessToken);
  if (refreshToken) redirectUrl.searchParams.set("refresh_token", refreshToken);
  if (code) redirectUrl.searchParams.set("code", code); // Include the code as well

  // Add debugging flag
  redirectUrl.searchParams.set("source", "direct-recovery");
  redirectUrl.searchParams.set("timestamp", Date.now().toString());

  logger.auth("Direct recovery redirecting", {
    destination: redirectUrl
      .toString()
      .replace(/token=[^&]+/, "token=REDACTED"),
    type,
  });

  // Redirect to update-password with all tokens
  return NextResponse.redirect(redirectUrl);
}
