import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const DEBUG = process.env.NODE_ENV === "development";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");

  // If no code or not a verification type, redirect to login
  if (!code || !type) {
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
    await supabase.auth.exchangeCodeForSession(code);

    // Redirect to a confirmation page instead of directly to login
    if (type === "email_confirmation" || type === "signup") {
      return NextResponse.redirect(new URL("/auth/email-confirmed", SITE_URL));
    }

    // For other auth types like recovery, etc.
    return NextResponse.redirect(new URL("/auth/login", SITE_URL));
  } catch (error: unknown) {
    if (DEBUG) {
      console.error("Error during auth callback:", error);
    }
    return NextResponse.redirect(
      new URL("/auth/login?error=auth_callback_error", SITE_URL)
    );
  }
}
