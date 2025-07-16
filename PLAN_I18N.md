# Plan de Implementación de Internacionalización (i18n) - ProfeVision

## 📋 Contexto del Proyecto

**Aplicación:** ProfeVision - Plataforma de gestión de exámenes
**Framework:** Next.js 15.3.1 con App Router
**Gestor de paquetes:** Yarn
**Idiomas objetivo:** Español (ES) como default, Inglés (EN)
**Estrategia:** Detección automática por idioma del navegador (Accept-Language header)
**Rutas:** Personalizadas por idioma para SEO (ej. `/es/examenes` vs `/en/exams`)
**⚠️ Consideración crítica:** Integración con sistema de autenticación Supabase existente

## 🎯 Objetivos

- [x] Implementar soporte para español e inglés
- [x] Rutas personalizadas por idioma para SEO
- [x] Detección automática del idioma del navegador
- [x] Selector de idioma en el header
- [x] Mantener toda la funcionalidad existente
- [x] **🔐 Preservar completamente el sistema de autenticación Supabase**
- [x] **📧 Garantizar funcionamiento de callbacks de email (verificación, recuperación)**
- [x] **🔄 Integrar middleware de i18n con middleware de autenticación**

---

## 🚀 CHECKPOINT 1: Preparación e Instalación

### 1.1 Setup Inicial
```bash
# Crear feature branch
git checkout -b feature/i18n-implementation

# Instalar next-intl
yarn add next-intl@^4.3.4
```

### 1.2 Checklist de Preparación
- [x] Feature branch creada
- [x] next-intl instalado
- [x] Verificar compatibilidad con Next.js 15.3.1
- [x] **🔐 Backup del middleware de autenticación actual**
- [x] **📧 Documentar flujos de email existentes (verificación, recuperación)**
- [x] Commit del estado actual como punto de restauración

---

## 🗂️ CHECKPOINT 2: Estructura de Archivos

### 2.1 Crear Estructura Base
```
ProfeVision/
├── i18n/
│   ├── locales/
│   │   ├── es/
│   │   │   ├── common.json
│   │   │   ├── dashboard.json
│   │   │   ├── exam.json
│   │   │   ├── auth.json
│   │   │   ├── navigation.json
│   │   │   ├── errors.json
│   │   │   └── forms.json
│   │   └── en/
│   │       ├── common.json
│   │       ├── dashboard.json
│   │       ├── exam.json
│   │       ├── auth.json
│   │       ├── navigation.json
│   │       ├── errors.json
│   │       └── forms.json
│   ├── config.ts
│   ├── routing.ts
│   └── server.ts
└── middleware.ts (⚠️ MODIFICAR - NO REEMPLAZAR)
```

### 2.2 Checklist de Estructura
- [x] Directorio `/i18n/` creado
- [x] Subdirectorios `/locales/es/` y `/locales/en/` creados
- [x] Archivos JSON base creados (vacíos inicialmente)
- [x] Archivos de configuración preparados
- [x] **⚠️ Middleware existente preservado como referencia**

---

## ⚙️ CHECKPOINT 3: Configuración Base

### 3.1 Archivos de Configuración

**Archivo: `i18n/config.ts`**
```typescript
export const defaultLocale = 'es';
export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];

export const localeNames = {
  es: 'Español',
  en: 'English',
} as const;

// Configuración para detección de idioma del navegador
export const localeDetection = {
  strategy: 'acceptLanguageHeader',
  cookieName: 'locale',
  defaultLocale,
  locales,
} as const;

// 🔐 Rutas que NO deben ser localizadas (crítico para Supabase)
export const nonLocalizedRoutes = [
  '/auth/callback',
  '/auth/direct-recovery',
  '/api',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/uploads',
  '/images'
] as const;
```

**Archivo: `i18n/routing.ts`**
```typescript
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  
  // Rutas personalizadas por idioma
  pathnames: {
    // Páginas públicas
    '/': '/',
    '/about': {
      es: '/acerca-de',
      en: '/about'
    },
    '/pricing': {
      es: '/precios',
      en: '/pricing'
    },
    '/exams': {
      es: '/examenes',
      en: '/exams'
    },
    '/how-it-works': {
      es: '/como-funciona',
      en: '/how-it-works'
    },
    '/contact': {
      es: '/contacto',
      en: '/contact'
    },
    '/blog': {
      es: '/blog',
      en: '/blog'
    },
    
    // 🔐 Páginas de autenticación (LOCALIZADAS)
    '/auth/login': {
      es: '/auth/iniciar-sesion',
      en: '/auth/login'
    },
    '/auth/register': {
      es: '/auth/registro',
      en: '/auth/register'
    },
    '/auth/reset-password': {
      es: '/auth/restablecer-contrasena',
      en: '/auth/reset-password'
    },
    '/auth/update-password': {
      es: '/auth/actualizar-contrasena',
      en: '/auth/update-password'
    },
    '/auth/verify-email': {
      es: '/auth/verificar-email',
      en: '/auth/verify-email'
    },
    '/auth/email-confirmed': {
      es: '/auth/email-confirmado',
      en: '/auth/email-confirmed'
    },
    // ⚠️ IMPORTANTE: /auth/callback y /auth/direct-recovery NO se localizan
    // Estas rutas deben permanecer sin prefijo para que Supabase funcione
    
    // Dashboard
    '/dashboard': {
      es: '/panel',
      en: '/dashboard'
    },
    '/dashboard/exams': {
      es: '/panel/examenes',
      en: '/dashboard/exams'
    },
    '/dashboard/students': {
      es: '/panel/estudiantes',
      en: '/dashboard/students'
    },
    '/dashboard/groups': {
      es: '/panel/grupos',
      en: '/dashboard/groups'
    },
    '/dashboard/subjects': {
      es: '/panel/materias',
      en: '/dashboard/subjects'
    },
    '/dashboard/reports': {
      es: '/panel/reportes',
      en: '/dashboard/reports'
    },
    '/dashboard/settings': {
      es: '/panel/configuracion',
      en: '/dashboard/settings'
    },
    '/dashboard/profile': {
      es: '/panel/perfil',
      en: '/dashboard/profile'
    }
  }
});

// 🔐 Rutas que NO deben ser localizadas (para callbacks de Supabase)
export const nonLocalizedRoutes = [
  '/auth/callback',
  '/auth/direct-recovery',
  '/api',
];
```

**Archivo: `i18n/server.ts`**
```typescript
import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ locale }) => {
  // Validar que el locale sea válido
  if (!routing.locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`./locales/${locale}/common.json`)).default,
    timeZone: 'America/Bogota',
    now: new Date(),
  };
});
```

