import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { nonLocalizedRoutes } from './i18n/routing';

// Crear el middleware de i18n
const intlMiddleware = createIntlMiddleware({
  ...routing,
  localeDetection: true, // Habilitar detección automática para respetar cookie
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
  if (intlResponse.status === 307 || intlResponse.status === 302 || intlResponse.status === 308) {
    console.log(`[Middleware] i18n redirect for: ${pathname} with status ${intlResponse.status}`);
    return intlResponse;
  }
  
  // 🔐 Aplicar lógica de autenticación a rutas localizadas
  const authResponse = await handleAuthMiddleware(request, intlResponse);
  
  // 🌍 Detectar locale y agregarlo como header para SEO
  const locale = pathname.startsWith('/en') ? 'en' : 'es';
  authResponse.headers.set('x-locale', locale);
  
  return authResponse;
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
  
  // 🌍 El locale ahora se obtiene del header que pone `next-intl`
  const locale = request.headers.get('x-next-intl-locale') || 'es';

  // 🔐 Construir rutas localizadas dinámicamente
  const getLocalizedRoutes = (currentLocale: string) => {
    const base = currentLocale === 'es' ? '' : `/${currentLocale}`;
    return {
      login: `${base}/auth/${currentLocale === 'es' ? 'login' : 'login'}`,
      dashboard: `${base}/dashboard`,
    };
  };
  
  const localizedRoutes = getLocalizedRoutes(locale);

  // 🔐 Rutas públicas localizadas - Lista completa actualizada
  const publicRoutes = [
    // Rutas con prefijo de locale
    `/${locale}`,
    `/${locale}/`,
    
    // Páginas de contenido estático
    `/${locale}/${locale === 'es' ? 'privacidad' : 'privacy'}`,
    `/${locale}/${locale === 'es' ? 'terminos' : 'terms'}`,
    `/${locale}/${locale === 'es' ? 'cookies' : 'cookies'}`,
    
    // Páginas de información
    `/${locale}/${locale === 'es' ? 'como-funciona' : 'how-it-works'}`,
    `/${locale}/${locale === 'es' ? 'precios' : 'pricing'}`,
    `/${locale}/${locale === 'es' ? 'contacto' : 'contact'}`,
    `/${locale}/${locale === 'es' ? 'blog' : 'blog'}`,
    
    // Páginas de exámenes
    `/${locale}/${locale === 'es' ? 'examenes-con-ia' : 'exams-with-ai'}`,
    `/${locale}/${locale === 'es' ? 'examenes-papel' : 'paper-exams'}`,
    
    // Páginas de gestión (información pública)
    `/${locale}/${locale === 'es' ? 'gestion-instituciones' : 'institutions-management'}`,
    `/${locale}/${locale === 'es' ? 'gestion-materias' : 'subjects-management'}`,
    `/${locale}/${locale === 'es' ? 'gestion-grupos' : 'groups-management'}`,
    `/${locale}/${locale === 'es' ? 'gestion-estudiantes' : 'students-management'}`,
    `/${locale}/${locale === 'es' ? 'reportes' : 'reports'}`,
    `/${locale}/${locale === 'es' ? 'aplicacion-movil' : 'mobile-app'}`,
    
    // Páginas de autenticación
    `/${locale}/auth/${locale === 'es' ? 'iniciar-sesion' : 'login'}`,
    `/${locale}/auth/${locale === 'es' ? 'registro' : 'register'}`,
    `/${locale}/auth/${locale === 'es' ? 'restablecer-contrasena' : 'reset-password'}`,
    `/${locale}/auth/${locale === 'es' ? 'actualizar-contrasena' : 'update-password'}`,
    `/${locale}/auth/${locale === 'es' ? 'verificar-email' : 'verify-email'}`,
    `/${locale}/auth/${locale === 'es' ? 'email-confirmado' : 'email-confirmed'}`,
    
    // Rutas sin prefijo de idioma solo para el locale por defecto (español)
    ...(locale === 'es' ? [
      "/",
      "/privacidad",
      "/terminos", 
      "/cookies",
      "/como-funciona",
      "/gestion-instituciones",
      "/gestion-materias",
      "/gestion-grupos",
      "/gestion-estudiantes",
      "/reportes",
      "/aplicacion-movil",
      "/precios",
      "/contacto",
      "/blog",
      "/examenes",
      "/examenes/generador-manual",
      "/examenes/generador-ia",
      "/examenes-con-ia",
      "/examenes-papel",
      "/auth/iniciar-sesion",
      "/auth/registro",
      "/auth/restablecer-contrasena",
      "/auth/actualizar-contrasena",
      "/auth/verificar-email",
      "/auth/email-confirmado"
    ] : [])
  ];

  // 🔐 Lógica de autenticación preservada para rutas públicas
  if (publicRoutes.includes(pathname)) {
    console.log(`[Middleware] Public route (${pathname}). Allowing access.`);
    return authResponse;
  }

  // 🔐 Rutas protegidas (dashboard)
  const isDashboardRoute = (path: string, currentLocale: string): boolean => {
    // Para español (sin prefijo): /dashboard
    if (currentLocale === 'es' && path.startsWith('/dashboard')) {
      return true;
    }
    // Para inglés (con prefijo): /en/dashboard
    if (currentLocale === 'en' && path.startsWith('/en/dashboard')) {
      return true;
    }
    // Para español explícito (con prefijo): /es/dashboard
    if (currentLocale === 'es' && path.startsWith('/es/dashboard')) {
      return true;
    }
    return false;
  };
  
  if (isDashboardRoute(pathname, locale)) {
    if (!session) {
      const redirectUrl = new URL(localizedRoutes.login, request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      console.log(`[Middleware] No session for ${pathname}. Redirecting to login.`);
      return NextResponse.redirect(redirectUrl);
    }
    console.log(`[Middleware] Session found for ${pathname}. Allowing access.`);
    return authResponse;
  }

  // 🔐 Rutas de auth con lógica mejorada
  const isAuthRoute = (path: string, currentLocale: string): boolean => {
    // Excluir callbacks y rutas especiales
    if (path.endsWith('/callback') || path.endsWith('/direct-recovery')) {
      return false;
    }
    
    // Para español (sin prefijo): /auth/
    if (currentLocale === 'es' && path.startsWith('/auth/')) {
      return true;
    }
    // Para inglés (con prefijo): /en/auth/
    if (currentLocale === 'en' && path.startsWith('/en/auth/')) {
      return true;
    }
    // Para español explícito (con prefijo): /es/auth/
    if (currentLocale === 'es' && path.startsWith('/es/auth/')) {
      return true;
    }
    return false;
  };
  
  if (isAuthRoute(pathname, locale)) {
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
