import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { nonLocalizedRoutes } from "./i18n/routing";

// Crear el middleware de i18n
const intlMiddleware = createIntlMiddleware({
  ...routing,
  localeDetection: false, // Deshabilitar detección automática para evitar redirecciones inesperadas
  localePrefix: "always", // Prefijar siempre el locale (incluye 'es') para evitar normalizaciones 307
  alternateLinks: false,
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.nextUrl.hostname;
  const defaultLocale = "es";
  const supportedLocales = ["es", "en"] as const;

  // 🚫 Handle OPTIONS requests (CORS preflight) early
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // 🏷️ Normalizar host: redirigir www -> apex
  if (hostname === "www.profevision.com") {
    const url = new URL(request.url);
    url.hostname = "profevision.com";
    console.log(`[Middleware] Redirecting www to apex: ${url.toString()}`);
    return NextResponse.redirect(url, 308);
  }

  // 🔍 Evitar indexación en entorno de testing
  const baseResponse = NextResponse.next();
  if (hostname === "testing.profevision.com") {
    baseResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  // 🗺️ No interferir con sitemap y robots
  if (pathname === "/sitemap.xml" || pathname === "/robots.txt") {
    return baseResponse;
  }
  // Redirigir sitemap localizado a raíz
  if (/^\/(es|en)\/sitemap\.xml$/.test(pathname)) {
    const url = new URL(request.url);
    url.pathname = "/sitemap.xml";
    return NextResponse.redirect(url, 308);
  }

  // 🔐 Rutas que NO deben ser localizadas (callbacks de Supabase)
  if (nonLocalizedRoutes.some((route) => pathname.startsWith(route))) {
    console.log(`[Middleware] Non-localized route: ${pathname}`);
    const resp = await handleAuthMiddleware(request);
    // Propagar cabeceras base (noindex en testing)
    baseResponse.headers.forEach((v, k) => resp.headers.set(k, v));
    // Enforce no-cache for all page responses
    resp.headers.set("Cache-Control", "no-store, must-revalidate");
    return resp;
  }

  // 🌍 Si es la raíz, redirigir únicamente a /{defaultLocale}
  if (pathname === "/") {
    const redirectUrl = new URL(`/${defaultLocale}`, request.url);
    console.log(
      `[Middleware] Redirecting root to default locale: ${redirectUrl.pathname}`,
    );
    return NextResponse.redirect(redirectUrl);
  }

  // 🌍 Redirigir cualquier ruta NO localizada al defaultLocale
  const hasLocalePrefix = supportedLocales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (!hasLocalePrefix) {
    const redirectUrl = new URL(request.url);
    redirectUrl.pathname = `/${defaultLocale}${pathname}`;
    console.log(
      `[Middleware] Redirecting non-localized path '${pathname}' to default locale: ${redirectUrl.pathname}${redirectUrl.search}`,
    );
    return NextResponse.redirect(redirectUrl);
  }

  // 🌍 Aplicar middleware de i18n SIEMPRE (gestiona slugs traducidos y reescrituras)
  const intlResponse = intlMiddleware(request);
  // Si i18n redirige, seguir esa redirección
  if (
    intlResponse.status === 307 ||
    intlResponse.status === 302 ||
    intlResponse.status === 308
  ) {
    console.log(
      `[Middleware] i18n redirect for: ${pathname} with status ${intlResponse.status}`,
    );
    return intlResponse;
  }

  // 🔐 Aplicar lógica de autenticación a rutas localizadas
  const authResponse = await handleAuthMiddleware(request, intlResponse);
  // Propagar cabeceras base (noindex en testing)
  baseResponse.headers.forEach((v, k) => authResponse.headers.set(k, v));

  // 🌍 Detectar locale y agregarlo como header para SEO
  const locale =
    intlResponse.headers.get("x-next-intl-locale") ||
    (pathname.startsWith("/en") ? "en" : "es");
  authResponse.headers.set("x-locale", locale);
  // Enforce no-cache for all page responses
  authResponse.headers.set("Cache-Control", "no-store, must-revalidate");

  return authResponse;
}

async function handleAuthMiddleware(
  request: NextRequest,
  response?: NextResponse,
) {
  let authResponse =
    response ||
    NextResponse.next({
      request: { headers: request.headers },
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
            request: { headers: request.headers },
          });
          authResponse.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          authResponse = NextResponse.next({
            request: { headers: request.headers },
          });
          authResponse.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  // 🔐 Verificar sesión (preservar lógica original)
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;

  // 🌍 El locale ahora se obtiene del header que pone `next-intl`
  const locale = request.headers.get("x-next-intl-locale") || "es";

  // 🔐 Construir rutas localizadas dinámicamente
  const getLocalizedRoutes = (currentLocale: string) => {
    // Siempre prefijar con el locale activo (localePrefix: 'always')
    const base = `/${currentLocale}`;
    return {
      login: `${base}/auth/${currentLocale === "es" ? "iniciar-sesion" : "login"}`,
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
    `/${locale}/${locale === "es" ? "privacidad" : "privacy"}`,
    `/${locale}/${locale === "es" ? "terminos" : "terms"}`,
    `/${locale}/${locale === "es" ? "cookies" : "cookies"}`,
    `/${locale}/${locale === "es" ? "data-deletion" : "data-deletion"}`,

    // Páginas de información
    `/${locale}/${locale === "es" ? "como-funciona" : "how-it-works"}`,
    `/${locale}/${locale === "es" ? "precios" : "pricing"}`,
    `/${locale}/${locale === "es" ? "contacto" : "contact"}`,
    `/${locale}/${locale === "es" ? "blog" : "blog"}`,

    // Páginas de exámenes
    `/${locale}/${locale === "es" ? "examenes-con-ia" : "exams-with-ai"}`,
    `/${locale}/${locale === "es" ? "examenes-papel" : "paper-exams"}`,

    // Páginas de gestión (información pública)
    `/${locale}/${locale === "es" ? "gestion-instituciones" : "institutions-management"}`,
    `/${locale}/${locale === "es" ? "gestion-materias" : "subjects-management"}`,
    `/${locale}/${locale === "es" ? "gestion-grupos" : "groups-management"}`,
    `/${locale}/${locale === "es" ? "gestion-estudiantes" : "students-management"}`,
    `/${locale}/${locale === "es" ? "reportes" : "reports"}`,
    `/${locale}/${locale === "es" ? "aplicacion-movil" : "mobile-app"}`,

    // Páginas de autenticación
    `/${locale}/auth/${locale === "es" ? "iniciar-sesion" : "login"}`,
    `/${locale}/auth/${locale === "es" ? "registro" : "register"}`,
    `/${locale}/auth/${locale === "es" ? "restablecer-contrasena" : "reset-password"}`,
    `/${locale}/auth/${locale === "es" ? "actualizar-contrasena" : "update-password"}`,
    `/${locale}/auth/${locale === "es" ? "verificar-email" : "verify-email"}`,
    `/${locale}/auth/${locale === "es" ? "email-confirmado" : "email-confirmed"}`,
    // Nota: ya no se incluyen rutas sin prefijo, porque usamos localePrefix: 'always'
  ];

  // 🔐 Lógica de autenticación preservada para rutas públicas
  if (publicRoutes.includes(pathname)) {
    console.log(`[Middleware] Public route (${pathname}). Allowing access.`);
    return authResponse;
  }

  // 🔐 Rutas protegidas (dashboard)
  const isDashboardRoute = (path: string, currentLocale: string): boolean => {
    // Con localePrefix: 'always', las rutas protegidas siempre llevan prefijo
    return path.startsWith(`/${currentLocale}/dashboard`);
  };

  if (isDashboardRoute(pathname, locale)) {
    if (!session) {
      const redirectUrl = new URL(localizedRoutes.login, request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      console.log(
        `[Middleware] No session for ${pathname}. Redirecting to login.`,
      );
      return NextResponse.redirect(redirectUrl);
    }
    console.log(`[Middleware] Session found for ${pathname}. Allowing access.`);
    return authResponse;
  }

  // 🔐 Rutas de auth con lógica mejorada
  const isAuthRoute = (path: string, currentLocale: string): boolean => {
    // Excluir callbacks y rutas especiales
    if (path.endsWith("/callback") || path.endsWith("/direct-recovery")) {
      return false;
    }
    // Con localePrefix: 'always', las rutas de auth siempre llevan prefijo
    return path.startsWith(`/${currentLocale}/auth/`);
  };

  if (isAuthRoute(pathname, locale)) {
    if (session) {
      console.log(
        `[Middleware] Session found on auth page (${pathname}). Redirecting to dashboard.`,
      );
      return NextResponse.redirect(
        new URL(localizedRoutes.dashboard, request.url),
      );
    }
    console.log(
      `[Middleware] No session on auth page (${pathname}). Allowing access.`,
    );
    return authResponse;
  }

  // 🔐 Para todas las demás rutas, permitir acceso
  console.log(
    `[Middleware] Pathname (${pathname}) not explicitly handled. Allowing access.`,
  );
  return authResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/ (all Next.js internal assets and HMR endpoints)
     * - favicon.ico (favicon file)
     * - assets/ (project specific assets)
     * - uploads/ (user uploads)
     * - images/ (static images)
     * - .well-known/ (standardized metadata like security.txt)
     * - security.txt (legacy location)
     * - .git/ (ignore probes from browser extensions/scanners)
     * - opencv.js (OpenCV library for document capture)
     */
    "/((?!_next/|favicon.ico|assets/|uploads/|images/|.well-known/|security.txt|robots.txt|sitemap.xml|.git/|opencv.js|turnstile.html).*)",
  ],
};
