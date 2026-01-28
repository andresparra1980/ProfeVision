import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { nonLocalizedRoutes } from "./i18n/routing";
import { routeMappings, getLocalizedRoute } from "./i18n/route-constants";

// Crear el middleware de i18n
const intlMiddleware = createIntlMiddleware({
  ...routing,
  localeDetection: true, // ✅ Habilitar detección automática con cookie
  localePrefix: "always", // Prefijar siempre el locale (incluye 'es') para evitar normalizaciones 307
  alternateLinks: false,
  localeCookie: {
    name: 'NEXT_LOCALE',
    maxAge: 31536000, // 1 año
    sameSite: 'lax',
    path: '/'
  }
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.nextUrl.hostname;
  const defaultLocale = "en";
  const supportedLocales = ["es", "en", "fr", "pt"] as const;

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
  if (/^\/(es|en|fr|pt)\/sitemap\.xml$/.test(pathname)) {
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

  // 🌍 Si es la raíz, detectar idioma preferido del usuario
  if (pathname === "/") {
    // 1. Verificar cookie NEXT_LOCALE
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;

    // 2. Detectar idioma del navegador desde Accept-Language
    const acceptLanguage = request.headers.get('accept-language');
    let detectedLocale = defaultLocale;

    if (cookieLocale && supportedLocales.includes(cookieLocale as any)) {
      detectedLocale = cookieLocale;
      console.log(`[Middleware] Using locale from cookie: ${detectedLocale}`);
    } else if (acceptLanguage) {
      // Parsear Accept-Language y buscar coincidencia con locales soportados
      const browserLocales = acceptLanguage
        .split(',')
        .map(lang => lang.split(';')[0].trim().toLowerCase().substring(0, 2));

      const matched = browserLocales.find(lang =>
        supportedLocales.includes(lang as any)
      );

      if (matched) {
        detectedLocale = matched;
        console.log(`[Middleware] Auto-detected locale from browser: ${detectedLocale}`);
      }
    }

    const redirectUrl = new URL(`/${detectedLocale}`, request.url);
    console.log(
      `[Middleware] Redirecting root to detected locale: ${redirectUrl.pathname}`,
    );

    // Establecer cookie si no existe
    const response = NextResponse.redirect(redirectUrl);
    if (!cookieLocale) {
      response.cookies.set('NEXT_LOCALE', detectedLocale, {
        maxAge: 31536000, // 1 año
        sameSite: 'lax',
        path: '/'
      });
    }

    return response;
  }

  // 🌍 Redirigir cualquier ruta NO localizada usando idioma preferido del usuario
  const hasLocalePrefix = supportedLocales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (!hasLocalePrefix) {
    // Detectar idioma preferido (cookie > Accept-Language > default)
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
    const acceptLanguage = request.headers.get('accept-language');
    let targetLocale = defaultLocale;

    if (cookieLocale && supportedLocales.includes(cookieLocale as any)) {
      targetLocale = cookieLocale;
    } else if (acceptLanguage) {
      const browserLocales = acceptLanguage
        .split(',')
        .map(lang => lang.split(';')[0].trim().toLowerCase().substring(0, 2));
      const matched = browserLocales.find(lang => supportedLocales.includes(lang as any));
      if (matched) targetLocale = matched;
    }

    const redirectUrl = new URL(request.url);
    redirectUrl.pathname = `/${targetLocale}${pathname}`;
    console.log(
      `[Middleware] Redirecting non-localized path '${pathname}' to detected locale: ${redirectUrl.pathname}${redirectUrl.search}`,
    );

    const response = NextResponse.redirect(redirectUrl);
    if (!cookieLocale) {
      response.cookies.set('NEXT_LOCALE', targetLocale, {
        maxAge: 31536000,
        sameSite: 'lax',
        path: '/'
      });
    }
    return response;
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
  const pathLocale = pathname.split("/")[1];
  const locale =
    intlResponse.headers.get("x-next-intl-locale") ||
    (["es", "en", "fr", "pt"].includes(pathLocale) ? pathLocale : "en");
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

  // 🌍 Extraer locale del pathname (más confiable que header en este punto)
  const pathLocale = pathname.split("/")[1];
  const locale = (["es", "en", "fr", "pt"].includes(pathLocale) ? pathLocale : "es") as "es" | "en" | "fr" | "pt";

  // 🔐 Construir rutas localizadas dinámicamente
  const getLocalizedRoutes = (currentLocale: string) => {
    // Siempre prefijar con el locale activo (localePrefix: 'always')
    const base = `/${currentLocale}`;
    const loginPaths: Record<string, string> = {
      es: "iniciar-sesion",
      en: "login",
      fr: "connexion",
      pt: "entrar",
    };
    return {
      login: `${base}/auth/${loginPaths[currentLocale] || "login"}`,
      dashboard: `${base}/dashboard`,
    };
  };

  const localizedRoutes = getLocalizedRoutes(locale);

  // 🔐 Usar mapeo de rutas compartido desde route-constants.ts
  const getRoute = (key: string) => getLocalizedRoute(key, locale);

  // 🔐 Rutas públicas localizadas - Lista completa con soporte FR/PT
  const publicRoutes = [
    // Rutas con prefijo de locale
    `/${locale}`,
    `/${locale}/`,

    // Páginas de contenido estático
    `/${locale}/${getRoute("privacy")}`,
    `/${locale}/${getRoute("terms")}`,
    `/${locale}/${getRoute("cookies")}`,
    `/${locale}/${getRoute("dataDeletion")}`,

    // Páginas de información
    `/${locale}/${getRoute("howItWorks")}`,
    `/${locale}/${getRoute("pricing")}`,
    `/${locale}/${getRoute("contact")}`,
    `/${locale}/${getRoute("blog")}`,

    // Páginas de exámenes
    `/${locale}/${getRoute("examsWithAI")}`,
    `/${locale}/${getRoute("paperExams")}`,

    // Páginas de gestión (información pública)
    `/${locale}/${getRoute("institutions")}`,
    `/${locale}/${getRoute("subjects")}`,
    `/${locale}/${getRoute("groups")}`,
    `/${locale}/${getRoute("students")}`,
    `/${locale}/${getRoute("reports")}`,
    `/${locale}/${getRoute("mobileApp")}`,

    // Páginas de autenticación
    `/${locale}/auth/${getRoute("login")}`,
    `/${locale}/auth/${getRoute("register")}`,
    `/${locale}/auth/${getRoute("resetPassword")}`,
    `/${locale}/auth/${getRoute("updatePassword")}`,
    `/${locale}/auth/${getRoute("verifyEmail")}`,
    `/${locale}/auth/${getRoute("emailConfirmed")}`,
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
     * - favicon files (favicon.ico, favicon-*.png)
     * - apple-touch-icon.png (iOS icon)
     * - android-chrome-*.png (Android icons)
     * - site.webmanifest (PWA manifest)
     * - assets/ (project specific assets)
     * - uploads/ (user uploads)
     * - images/ (static images)
     * - .well-known/ (standardized metadata like security.txt)
     * - security.txt (legacy location)
     * - .git/ (ignore probes from browser extensions/scanners)
     * - opencv.js (OpenCV library for document capture)
     */
    "/((?!_next/|favicon.*\\.(?:ico|png)|apple-touch-icon\\.png|android-chrome-.*\\.png|site\\.webmanifest|assets/|uploads/|images/|.well-known/|security.txt|robots.txt|sitemap.xml|.git/|opencv.js|turnstile.html|ingest/).*)",
  ],
};