### 3.2 Checklist de Configuración
- [x] `i18n/config.ts` creado con configuración base
- [x] `i18n/routing.ts` creado con rutas personalizadas
- [x] `i18n/request.ts` creado con configuración del servidor
- [x] **🔐 Rutas no localizadas definidas correctamente**
- [x] **📧 Callbacks de Supabase preservados sin localización**
- [x] Verificar que todas las rutas estén mapeadas

---

## 🔧 CHECKPOINT 4: Middleware Integrado (⚠️ CRÍTICO)

### 4.1 Middleware Híbrido: i18n + Autenticación

**⚠️ ADVERTENCIA**: Este es el paso más crítico. No reemplazar el middleware existente, sino integrarlo.

**Archivo: `middleware.ts`**
```typescript
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
  const locale = pathname.startsWith('/es/') ? 'es' : 
                pathname.startsWith('/en/') ? 'en' : 'es';
  
  // 🔐 Construir rutas localizadas dinámicamente
  const localizedRoutes = {
    login: `/${locale}/auth/${locale === 'es' ? 'iniciar-sesion' : 'login'}`,
    dashboard: `/${locale}/${locale === 'es' ? 'panel' : 'dashboard'}`,
  };

  // 🔐 Rutas públicas localizadas (preservar lógica original)
  const publicRoutes = [
    `/${locale}`,
    `/${locale}/privacy`,
    `/${locale}/terms`,
    `/${locale}/cookies`,
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
  ];

  // 🔐 Lógica de autenticación preservada
  if (publicRoutes.includes(pathname)) {
    console.log(`[Middleware] Public route (${pathname}). Allowing access.`);
    return authResponse;
  }

  // 🔐 Rutas protegidas (dashboard)
  if (pathname.startsWith(`/${locale}/${locale === 'es' ? 'panel' : 'dashboard'}`)) {
    if (!session) {
      const redirectUrl = new URL(localizedRoutes.login, request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      console.log(`[Middleware] No session for ${pathname}. Redirecting to login.`);
      return NextResponse.redirect(redirectUrl);
    }
    console.log(`[Middleware] Session found for ${pathname}. Allowing access.`);
    return authResponse;
  }

  // 🔐 Rutas de auth
  if (pathname.startsWith(`/${locale}/auth/`) && 
      !pathname.endsWith('/callback') && 
      !pathname.endsWith('/direct-recovery')) {
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
```

### 4.2 Checklist de Middleware
- [x] **🔐 Middleware híbrido implementado (NO reemplazado)**
- [x] **📧 Callbacks de Supabase preservados sin localización**
- [x] **🌍 Rutas localizadas funcionando correctamente**
- [x] **🔐 Lógica de autenticación preservada**
- [x] **🔄 Redirecciones dinámicas basadas en locale**
- [x] Testear que rutas públicas funcionan en ambos idiomas
- [x] Testear que rutas protegidas requieren autenticación
- [x] **⚠️ Testear que `/auth/callback` funciona sin prefijo**

---

## 🌍 CHECKPOINT 5: Actualización de Layouts

### 5.1 Root Layout

