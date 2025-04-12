import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          return Array.from(request.cookies.getAll())
            .map(cookie => ({
              name: cookie.name,
              value: cookie.value
            }));
        },
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set({
              name,
              value,
              ...options,
            });
          });
        },
      },
    }
  );

  // Refresh session if expired
  await supabase.auth.getSession();

  // Protected routes - redirect to login if not authenticated
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Auth routes - redirect to dashboard if already authenticated
  if (
    request.nextUrl.pathname === '/auth/login' ||
    request.nextUrl.pathname === '/auth/register'
  ) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Solo aplicar a rutas de API
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return response;
  }
  
  // Permitir la solicitud
  return response;
}

// Configure matcher to only include specific routes
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/login',
    '/auth/register',
    '/api/exams/:path*',
    '/api/:path*',
  ],
}; 