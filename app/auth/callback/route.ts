import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/utils/logger";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");

  logger.auth("Auth callback received", {
    type,
    hasCode: !!code,
    url: request.url,
  });

  // If no code or not a verification type, redirect to login
  if (!code || !type) {
    logger.auth("Missing code or type, redirecting to login", { type });
    return NextResponse.redirect(new URL("/auth/login", SITE_URL));
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

    // Exchange the code for a session
    logger.auth("Attempting to exchange code for session", { type });
    const sessionResult = await supabase.auth.exchangeCodeForSession(code);
    logger.auth("Exchange result", {
      success: !sessionResult.error,
      hasSession: !!sessionResult.data.session,
      errorMessage: sessionResult.error?.message,
    });

    // Redirect to a confirmation page instead of directly to login
    if (type === "email_confirmation" || type === "signup") {
      logger.auth("Confirmation type, redirecting to email-confirmed", {
        type,
      });
      return NextResponse.redirect(new URL("/auth/email-confirmed", SITE_URL));
    }

    // Handle password recovery
    if (type === "recovery") {
      logger.auth("Recovery type, redirecting to update-password", { type });
      return NextResponse.redirect(new URL("/auth/update-password", SITE_URL));
    }

    // For other auth types
    logger.auth("Other auth type, redirecting to login", { type });
    return NextResponse.redirect(new URL("/auth/login", SITE_URL));
  } catch (error: unknown) {
    logger.auth("Error during auth callback", {
      error: error instanceof Error ? error : new Error("Unknown error"),
      type,
    });
    return NextResponse.redirect(
      new URL("/auth/login?error=auth_callback_error", SITE_URL)
    );
  }
}
