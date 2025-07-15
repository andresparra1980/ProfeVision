import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { nonLocalizedRoutes } from './i18n/config';

// Crear el middleware de i18n
const intlMiddleware = createIntlMiddleware({
  ...routing,
  localeDetection: true,
  localePrefix: 'as-needed',
  alternateLinks: false,
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 🔐 Rutas que NO deben ser localizadas (callbacks de Supabase)
  if (nonLocalizedRoutes.some(route => pathname.startsWith(route))) {
    console.log(`[Middleware] Non-localized route: ${pathname}`);
    return await handleAuthMiddleware(request);
  }
  
  // 🌍 Para rutas localizadas, aplicar middleware de i18n primero
  const intlResponse = intlMiddleware(request);
  
  // Si i18n redirige, seguir esa redirección
  if (intlResponse.status === 307 || intlResponse.status === 302) {
    console.log(`[Middleware] i18n redirect for: ${pathname}`);
    return intlResponse;
  }
  
  // 🔐 Aplicar lógica de autenticación a rutas localizadas
  return await handleAuthMiddleware(request, intlResponse);
}

async function handleAuthMiddleware(request: NextRequest, response?: NextResponse) {
  let authResponse = response || NextResponse.next({
    request: { headers: request.headers }
  });

  // 🔐 Crear cliente de Supabase (preservar lógica original)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          authResponse = NextResponse.next({
            request: { headers: request.headers }
          });
          authResponse.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          authResponse = NextResponse.next({
            request: { headers: request.headers }
          });
          authResponse.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // 🔐 Verificar sesión (preservar lógica original)
  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;
  
  // 🌍 Extraer locale del pathname
  const locale = pathname.startsWith('/es/') || pathname.startsWith('/es') ? 'es' : 
                pathname.startsWith('/en/') || pathname.startsWith('/en') ? 'en' : 'es';
  
  // 🔐 Construir rutas localizadas dinámicamente
  const localizedRoutes = {
    login: `/${locale}/auth/${locale === 'es' ? 'iniciar-sesion' : 'login'}`,
    dashboard: `/${locale}/${locale === 'es' ? 'panel' : 'dashboard'}`,
  };

  // 🔐 Rutas públicas localizadas (preservar lógica original)
  const publicRoutes = [
    `/${locale}`,
    `/${locale}/`,
    `/${locale}/privacy`,
    `/${locale}/terms`,
    `/${locale}/cookies`,
    `/${locale}/${locale === 'es' ? 'privacidad' : 'privacy'}`,
    `/${locale}/${locale === 'es' ? 'terminos' : 'terms'}`,
    `/${locale}/${locale === 'es' ? 'cookies' : 'cookies'}`,
    `/${locale}/${locale === 'es' ? 'como-funciona' : 'how-it-works'}`,
    `/${locale}/${locale === 'es' ? 'gestion-instituciones' : 'institutions-management'}`,
    `/${locale}/${locale === 'es' ? 'gestion-materias' : 'subjects-management'}`,
    `/${locale}/${locale === 'es' ? 'gestion-grupos' : 'groups-management'}`,
    `/${locale}/${locale === 'es' ? 'gestion-estudiantes' : 'students-management'}`,
    `/${locale}/${locale === 'es' ? 'reportes' : 'reports'}`,
    `/${locale}/${locale === 'es' ? 'aplicacion-movil' : 'mobile-app'}`,
    `/${locale}/${locale === 'es' ? 'precios' : 'pricing'}`,
    `/${locale}/${locale === 'es' ? 'contacto' : 'contact'}`,
    `/${locale}/${locale === 'es' ? 'blog' : 'blog'}`,
    `/${locale}/${locale === 'es' ? 'examenes' : 'exams'}`,
    `/${locale}/${locale === 'es' ? 'examenes/generador-manual' : 'exams/manual-generator'}`,
    `/${locale}/${locale === 'es' ? 'examenes/generador-ia' : 'exams/ai-generator'}`,
    `/${locale}/${locale === 'es' ? 'examenes-papel' : 'paper-exams'}`,
    
    // Rutas sin prefijo de idioma para el locale por defecto
    ...(locale === 'es' ? [
      "/",
      "/privacy",
      "/terms", 
      "/cookies",
      "/how-it-works",
      "/institutions-management",
      "/subjects-management",
      "/groups-management",
      "/students-management",
      "/reports",
      "/mobile-app",
      "/pricing",
      "/contact",
      "/blog",
      "/exams/manual-generator",
      "/exams/ai-generator",
      "/paper-exams",
      "/exams"
    ] : [])
  ];

  // 🔐 Lógica de autenticación preservada para rutas públicas
  if (publicRoutes.includes(pathname)) {
    console.log(`[Middleware] Public route (${pathname}). Allowing access.`);
    return authResponse;
  }

  // 🔐 Rutas protegidas (dashboard)
  if (pathname.startsWith(`/${locale}/${locale === 'es' ? 'panel' : 'dashboard'}`) || 
      (locale === 'es' && pathname.startsWith('/dashboard'))) {
    if (!session) {
      const redirectUrl = new URL(localizedRoutes.login, request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      console.log(`[Middleware] No session for ${pathname}. Redirecting to login.`);
      return NextResponse.redirect(redirectUrl);
    }
    console.log(`[Middleware] Session found for ${pathname}. Allowing access.`);
    return authResponse;
  }

  // 🔐 Rutas de auth (preservar lógica original)
  if (pathname.startsWith(`/${locale}/auth/`) || 
      (locale === 'es' && pathname.startsWith('/auth/') && 
       !pathname.endsWith('/callback') && 
       !pathname.endsWith('/direct-recovery'))) {
    if (session) {
      console.log(`[Middleware] Session found on auth page (${pathname}). Redirecting to dashboard.`);
      return NextResponse.redirect(new URL(localizedRoutes.dashboard, request.url));
    }
    console.log(`[Middleware] No session on auth page (${pathname}). Allowing access.`);
    return authResponse;
  }

  // 🔐 Para todas las demás rutas, permitir acceso
  console.log(`[Middleware] Pathname (${pathname}) not explicitly handled. Allowing access.`);
  return authResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets/ (project specific assets)
     * - uploads/ (user uploads)
     * - images/ (static images)
     */
    "/((?!_next/static|_next/image|favicon.ico|assets/|uploads/|images/).*)",
  ],
};
