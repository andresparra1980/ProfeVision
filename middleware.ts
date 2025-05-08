import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
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
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // IMPORTANT: Avoid multiple getSession calls. Fetch session once.
  // getSession() will automatically refresh the session if needed.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Protected routes
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      // Redirect to login, preserving the intended destination
      const redirectUrl = new URL("/auth/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      console.log(
        `[Middleware] No session for ${pathname}. Redirecting to login.`
      );
      return NextResponse.redirect(redirectUrl);
    }
    // If session exists, allow access to dashboard routes
    console.log(`[Middleware] Session found for ${pathname}. Allowing access.`);
    return response; // Allow the request to proceed
  }

  // Auth routes
  if (pathname.startsWith("/auth/") && pathname !== "/auth/callback") {
    if (session) {
      // If logged in, redirect from auth pages to dashboard
      console.log(
        `[Middleware] Session found on auth page (${pathname}). Redirecting to dashboard.`
      );
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // If no session, allow access to auth routes
    console.log(
      `[Middleware] No session on auth page (${pathname}). Allowing access.`
    );
    return response; // Allow the request to proceed
  }

  // For all other routes (including API routes, public pages, RSC fetches not covered above),
  // let the request proceed without intervention after session refresh attempt.
  console.log(
    `[Middleware] Pathname (${pathname}) not explicitly handled. Allowing access.`
  );
  return response;
}

// Matcher configuration remains the same
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets/ (project specific assets)
     * - auth/callback (Supabase auth callback)
     * - auth/direct-recovery (Our direct recovery handler)
     */
    "/((?!_next/static|_next/image|favicon.ico|assets/|auth/callback|auth/direct-recovery|auth/verify-email).*)",
    // Apply to specific routes if preferred, but the above is common
    // '/dashboard/:path*',
    // '/auth/login',
    // '/auth/register',
    // '/api/:path*'
  ],
};
