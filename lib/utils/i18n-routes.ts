/**
 * Utilidad para generar rutas localizadas correctamente
 * Maneja automáticamente el prefijo de idioma según la configuración de next-intl
 */

export type LocalizedRoute = {
  es: string;
  en: string;
};

/**
 * Genera una ruta localizada correctamente según el locale actual
 * @param locale - El locale actual ('es' o 'en')
 * @param route - La definición de la ruta para ambos idiomas
 * @returns La ruta correcta con o sin prefijo según la configuración
 */
export function getLocalizedRoute(locale: string, route: LocalizedRoute): string {
  // Para español (defaultLocale), no usar prefijo según localePrefix: 'as-needed'
  if (locale === 'es') {
    return route.es;
  }
  
  // Para inglés, usar prefijo /en
  if (locale === 'en') {
    return route.en;
  }
  
  // Fallback a español si el locale no es reconocido
  return route.es;
}

/**
 * Rutas de autenticación predefinidas
 */
export const AUTH_ROUTES = {
  login: {
    es: '/auth/iniciar-sesion',
    en: '/en/auth/login'
  },
  register: {
    es: '/auth/registro',
    en: '/en/auth/register'
  },
  resetPassword: {
    es: '/auth/restablecer-contrasena',
    en: '/en/auth/reset-password'
  },
  updatePassword: {
    es: '/auth/actualizar-contrasena',
    en: '/en/auth/update-password'
  },
  verifyEmail: {
    es: '/auth/verificar-email',
    en: '/en/auth/verify-email'
  },
  emailConfirmed: {
    es: '/auth/email-confirmado',
    en: '/en/auth/email-confirmed'
  }
} as const;

/**
 * Rutas del dashboard predefinidas
 */
export const DASHBOARD_ROUTES = {
  home: {
    es: '/dashboard',
    en: '/en/dashboard'
  },
  exams: {
    es: '/dashboard/examenes',
    en: '/en/dashboard/exams'
  },
  profile: {
    es: '/dashboard/perfil',
    en: '/en/dashboard/profile'
  }
} as const;

/**
 * Rutas públicas predefinidas
 */
export const PUBLIC_ROUTES = {
  home: {
    es: '/',
    en: '/en'
  },
  howItWorks: {
    es: '/como-funciona',
    en: '/en/how-it-works'
  },
  pricing: {
    es: '/precios',
    en: '/en/pricing'
  },
  contact: {
    es: '/contacto',
    en: '/en/contact'
  },
  blog: {
    es: '/blog',
    en: '/en/blog'
  },
  privacy: {
    es: '/privacidad',
    en: '/en/privacy'
  },
  terms: {
    es: '/terminos',
    en: '/en/terms'
  },
  cookies: {
    es: '/cookies',
    en: '/en/cookies'
  }
} as const;

/**
 * Hook/función para usar en componentes React
 */
export function useLocalizedRoute(locale: string) {
  return {
    getRoute: (route: LocalizedRoute) => getLocalizedRoute(locale, route),
    auth: {
      login: () => getLocalizedRoute(locale, AUTH_ROUTES.login),
      register: () => getLocalizedRoute(locale, AUTH_ROUTES.register),
      resetPassword: () => getLocalizedRoute(locale, AUTH_ROUTES.resetPassword),
      updatePassword: () => getLocalizedRoute(locale, AUTH_ROUTES.updatePassword),
      verifyEmail: () => getLocalizedRoute(locale, AUTH_ROUTES.verifyEmail),
      emailConfirmed: () => getLocalizedRoute(locale, AUTH_ROUTES.emailConfirmed)
    },
    dashboard: {
      home: () => getLocalizedRoute(locale, DASHBOARD_ROUTES.home),
      exams: () => getLocalizedRoute(locale, DASHBOARD_ROUTES.exams),
      profile: () => getLocalizedRoute(locale, DASHBOARD_ROUTES.profile)
    },
    public: {
      home: () => getLocalizedRoute(locale, PUBLIC_ROUTES.home),
      howItWorks: () => getLocalizedRoute(locale, PUBLIC_ROUTES.howItWorks),
      pricing: () => getLocalizedRoute(locale, PUBLIC_ROUTES.pricing),
      contact: () => getLocalizedRoute(locale, PUBLIC_ROUTES.contact),
      blog: () => getLocalizedRoute(locale, PUBLIC_ROUTES.blog),
      privacy: () => getLocalizedRoute(locale, PUBLIC_ROUTES.privacy),
      terms: () => getLocalizedRoute(locale, PUBLIC_ROUTES.terms),
      cookies: () => getLocalizedRoute(locale, PUBLIC_ROUTES.cookies)
    }
  };
}

/**
 * Ejemplo de uso:
 * 
 * ```tsx
 * import { useLocale } from 'next-intl';
 * import { useLocalizedRoute } from '@/lib/utils/i18n-routes';
 * 
 * function MyComponent() {
 *   const locale = useLocale();
 *   const routes = useLocalizedRoute(locale);
 *   
 *   return (
 *     <Link href={routes.auth.login()}>
 *       Login
 *     </Link>
 *   );
 * }
 * ```
 */ 