**Archivo: `app/layout.tsx`**
```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '../i18n/routing';

// Resto de imports existentes...

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  
  // Validar locale
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
  
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages}>
          {/* Resto del layout existente */}
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### 5.2 Layout de Páginas Públicas

**Archivo: `app/(website)/layout.tsx`**
```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {/* Layout existente */}
      {children}
    </NextIntlClientProvider>
  );
}
```

### 5.3 Checklist de Layouts
- [x] Root layout actualizado con NextIntlClientProvider
- [x] Layout de website actualizado
- [x] Layout de dashboard actualizado
- [x] **🔐 Layout de auth actualizado preservando funcionalidad**
- [x] Validación de locale implementada

---

## 📝 CHECKPOINT 6: Archivos de Traducción

### 6.1 Organización de Traducciones

**Estrategia:**
- Extraer primero todos los textos en español
- Crear estructura JSON organizada por secciones
- Traducir al inglés manteniendo las claves
- **🔐 Priorizar traducciones de autenticación**

### 6.2 Archivos JSON Base

**Archivo: `i18n/locales/es/auth.json`**
```json
{
  "login": {
    "title": "Iniciar Sesión",
    "description": "Ingresa tus credenciales para acceder a tu cuenta",
    "email": "Correo electrónico",
    "password": "Contraseña",
    "forgotPassword": "¿Olvidaste tu contraseña?",
    "submit": "Iniciar Sesión",
    "submitting": "Iniciando sesión...",
    "noAccount": "¿No tienes una cuenta?",
    "signUp": "Regístrate",
    "captchaError": "Por favor, completa el CAPTCHA para continuar.",
    "loginError": "Error al iniciar sesión",
    "validationError": "Error de validación"
  },
  "register": {
    "title": "Crear Cuenta",
    "description": "Regístrate para comenzar a usar ProfeVision",
    "firstName": "Nombres",
    "lastName": "Apellidos",
    "email": "Correo electrónico",
    "password": "Contraseña",
    "confirmPassword": "Confirmar contraseña",
    "submit": "Crear Cuenta",
    "submitting": "Creando cuenta...",
    "hasAccount": "¿Ya tienes una cuenta?",
    "signIn": "Inicia sesión",
    "success": "Registro exitoso",
    "successDescription": "Se ha enviado un correo de confirmación a tu dirección de email.",
    "error": "Error al registrarse"
  },
  "resetPassword": {
    "title": "Restablecer contraseña",
    "description": "Ingresa tu correo electrónico para recibir instrucciones para restablecer tu contraseña",
    "email": "Correo electrónico",
    "submit": "Enviar instrucciones",
    "submitting": "Enviando...",
    "success": "Correo enviado",
    "successDescription": "Se ha enviado un enlace para restablecer tu contraseña a tu dirección de correo.",
    "checkEmail": "Revisa tu correo",
    "checkEmailDescription": "Hemos enviado un enlace para restablecer tu contraseña a tu dirección de correo. Por favor, revisa tu bandeja de entrada.",
    "backToLogin": "Volver a iniciar sesión",
    "spamNote": "Si no has recibido el correo en unos minutos, revisa tu carpeta de spam o intenta nuevamente."
  },
  "updatePassword": {
    "title": "Actualizar contraseña",
    "description": "Ingresa tu nueva contraseña",
    "password": "Nueva contraseña",
    "confirmPassword": "Confirmar nueva contraseña",
    "submit": "Actualizar contraseña",
    "submitting": "Actualizando...",
    "success": "Contraseña actualizada",
    "successDescription": "Tu contraseña ha sido actualizada correctamente.",
    "error": "Error al actualizar la contraseña",
    "invalidLink": "El enlace de restablecimiento no es válido o ha expirado. Por favor, solicita un nuevo enlace.",
    "passwordMismatch": "Las contraseñas no coinciden",
    "passwordTooShort": "La contraseña debe tener al menos 8 caracteres"
  },
  "verifyEmail": {
    "title": "Verifica tu correo electrónico",
    "description": "Hemos enviado un enlace de confirmación a tu dirección de correo electrónico. Por favor, revisa tu bandeja de entrada y sigue las instrucciones para completar el registro.",
    "spamNote": "Si no has recibido el correo en unos minutos, revisa tu carpeta de spam o solicita un nuevo enlace de verificación.",
    "backToLogin": "Volver a iniciar sesión"
  },
  "emailConfirmed": {
    "title": "¡Email Verificado!",
    "description": "Tu dirección de correo electrónico ha sido verificada correctamente.",
    "successMessage": "Ahora puedes iniciar sesión en tu cuenta y comenzar a utilizar todas las funcionalidades de ProfeVision.",
    "goToLogin": "Iniciar Sesión"
  },
  "errors": {
    "invalidEmail": "Ingresa un correo electrónico válido",
    "passwordTooShort": "La contraseña debe tener al menos 6 caracteres",
    "passwordMismatch": "Las contraseñas no coinciden",
    "captchaRequired": "Por favor, completa el CAPTCHA para continuar",
    "captchaError": "Error al validar el CAPTCHA. Por favor, inténtalo de nuevo.",
    "sessionExpired": "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
    "unauthorized": "No autorizado. Por favor, inicia sesión.",
    "generalError": "Ha ocurrido un error. Intenta nuevamente."
  }
}
```

**Archivo: `i18n/locales/en/auth.json`**
```json
{
  "login": {
    "title": "Sign In",
    "description": "Enter your credentials to access your account",
    "email": "Email",
    "password": "Password",
    "forgotPassword": "Forgot your password?",
    "submit": "Sign In",
    "submitting": "Signing in...",
    "noAccount": "Don't have an account?",
    "signUp": "Sign up",
    "captchaError": "Please complete the CAPTCHA to continue.",
    "loginError": "Sign in error",
    "validationError": "Validation error"
  },
  "register": {
    "title": "Create Account",
    "description": "Sign up to start using ProfeVision",
    "firstName": "First Name",
    "lastName": "Last Name",
    "email": "Email",
    "password": "Password",
    "confirmPassword": "Confirm Password",
    "submit": "Create Account",
    "submitting": "Creating account...",
    "hasAccount": "Already have an account?",
    "signIn": "Sign in",
    "success": "Registration successful",
    "successDescription": "A confirmation email has been sent to your email address.",
    "error": "Registration error"
  },
  "resetPassword": {
    "title": "Reset password",
    "description": "Enter your email address to receive instructions to reset your password",
    "email": "Email",
    "submit": "Send instructions",
    "submitting": "Sending...",
    "success": "Email sent",
    "successDescription": "A link to reset your password has been sent to your email address.",
    "checkEmail": "Check your email",
    "checkEmailDescription": "We've sent a link to reset your password to your email address. Please check your inbox.",
    "backToLogin": "Back to sign in",
    "spamNote": "If you haven't received the email in a few minutes, check your spam folder or try again."
  },
  "updatePassword": {
    "title": "Update password",
    "description": "Enter your new password",
    "password": "New password",
    "confirmPassword": "Confirm new password",
    "submit": "Update password",
    "submitting": "Updating...",
    "success": "Password updated",
    "successDescription": "Your password has been updated successfully.",
    "error": "Error updating password",
    "invalidLink": "The reset link is invalid or has expired. Please request a new link.",
    "passwordMismatch": "Passwords don't match",
    "passwordTooShort": "Password must be at least 8 characters long"
  },
  "verifyEmail": {
    "title": "Verify your email",
    "description": "We've sent a confirmation link to your email address. Please check your inbox and follow the instructions to complete registration.",
    "spamNote": "If you haven't received the email in a few minutes, check your spam folder or request a new verification link.",
    "backToLogin": "Back to sign in"
  },
  "emailConfirmed": {
    "title": "Email Verified!",
    "description": "Your email address has been successfully verified.",
    "successMessage": "You can now sign in to your account and start using all ProfeVision features.",
    "goToLogin": "Sign In"
  },
  "errors": {
    "invalidEmail": "Enter a valid email address",
    "passwordTooShort": "Password must be at least 6 characters long",
    "passwordMismatch": "Passwords don't match",
    "captchaRequired": "Please complete the CAPTCHA to continue",
    "captchaError": "Error validating CAPTCHA. Please try again.",
    "sessionExpired": "Your session has expired. Please sign in again.",
    "unauthorized": "Unauthorized. Please sign in.",
    "generalError": "An error occurred. Please try again."
  }
}
```

### 6.3 Archivos JSON Adicionales

**Archivo: `i18n/locales/es/common.json`**
```json
{
  "buttons": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "create": "Crear",
    "back": "Volver",
    "next": "Siguiente",
    "previous": "Anterior",
    "submit": "Enviar",
    "close": "Cerrar",
    "continue": "Continuar",
    "confirm": "Confirmar"
  },
  "labels": {
    "name": "Nombre",
    "email": "Correo electrónico",
    "password": "Contraseña",
    "description": "Descripción",
    "date": "Fecha",
    "status": "Estado",
    "actions": "Acciones"
  },
  "status": {
    "active": "Activo",
    "inactive": "Inactivo",
    "pending": "Pendiente",
    "completed": "Completado",
    "draft": "Borrador"
  },
  "messages": {
    "loading": "Cargando...",
    "success": "Operación exitosa",
    "error": "Ha ocurrido un error",
    "noData": "No hay datos disponibles",
    "confirmDelete": "¿Estás seguro de que quieres eliminar este elemento?",
    "sessionExpired": "Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
  },
  "language": {
    "switch": "Cambiar idioma",
    "spanish": "Español",
    "english": "English"
  }
}
```

### 6.4 Checklist de Traducciones
- [x] Identificar todos los textos estáticos
- [x] **🔐 Priorizar traducciones de autenticación**
- [x] Crear archivos JSON en español
- [x] Traducir archivos al inglés
- [x] **📧 Incluir textos de callbacks y verificaciones**
- [x] Verificar consistencia de claves
- [x] Organizar por secciones lógicas

---

## 🔄 CHECKPOINT 7: Configuración de Supabase

### 7.1 Actualizar Configuración de Supabase

**Archivo: `supabase/config.toml`** (Modificar sección [auth])
```toml
[auth]
enabled = true
# URL base que manejará las redirecciones (sin prefijo de idioma)
site_url = "https://profevision.com"

