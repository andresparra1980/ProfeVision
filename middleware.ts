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
    
    // Páginas de contenido estático (ambas variantes para evitar redirecciones a auth)
    `/${locale}/${locale === 'es' ? 'privacidad' : 'privacy'}`,
    `/${locale}/privacy`, // Variante en inglés para cualquier locale
    `/${locale}/privacidad`, // Variante en español para cualquier locale
    `/${locale}/${locale === 'es' ? 'terminos' : 'terms'}`,
    `/${locale}/terms`, // Variante en inglés para cualquier locale
    `/${locale}/terminos`, // Variante en español para cualquier locale
    `/${locale}/${locale === 'es' ? 'cookies' : 'cookies'}`,
    `/${locale}/cookies`, // Misma en ambos idiomas
    
    // Páginas de información (ambas variantes)
    `/${locale}/${locale === 'es' ? 'como-funciona' : 'how-it-works'}`,
    `/${locale}/how-it-works`, // Variante en inglés para cualquier locale
    `/${locale}/como-funciona`, // Variante en español para cualquier locale
    `/${locale}/${locale === 'es' ? 'precios' : 'pricing'}`,
    `/${locale}/pricing`, // Variante en inglés para cualquier locale
    `/${locale}/precios`, // Variante en español para cualquier locale
    `/${locale}/${locale === 'es' ? 'contacto' : 'contact'}`,
    `/${locale}/contact`, // Variante en inglés para cualquier locale
    `/${locale}/contacto`, // Variante en español para cualquier locale
    `/${locale}/${locale === 'es' ? 'blog' : 'blog'}`,
    `/${locale}/blog`, // Misma en ambos idiomas
    
    // Páginas de exámenes (ambas variantes)
    `/${locale}/${locale === 'es' ? 'examenes-con-ia' : 'exams-with-ai'}`,
    `/${locale}/exams-with-ai`, // Variante en inglés para cualquier locale
    `/${locale}/examenes-con-ia`, // Variante en español para cualquier locale
    `/${locale}/${locale === 'es' ? 'examenes-papel' : 'paper-exams'}`,
    `/${locale}/paper-exams`, // Variante en inglés para cualquier locale
    `/${locale}/examenes-papel`, // Variante en español para cualquier locale
    
    // Páginas de gestión (información pública, ambas variantes)
    `/${locale}/${locale === 'es' ? 'gestion-instituciones' : 'institutions-management'}`,
    `/${locale}/institutions-management`, // Variante en inglés para cualquier locale
    `/${locale}/gestion-instituciones`, // Variante en español para cualquier locale
    `/${locale}/${locale === 'es' ? 'gestion-materias' : 'subjects-management'}`,
    `/${locale}/subjects-management`, // Variante en inglés para cualquier locale
    `/${locale}/gestion-materias`, // Variante en español para cualquier locale
    `/${locale}/${locale === 'es' ? 'gestion-grupos' : 'groups-management'}`,
    `/${locale}/groups-management`, // Variante en inglés para cualquier locale
    `/${locale}/gestion-grupos`, // Variante en español para cualquier locale
    `/${locale}/${locale === 'es' ? 'gestion-estudiantes' : 'students-management'}`,
    `/${locale}/students-management`, // Variante en inglés para cualquier locale
    `/${locale}/gestion-estudiantes`, // Variante en español para cualquier locale
    `/${locale}/${locale === 'es' ? 'reportes' : 'reports'}`,
    `/${locale}/reports`, // Variante en inglés para cualquier locale
    `/${locale}/reportes`, // Variante en español para cualquier locale
    `/${locale}/${locale === 'es' ? 'aplicacion-movil' : 'mobile-app'}`,
    `/${locale}/mobile-app`, // Variante en inglés para cualquier locale
    `/${locale}/aplicacion-movil`, // Variante en español para cualquier locale
    
    // Páginas de autenticación (ambas variantes)
    `/${locale}/auth/${locale === 'es' ? 'iniciar-sesion' : 'login'}`,
    `/${locale}/auth/login`, // Variante en inglés para cualquier locale
    `/${locale}/auth/iniciar-sesion`, // Variante en español para cualquier locale
    `/${locale}/auth/${locale === 'es' ? 'registro' : 'register'}`,
    `/${locale}/auth/register`, // Variante en inglés para cualquier locale
    `/${locale}/auth/registro`, // Variante en español para cualquier locale
    `/${locale}/auth/${locale === 'es' ? 'restablecer-contrasena' : 'reset-password'}`,
    `/${locale}/auth/reset-password`, // Variante en inglés para cualquier locale
    `/${locale}/auth/restablecer-contrasena`, // Variante en español para cualquier locale
    `/${locale}/auth/${locale === 'es' ? 'actualizar-contrasena' : 'update-password'}`,
    `/${locale}/auth/update-password`, // Variante en inglés para cualquier locale
    `/${locale}/auth/actualizar-contrasena`, // Variante en español para cualquier locale
    `/${locale}/auth/${locale === 'es' ? 'verificar-email' : 'verify-email'}`,
    `/${locale}/auth/verify-email`, // Variante en inglés para cualquier locale
    `/${locale}/auth/verificar-email`, // Variante en español para cualquier locale
    `/${locale}/auth/${locale === 'es' ? 'email-confirmado' : 'email-confirmed'}`,
    `/${locale}/auth/email-confirmed`, // Variante en inglés para cualquier locale
    `/${locale}/auth/email-confirmado`, // Variante en español para cualquier locale
    
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
