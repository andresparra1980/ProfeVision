import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const DEBUG = true; // Force debug for troubleshooting
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");

  console.log(
    `[Auth Callback] Received request with type=${type}, code exists=${!!code}, url=${
      request.url
    }`
  );

  // If no code or not a verification type, redirect to login
  if (!code || !type) {
    console.log(`[Auth Callback] Missing code or type, redirecting to login`);
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
    console.log(
      `[Auth Callback] Attempting to exchange code for session, type=${type}`
    );
    const sessionResult = await supabase.auth.exchangeCodeForSession(code);
    console.log(
      `[Auth Callback] Exchange result: success=${!sessionResult.error}, session exists=${!!sessionResult
        .data.session}`
    );

    // Redirect to a confirmation page instead of directly to login
    if (type === "email_confirmation" || type === "signup") {
      console.log(
        `[Auth Callback] Confirmation type, redirecting to email-confirmed`
      );
      return NextResponse.redirect(new URL("/auth/email-confirmed", SITE_URL));
    }

    // Handle password recovery
    if (type === "recovery") {
      console.log(
        `[Auth Callback] Recovery type, redirecting to update-password`
      );
      return NextResponse.redirect(new URL("/auth/update-password", SITE_URL));
    }

    // For other auth types
    console.log(`[Auth Callback] Other type (${type}), redirecting to login`);
    return NextResponse.redirect(new URL("/auth/login", SITE_URL));
  } catch (error: unknown) {
    if (DEBUG) {
      console.error("[Auth Callback] Error during auth callback:", error);
    }
    return NextResponse.redirect(
      new URL("/auth/login?error=auth_callback_error", SITE_URL)
    );
  }
}