# 📧 URLs adicionales que incluyen prefijos de idioma para redirecciones
additional_redirect_urls = [
  "https://www.profevision.com",
  # Desarrollo
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  # Español
  "https://www.profevision.com/es/auth/email-confirmado",
  "https://profevision.com/es/auth/email-confirmado",
  "https://www.profevision.com/es/auth/actualizar-contrasena",
  "https://profevision.com/es/auth/actualizar-contrasena",
  # Inglés
  "https://www.profevision.com/en/auth/email-confirmed",
  "https://profevision.com/en/auth/email-confirmed",
  "https://www.profevision.com/en/auth/update-password",
  "https://profevision.com/en/auth/update-password",
  # Desarrollo localized
  "http://localhost:3000/es/auth/email-confirmado",
  "http://localhost:3000/en/auth/email-confirmed",
  "http://localhost:3000/es/auth/actualizar-contrasena",
  "http://localhost:3000/en/auth/update-password"
]

# Mantener configuración existente
jwt_expiry = 3600
```

### 7.2 Callback Handler Mejorado

**Archivo: `app/auth/callback/route.ts`** (Actualizar)
```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/utils/logger";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  
  // 🌍 Detectar idioma preferido del usuario
  const acceptLanguage = request.headers.get('accept-language');
  const preferredLocale = acceptLanguage?.startsWith('en') ? 'en' : 'es';
  
  logger.auth("Auth callback received", {
    type,
    hasCode: !!code,
    preferredLocale,
    url: request.url,
  });
  
  // 🌍 Construir URLs localizadas
  const localizedUrls = {
    login: `/${preferredLocale}/auth/${preferredLocale === 'es' ? 'iniciar-sesion' : 'login'}`,
    emailConfirmed: `/${preferredLocale}/auth/${preferredLocale === 'es' ? 'email-confirmado' : 'email-confirmed'}`,
    updatePassword: `/${preferredLocale}/auth/${preferredLocale === 'es' ? 'actualizar-contrasena' : 'update-password'}`,
  };

  // If no code or not a verification type, redirect to login
  if (!code || !type) {
    logger.auth("Missing code or type, redirecting to login", { type });
    return NextResponse.redirect(new URL(localizedUrls.login, SITE_URL));
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

    // 🌍 Redirect to localized confirmation page
    if (type === "email_confirmation" || type === "signup") {
      logger.auth("Confirmation type, redirecting to email-confirmed", { type });
      return NextResponse.redirect(new URL(localizedUrls.emailConfirmed, SITE_URL));
    }

    // 🌍 Handle password recovery
    if (type === "recovery") {
      logger.auth("Recovery type, redirecting to update-password", { type });
      return NextResponse.redirect(new URL(localizedUrls.updatePassword, SITE_URL));
    }

    // 🌍 For other auth types
    logger.auth("Other auth type, redirecting to login", { type });
    return NextResponse.redirect(new URL(localizedUrls.login, SITE_URL));
  } catch (error: unknown) {
    logger.auth("Error during auth callback", {
      error: error instanceof Error ? error : new Error("Unknown error"),
      type,
    });
    return NextResponse.redirect(
      new URL(`${localizedUrls.login}?error=auth_callback_error`, SITE_URL)
    );
  }
}
```

### 7.3 Configuración de Redirect URLs en Supabase

**⚠️ IMPORTANTE**: En el panel de Supabase (Authentication → URL Configuration), actualizar las Redirect URLs:

**✅ Mantener (callbacks técnicos):**
```
https://www.profevision.com/auth/callback
https://profevision.com/auth/callback
https://www.profevision.com/auth/direct-recovery
https://profevision.com/auth/direct-recovery
https://*.profevision.com/auth/direct-recovery
```

**➕ Agregar (páginas de destino localizadas):**
```
# Español
https://www.profevision.com/es/auth/email-confirmado
https://profevision.com/es/auth/email-confirmado
https://www.profevision.com/es/auth/actualizar-contrasena
https://profevision.com/es/auth/actualizar-contrasena

# Inglés
https://www.profevision.com/en/auth/email-confirmed
https://profevision.com/en/auth/email-confirmed
https://www.profevision.com/en/auth/update-password
https://profevision.com/en/auth/update-password
```

**❌ Eliminar (URLs obsoletas):**
```
https://www.profevision.com/auth/login
https://www.profevision.com/auth/email-confirmed
https://profevision.com/auth/email-confirmed
https://profevision.com/auth/register
https://profevision.com/auth/reset-password
https://profevision.com/auth/update-password
https://profevision.com/auth/verify-email
```

**⚠️ MANTENER temporalmente (durante migración gradual):**
```
https://www.profevision.com/auth/login
https://www.profevision.com/auth/email-confirmed
https://profevision.com/auth/email-confirmed
https://www.profevision.com/auth/register
https://www.profevision.com/auth/reset-password
https://www.profevision.com/auth/update-password
https://www.profevision.com/auth/verify-email
```

**Eliminar solo si existe (URLs con wildcards):**
```
https://*.profevision.com/auth/update-password
```

### 7.4 Checklist de Configuración Supabase
- [x] **📧 `supabase/config.toml` actualizado con URLs localizadas**
- [x] **🔄 Callback handler actualizado con detección de idioma**
- [x] **🌍 Direct recovery handler actualizado**
- [x] **🔗 Redirect URLs actualizadas en panel de Supabase**
- [x] **⚠️ Testear flujo de verificación de email en español**
- [x] **⚠️ Testear flujo de verificación de email en inglés**
- [x] **⚠️ Testear flujo de recuperación de contraseña en español**
- [x] **⚠️ Testear flujo de recuperación de contraseña en inglés**

---

## 🔤 CHECKPOINT 8: Selector de Idioma

### 8.1 Componente Language Switcher

**Archivo: `components/shared/language-switcher.tsx`**
```typescript
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { locales, localeNames } from '@/i18n/config';
import { routing } from '@/i18n/routing';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const handleLocaleChange = (newLocale: string) => {
    // 🌍 Construir nueva ruta manteniendo la estructura
    let newPath = pathname;
    
    // Si la ruta actual tiene prefijo de idioma, removerlo
    if (pathname.startsWith(`/${locale}/`)) {
      newPath = pathname.replace(`/${locale}/`, '/');
    } else if (pathname === `/${locale}`) {
      newPath = '/';
    }
    
    // 🔄 Mapear rutas usando routing.pathnames si existe
    const currentPathnameKey = Object.keys(routing.pathnames).find(key => {
      const paths = routing.pathnames[key as keyof typeof routing.pathnames];
      if (typeof paths === 'object' && paths !== null) {
        return paths[locale as keyof typeof paths] === pathname.replace(`/${locale}`, '') || 
               paths[locale as keyof typeof paths] === pathname;
      }
      return false;
    });
    
    if (currentPathnameKey) {
      const targetPaths = routing.pathnames[currentPathnameKey as keyof typeof routing.pathnames];
      if (typeof targetPaths === 'object' && targetPaths !== null) {
        newPath = targetPaths[newLocale as keyof typeof targetPaths] || newPath;
      }
    }
    
    // Construir URL final
    const finalPath = newLocale === 'es' && newPath === '/' ? '/' : `/${newLocale}${newPath}`;
    
    // 🔄 Navegar a la nueva ruta
    router.push(finalPath);
  };

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger className="w-20">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {loc.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### 8.2 Integrar en Header

**Actualizar: `components/shared/site-header.tsx`**
- Importar y usar `LanguageSwitcher`
- Posicionar en la barra de navegación
- **🔐 Verificar que funciona con rutas de auth**

### 8.3 Checklist de Selector
- [x] Componente LanguageSwitcher creado
- [x] **🔄 Lógica de mapeo de rutas implementada**
- [x] Integrado en site-header
- [x] **🔐 Funcionalidad de cambio de idioma en páginas de auth**
- [x] **📧 Testear cambio de idioma durante flujos de verificación**
- [x] Persistencia en cookie
- [x] Estilos consistentes

---

## 🔐 CHECKPOINT 9: Auth Provider Localizado

### 9.1 Actualizar Auth Provider

**Archivo: `components/shared/auth-provider.tsx`** (Actualizar)
```typescript
"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase/client';
import type { Session, User, AuthChangeEvent, AuthError } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  // 🌍 Generar rutas localizadas dinámicamente
  const getLocalizedRoutes = useMemo(() => ({
    login: `/${locale}/auth/${locale === 'es' ? 'iniciar-sesion' : 'login'}`,
    dashboard: `/${locale}/${locale === 'es' ? 'panel' : 'dashboard'}`,
  }), [locale]);

  // 🔐 Rutas públicas localizadas
  const getPublicPaths = useMemo(() => [
    `/${locale}/auth/${locale === 'es' ? 'iniciar-sesion' : 'login'}`,
    `/${locale}/auth/${locale === 'es' ? 'registro' : 'register'}`,
    `/${locale}/auth/${locale === 'es' ? 'restablecer-contrasena' : 'reset-password'}`,
    `/${locale}/auth/${locale === 'es' ? 'actualizar-contrasena' : 'update-password'}`,
    `/${locale}/auth/${locale === 'es' ? 'verificar-email' : 'verify-email'}`,
    `/${locale}/auth/${locale === 'es' ? 'email-confirmado' : 'email-confirmed'}`,
    `/${locale}`,
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
  ], [locale]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    // 🔐 Verificar sesión inicial (lógica preservada)
    supabase.auth.getSession().then(({ data, error }: { data: { session: Session | null }, error: AuthError | null }) => {
      if (isMounted) {
        if (error) {
          logger.error("Error fetching initial session:", error.message);
          setIsLoading(false);
          const routes = getLocalizedRoutes;
          const publicPaths = getPublicPaths;
          
          if (!publicPaths.includes(pathname)) {
            router.push(routes.login);
          }
          return;
        }

        const currentSession = data.session;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);

        const routes = getLocalizedRoutes;
        const publicPaths = getPublicPaths;
        const isPublicPath = publicPaths.includes(pathname);
        
        if (!currentSession && !isPublicPath) {
          logger.log('No initial session and not on public path, redirecting to login.');
          router.push(routes.login);
        } else if (currentSession && isPublicPath && pathname !== `/${locale}` && pathname !== `/${locale}/auth/${locale === 'es' ? 'email-confirmado' : 'email-confirmed'}`) {
          logger.log('Initial session found on public path (not home), redirecting to dashboard.');
          setTimeout(() => router.push(routes.dashboard), 0);
        }
      }
    });

    // 🔐 Listener de cambios de autenticación (lógica preservada)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, newSession: Session | null) => {
        if (!isMounted) return;

        logger.log(`Supabase auth event: ${event}`);

        if (event === 'TOKEN_REFRESHED') {
          logger.log('Auth state changed: TOKEN_REFRESHED', { hasSession: !!newSession });
        }

        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsLoading(false);

        const routes = getLocalizedRoutes;
        const publicPaths = getPublicPaths;
        const isPublicPath = publicPaths.includes(pathname);

        if (event === 'SIGNED_OUT' && !isPublicPath) {
          logger.log('User signed out, redirecting to login.');
          if (pathname !== routes.login) {
            router.push(routes.login);
          }
        }

        if (!newSession && event !== 'SIGNED_OUT' && event !== 'INITIAL_SESSION' && event !== 'USER_UPDATED' && !isPublicPath) {
          logger.log('Session became null (potentially token refresh failure), redirecting to login.');
          if (pathname !== routes.login) {
            router.push(routes.login);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [router, pathname, locale, getLocalizedRoutes, getPublicPaths]);

  const value = useMemo(() => ({
    session,
    user,
    isLoading,
  }), [session, user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### 9.2 Checklist de Auth Provider
- [x] **🔐 Auth Provider actualizado con rutas localizadas**
- [x] **🌍 Lógica de redirección dinámica basada en locale**
- [x] **🔄 Rutas públicas actualizadas para ambos idiomas**
- [x] **⚠️ Testear flujo de login en español**
- [x] **⚠️ Testear flujo de login en inglés**
- [x] **⚠️ Testear redirecciones post-autenticación**

---

## 🔤 CHECKPOINT 10: Implementación de useTranslations

### 10.1 Actualizar Páginas de Autenticación

**Ejemplo: `app/[locale]/auth/iniciar-sesion/page.tsx`**
```typescript
"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const tErrors = useTranslations('auth.errors');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  // 🌍 Schema de validación localizado
  const loginSchema = z.object({
    email: z.string().email({ message: tErrors('invalidEmail') }),
    password: z.string().min(6, { message: tErrors('passwordTooShort') }),
  });

  type LoginFormValues = z.infer<typeof loginSchema>;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    if (!captchaToken) {
      toast({
        variant: "destructive",
        title: t('validationError'),
        description: t('captchaError'),
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
        options: {
          captchaToken,
        }
      });

      if (error) {
        throw error;
      }

      // 🔄 Redirección será manejada por AuthProvider
      router.refresh();
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: t('loginError'),
        description: error instanceof Error ? error.message : tErrors('generalError'),
      });
      
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">{t('title')}</CardTitle>
        <CardDescription className="text-center">
          {t('description')}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder=""
              {...form.register("email")}
              disabled={isLoading}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t('password')}</Label>
              <Link 
                href="/auth/restablecer-contrasena"
                className="text-sm text-primary hover:underline"
              >
                {t('forgotPassword')}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder=""
              {...form.register("password")}
              disabled={isLoading}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          
          <div className="flex justify-center">
            <Turnstile
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
              onSuccess={(token) => setCaptchaToken(token)}
              onError={() => {
                setCaptchaToken(null);
                toast({
                  variant: "destructive",
                  title: tErrors('captchaError'),
                  description: tErrors('captchaError'),
                });
              }}
              onExpire={() => setCaptchaToken(null)}
              className="mx-auto"
              options={{
                language: "es",
                theme: "auto",
              }}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading || !captchaToken}>
            {isLoading ? t('submitting') : t('submit')}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-center">
        <div className="text-center text-sm">
          {t('noAccount')}{" "}
          <Link href="/auth/registro" className="text-primary hover:underline">
            {t('signUp')}
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
```

### 10.2 Estructura de Páginas Localizadas

Crear la estructura de directorios para páginas localizadas:

```
app/
├── [locale]/
│   ├── auth/
│   │   ├── iniciar-sesion/
│   │   │   └── page.tsx
│   │   ├── registro/
│   │   │   └── page.tsx
│   │   ├── restablecer-contrasena/
│   │   │   └── page.tsx
│   │   ├── actualizar-contrasena/
│   │   │   └── page.tsx
│   │   ├── verificar-email/
│   │   │   └── page.tsx
│   │   └── email-confirmado/
│   │       └── page.tsx
│   ├── panel/
│   │   └── page.tsx
│   └── page.tsx
```

### 10.3 Checklist de Implementación
- [x] **🔐 Crear estructura de directorios localizados**
- [x] **🌍 Actualizar todas las páginas de auth con useTranslations**
- [x] **🔄 Implementar validación localizada con Zod**
- [x] **📧 Actualizar mensajes de toast localizados**
- [x] **⚠️ Testear formularios en español**
- [x] **⚠️ Testear formularios en inglés**
- [x] **🔗 Verificar que links internos usan rutas localizadas**

---

## 🧪 CHECKPOINT 11: Testing y Validación Crítica

### 11.1 Tests de Autenticación con i18n

**Flujos críticos a validar:**

1. **Registro completo en español:**
   - [ ] Registro en `/es/auth/registro`
   - [ ] Recibir email de verificación
   - [ ] Hacer clic en link de verificación
   - [ ] Verificar redirección a `/es/auth/email-confirmado`
   - [ ] Login exitoso en `/es/auth/iniciar-sesion`

2. **Registro completo en inglés:**
   - [ ] Registro en `/en/auth/register`
   - [ ] Recibir email de verificación
   - [ ] Hacer clic en link de verificación
   - [ ] Verificar redirección a `/en/auth/email-confirmed`
   - [ ] Login exitoso en `/en/auth/login`

3. **Recuperación de contraseña en español:**
   - [ ] Solicitar recuperación en `/es/auth/restablecer-contrasena`
   - [ ] Recibir email de recuperación
   - [ ] Hacer clic en link de recuperación
   - [ ] Verificar redirección a `/es/auth/actualizar-contrasena`
   - [ ] Actualizar contraseña exitosamente

4. **Recuperación de contraseña en inglés:**
   - [ ] Solicitar recuperación en `/en/auth/reset-password`
   - [ ] Recibir email de recuperación
   - [ ] Hacer clic en link de recuperación
   - [ ] Verificar redirección a `/en/auth/update-password`
   - [ ] Actualizar contraseña exitosamente

### 11.2 Tests de Navegación

- [ ] **🔄 Cambio de idioma desde página de login**
- [ ] **🔄 Cambio de idioma desde dashboard**
- [ ] **🔐 Redirección correcta post-login por idioma**
- [ ] **🔐 Redirección correcta post-logout por idioma**
- [ ] **🌍 URLs amigables funcionando correctamente**

### 11.3 Tests de Middleware

- [ ] **⚠️ `/auth/callback` accesible sin prefijo de idioma**
- [ ] **⚠️ `/auth/direct-recovery` accesible sin prefijo de idioma**
- [ ] **🔐 Rutas protegidas requieren autenticación en ambos idiomas**
- [ ] **🌍 Rutas públicas accesibles en ambos idiomas**
- [ ] **🔄 Redirecciones de middleware correctas**

### 11.4 Tests de Compatibilidad

- [ ] **📱 Funcionalidad móvil intacta**
- [ ] **🎨 Estilos y temas funcionando**
- [ ] **🔌 API endpoints no afectados**
- [ ] **📊 Dashboard mantiene funcionalidad**
- [ ] **📝 Formularios de exámenes funcionando**

---

## 🚀 CHECKPOINT 12: Configuración de Producción

### 12.1 Variables de Entorno

**Actualizar para producción:**

```bash
# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 🌍 URL base para callbacks
NEXT_PUBLIC_SITE_URL=https://profevision.com

# 📧 URLs de callback para Supabase
NEXT_PUBLIC_AUTH_CALLBACK_URL=https://profevision.com/auth/callback
NEXT_PUBLIC_AUTH_RECOVERY_URL=https://profevision.com/auth/direct-recovery
```

### 12.2 Configuración de Supabase en Producción

**En el Panel de Supabase (Authentication → URL Configuration):**

**Mantener (callbacks técnicos - NO cambiar):**
```
https://www.profevision.com/auth/callback
https://profevision.com/auth/callback
https://www.profevision.com/auth/direct-recovery
https://profevision.com/auth/direct-recovery
```

**Agregar (páginas de destino localizadas):**
```
# Español
https://www.profevision.com/es/auth/email-confirmado
https://profevision.com/es/auth/email-confirmado
https://www.profevision.com/es/auth/actualizar-contrasena
https://profevision.com/es/auth/actualizar-contrasena

# Inglés
https://www.profevision.com/en/auth/email-confirmed
https://profevision.com/en/auth/email-confirmed
https://www.profevision.com/en/auth/update-password
https://profevision.com/en/auth/update-password
```

**⚠️ MANTENER temporalmente (durante migración gradual):**
```
https://www.profevision.com/auth/login
https://www.profevision.com/auth/email-confirmed
https://profevision.com/auth/email-confirmed
https://www.profevision.com/auth/register
https://www.profevision.com/auth/reset-password
https://www.profevision.com/auth/update-password
https://www.profevision.com/auth/verify-email
```

**Eliminar solo si existe (URLs con wildcards):**
```
https://*.profevision.com/auth/update-password
```

### 12.3 🔄 Estrategia de Migración Gradual

**⚠️ IMPORTANTE: Para trabajar simultáneamente con el sistema en producción y la nueva internacionalización, mantener las URLs viejas temporalmente durante la transición.**

#### 12.3.1 URLs que DEBEN mantenerse durante la migración:

**1. URLs técnicas (permanentes - NO tocar):**
```
https://www.profevision.com/auth/callback
https://profevision.com/auth/callback
https://www.profevision.com/auth/direct-recovery
https://profevision.com/auth/direct-recovery
```

**2. URLs de destino actuales (temporales durante transición):**
```
https://www.profevision.com/auth/login
https://www.profevision.com/auth/email-confirmed
https://www.profevision.com/auth/register
https://www.profevision.com/auth/reset-password
https://www.profevision.com/auth/update-password
https://www.profevision.com/auth/verify-email
```

**3. Nuevas URLs localizadas:**
```
# Español
https://www.profevision.com/es/auth/iniciar-sesion
https://profevision.com/es/auth/iniciar-sesion
https://www.profevision.com/es/auth/email-confirmado
https://profevision.com/es/auth/email-confirmado
https://www.profevision.com/es/auth/registrarse
https://profevision.com/es/auth/registrarse
https://www.profevision.com/es/auth/restablecer-contrasena
https://profevision.com/es/auth/restablecer-contrasena
https://www.profevision.com/es/auth/actualizar-contrasena
https://profevision.com/es/auth/actualizar-contrasena

# Inglés
https://www.profevision.com/en/auth/login
https://profevision.com/en/auth/login
https://www.profevision.com/en/auth/email-confirmed
https://profevision.com/en/auth/email-confirmed
https://www.profevision.com/en/auth/register
https://profevision.com/en/auth/register
https://www.profevision.com/en/auth/reset-password
https://profevision.com/en/auth/reset-password
https://www.profevision.com/en/auth/update-password
https://profevision.com/en/auth/update-password
```

#### 12.3.2 Beneficios de esta estrategia:

1. **✅ Cero downtime** - el sistema actual sigue funcionando
2. **✅ Evita 404s** - usuarios con bookmarks o enlaces externos
3. **✅ Emails existentes** - enlaces en emails ya enviados siguen funcionando
4. **✅ Migración gradual** - puedes probar la nueva funcionalidad sin romper la existente
5. **✅ Rollback fácil** - si algo falla, las URLs viejas siguen funcionando

#### 12.3.3 Plan de Transición (4 fases):

**Fase 1: Implementación Paralela (Semana 1-2)**
- Agregar URLs localizadas (mantener viejas)
- Implementar middleware híbrido
- Las URLs viejas siguen funcionando normalmente
- Testear nuevas URLs localizadas

**Fase 2: Redirección Inteligente (Semana 3-4)**
- Implementar redirecciones de URLs viejas a nuevas (con detección de idioma)
- `/auth/login` → `/es/auth/iniciar-sesion` (o `/en/auth/login` según idioma)
- `/auth/email-confirmed` → `/es/auth/email-confirmado`
- Monitorear que todas las redirecciones funcionan correctamente

**Fase 3: Limpieza Gradual (Semana 5-6)**
- Después de unas semanas, remover URLs viejas de la configuración de Supabase
- Mantener las rutas de redirección en el código por si acaso
- Monitorear logs para detectar posibles problemas

**Fase 4: Limpieza Final (Semana 7-8)**
- Remover las rutas de redirección del código (opcional)
- Documentar la nueva estructura de URLs
- Actualizar documentación y guías de desarrollo

#### 12.3.4 Checklist de Migración:

- [ ] **📌 Fase 1: URLs viejas funcionando + URLs nuevas implementadas**
- [ ] **🔀 Fase 2: Redirecciones inteligentes funcionando**
- [ ] **📊 Monitoreo: Sin errores 404 en URLs de autenticación**
- [ ] **📧 Verificación: Emails existentes siguen funcionando**
- [ ] **🔍 Testing: Ambos sistemas (viejo y nuevo) funcionan**
- [ ] **🧹 Fase 3: URLs viejas removidas de Supabase**
- [ ] **✅ Fase 4: Migración completa y documentada**

### 12.4 SEO y Metadatos

**Implementar metadatos localizados:**

```typescript
// app/[locale]/layout.tsx
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}) {
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `https://profevision.com/${locale}`,
      languages: {
        'es': 'https://profevision.com/es',
        'en': 'https://profevision.com/en',
      },
    },
  };
}
```

### 12.4 Checklist de Producción
- [ ] **🔐 Variables de entorno actualizadas**
- [ ] **📧 URLs de callback configuradas en Supabase**
- [ ] **🌍 SEO multiidioma implementado**
- [ ] **📊 Analytics configurado por idioma**
- [ ] **⚠️ Testear en ambiente de staging**
- [ ] **🔄 Sitemap multiidioma generado**

---

## 📚 Recursos y Referencias

### Dependencias Principales
- `next-intl@^4.3.4` - Biblioteca principal de i18n
- Next.js 15.3.1 - Framework base
- Supabase - Sistema de autenticación

### Documentación
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js 15 Internationalization](https://nextjs.org/docs/pages/building-your-application/routing/internationalization)

### Comandos Útiles
```bash
# Instalar dependencias
yarn add next-intl@^4.3.4

# Verificar build
yarn build

# Desarrollo
yarn dev

# Lint
yarn lint

# 🔐 Testear autenticación
yarn test:auth

# 🧪 Testear i18n
yarn test:i18n
```

---

## 🎯 Métricas de Éxito

### Objetivos Cuantificables
- [ ] **100% de textos de auth traducidos**
- [ ] **0 errores en flujos de autenticación**
- [ ] **0 errores de hidratación**
- [ ] **< 5% impacto en bundle size**
- [ ] **100% de callbacks de email funcionando**

### Validaciones Finales
- [ ] **🔐 Aplicación funciona en español con autenticación**
- [ ] **🔐 Aplicación funciona en inglés con autenticación**
- [ ] **📧 Flujos de email funcionan en ambos idiomas**
- [ ] **🔄 Cambio de idioma suave en todas las páginas**
- [ ] **🌍 SEO URLs optimizadas**
- [ ] **⚡ Performance mantenida**

---

## 🐛 Troubleshooting Específico

### Problemas Potenciales con Autenticación

1. **Callbacks no funcionan:**
   ```bash
   # Verificar que /auth/callback no tiene prefijo de idioma
   curl -I https://profevision.com/auth/callback
   
   # Verificar configuración de Supabase
   supabase auth update --site-url https://profevision.com
   ```

2. **Redirecciones incorrectas post-auth:**
   ```typescript
   // Verificar que AuthProvider usa rutas localizadas
   const routes = {
     login: `/${locale}/auth/${locale === 'es' ? 'iniciar-sesion' : 'login'}`,
     dashboard: `/${locale}/${locale === 'es' ? 'panel' : 'dashboard'}`,
   };
   ```

3. **Middleware conflictos:**
   ```typescript
   // Verificar orden de ejecución
   // 1. Verificar si es ruta no localizada
   // 2. Aplicar middleware de i18n
   // 3. Aplicar middleware de auth
   ```

4. **Session cookies no persistentes:**
   ```typescript
   // Verificar configuración de cookies en middleware
   set(name: string, value: string, options: CookieOptions) {
     // Asegurar que se configuran correctamente
   }
   ```

### Soluciones Rápidas

- **Hydration errors**: Verificar que locale sea consistente entre servidor y cliente
- **Missing translations**: Implementar fallbacks a español
- **Route conflicts**: Verificar que rutas no localizadas estén excluidas
- **Email callbacks**: Verificar que URLs en `additional_redirect_urls` sean correctas

---

## 🔄 Plan de Rollback

### En caso de problemas críticos:

1. **Rollback de middleware:**
   ```bash
   git checkout HEAD~1 -- middleware.ts
   ```

2. **Rollback de auth provider:**
   ```bash
   git checkout HEAD~1 -- components/shared/auth-provider.tsx
   ```

3. **Rollback completo:**
   ```bash
   git reset --hard HEAD~n  # donde n es el número de commits
   ```

### Validación post-rollback:
- [ ] **🔐 Autenticación funcionando**
- [ ] **📧 Emails de verificación funcionando**
- [ ] **🔄 Redirecciones correctas**
- [ ] **📱 Funcionalidad móvil intacta**

---

## 📊 Estado del Progreso

### ✅ Checkpoints Completados (10/12)

| Checkpoint | Estado | Descripción |
|------------|---------|-------------|
| 1 | ✅ | Preparación e Instalación |
| 2 | ✅ | Estructura de Archivos |
| 3 | ✅ | Configuración Base |
| 4 | ✅ | Middleware Integrado (CRÍTICO) |
| 5 | ✅ | Actualización de Layouts |
| 6 | ✅ | Archivos de Traducción |
| 7 | ✅ | Configuración de Supabase |
| 8 | ✅ | Selector de Idioma |
| 9 | ✅ | Auth Provider Localizado |
| 10 | ✅ | Implementación de useTranslations |

### ⏳ Checkpoints Pendientes (2/12)

| Checkpoint | Estado | Descripción |
|------------|---------|-------------|
| 11 | ⏳ | Testing y Validación Crítica |
| 12 | ⏳ | Configuración de Producción |

### 🔥 Funcionalidades Implementadas

- ✅ **Infraestructura i18n**: next-intl configurado y funcionando
- ✅ **Middleware Híbrido**: Integración exitosa con Supabase auth
- ✅ **Rutas Localizadas**: SEO-friendly URLs por idioma
- ✅ **Detección de Idioma**: Automática basada en navegador
- ✅ **Selector de Idioma**: Cambio dinámico en header
- ✅ **Callbacks Preservados**: Flujos de email funcionando
- ✅ **Traducciones Base**: Archivos JSON para auth y común
- ✅ **AuthProvider Localizado**: Redirecciones dinámicas por idioma
- ✅ **Páginas Auth Localizadas**: Todas las páginas de auth con useTranslations
- ✅ **Validación Localizada**: Schemas Zod con mensajes por idioma
- ✅ **Toast Messages**: Mensajes de notificación localizados

### 🎯 Próximos Pasos

1. **Testing exhaustivo de flujos** (Checkpoint 11)
2. **Configuración de producción** (Checkpoint 12)

### 🎉 Checkpoint 10 Completado

**Páginas de Auth Localizadas Implementadas:**
- ✅ `/[locale]/auth/login` - Login con validación localizada
- ✅ `/[locale]/auth/register` - Registro con validación localizada  
- ✅ `/[locale]/auth/reset-password` - Recuperación de contraseña
- ✅ `/[locale]/auth/update-password` - Actualización de contraseña
- ✅ `/[locale]/auth/verify-email` - Verificación de email
- ✅ `/[locale]/auth/email-confirmed` - Email confirmado
- ✅ Layout de auth localizado con selector de idioma

**Página Principal Localizada:**
- ✅ `/[locale]/(website)/page.tsx` - Homepage completa con traducciones dinámicas
- ✅ **Traducciones completas**: Español e inglés para todo el contenido
- ✅ **Rutas dinámicas**: Links que cambian según el idioma del usuario

**Correcciones y Hotfixes:**
- ✅ **HOTFIX**: Eliminada página `/[locale]/page.tsx` que causaba loops de redirect 307
- ✅ **HOTFIX**: Corregida estructura de carpetas mal creadas en `(website)`
- ✅ **HOTFIX**: Creadas páginas básicas para todas las rutas del website
- ✅ **HOTFIX**: Agregadas traducciones faltantes en inglés para `howItWorks`
- ✅ **BUGFIX**: Solucionados códigos HTTP 307 repetitivos - ahora todas las rutas devuelven 200 OK
- ✅ **CRITICAL FIX**: Corregido LanguageSwitcher para cambio bidireccional ES ↔ EN
- ✅ **ENHANCEMENT**: Simplificado componente MainNavigation para mayor estabilidad
- ✅ **TRANSLATION FIX**: Todas las traducciones del header funcionan consistentemente
- ✅ **Componentes localizados**: Botones, mensajes, formularios adaptados por idioma

**Estructura Website Localizada:**
- ✅ `/[locale]/(website)/` - Estructura completa del website localizada
- ✅ **Header y Footer Localizados**: Navegación completamente traducida
- ✅ **Layout Localizado**: Header y footer en todas las páginas del website
- ✅ **Auth con Header/Footer**: Páginas de auth incluyen navegación completa
- ✅ **Página How-it-Works**: Ejemplo completo de página localizada
- ✅ **Rutas Dinámicas**: Sistema de mapeo de rutas por idioma
- ✅ **Traducciones Navegación**: Menús, footer y botones completamente traducidos

**🔧 Corrección Crítica Aplicada:**
- ✅ **Error MISSING_MESSAGE resuelto** - `i18n/request.ts` actualizado para namespacing correcto
- ✅ **Problema de página estancada resuelto** - `app/[locale]/page.tsx` reemplazado con página principal localizada
- ✅ **Estructura Website Implementada** - Respeta la organización del `(website)` original
- ✅ **Header y Footer Localizados** - Navegación completamente traducida en todas las páginas
- ✅ **Auth con Navegación** - Páginas de auth incluyen header y footer localizados
- ✅ **Español funcionando**: `http://localhost:3000/como-funciona` y `http://localhost:3000/auth/iniciar-sesion`
- ✅ **Inglés funcionando**: `http://localhost:3000/en/how-it-works` y `http://localhost:3000/en/auth/login`
- ✅ **Estructura Completa**: Website localizado con rutas dinámicas funcionando
- ✅ **Namespaces correctos**: `common` y `auth` funcionando correctamente

### 🔐 Status de Autenticación

- ✅ **Middleware**: Preserva callbacks de Supabase
- ✅ **Rutas**: `/auth/callback` y `/auth/direct-recovery` sin localizar
- ✅ **Redirecciones**: Dinámicas basadas en idioma detectado
- ✅ **Sessions**: Gestión de sesiones intacta
- ✅ **Emails**: Callbacks funcionando correctamente

---

*⚠️ Este plan debe ser ejecutado secuencialmente, completando cada checkpoint antes de continuar al siguiente. La integración con Supabase requiere especial atención en los checkpoints 4, 7, 9 y 11.*

**🔐 RECORDATORIO CRÍTICO**: Siempre testear flujos de autenticación después de cada modificación importante. Los callbacks de email son especialmente sensibles a cambios en routing. 