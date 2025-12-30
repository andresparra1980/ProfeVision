/**
 * Utilidad para generar rutas localizadas correctamente
 * Maneja automáticamente el prefijo de idioma según la configuración de next-intl
 */

export type LocalizedRoute = {
  es: string;
  en: string;
  fr: string;
  pt: string;
};

/**
 * Genera una ruta localizada correctamente según el locale actual
 * @param locale - El locale actual ('es', 'en', 'fr', 'pt')
 * @param route - La definición de la ruta para todos los idiomas
 * @returns La ruta correcta con o sin prefijo según la configuración
 */
export function getLocalizedRoute(locale: string, route: LocalizedRoute): string {
  // Para español (defaultLocale), no usar prefijo según localePrefix: 'as-needed'
  if (locale === 'es') {
    return route.es;
  }
  
  // Para otros idiomas, usar prefijo /{locale}
  if (locale === 'en') {
    return route.en;
  }
  
  if (locale === 'fr') {
    return route.fr;
  }
  
  if (locale === 'pt') {
    return route.pt;
  }
  
  // Fallback to English if locale is not recognized
  return route.en;
}

/**
 * Rutas de autenticación predefinidas
 */
export const AUTH_ROUTES = {
  login: {
    es: '/auth/iniciar-sesion',
    en: '/en/auth/login',
    fr: '/fr/auth/connexion',
    pt: '/pt/auth/entrar'
  },
  register: {
    es: '/auth/registro',
    en: '/en/auth/register',
    fr: '/fr/auth/inscription',
    pt: '/pt/auth/cadastro'
  },
  resetPassword: {
    es: '/auth/restablecer-contrasena',
    en: '/en/auth/reset-password',
    fr: '/fr/auth/reinitialiser-mot-de-passe',
    pt: '/pt/auth/redefinir-senha'
  },
  updatePassword: {
    es: '/auth/actualizar-contrasena',
    en: '/en/auth/update-password',
    fr: '/fr/auth/mettre-a-jour-mot-de-passe',
    pt: '/pt/auth/atualizar-senha'
  },
  verifyEmail: {
    es: '/auth/verificar-email',
    en: '/en/auth/verify-email',
    fr: '/fr/auth/verifier-email',
    pt: '/pt/auth/verificar-email'
  },
  emailConfirmed: {
    es: '/auth/email-confirmado',
    en: '/en/auth/email-confirmed',
    fr: '/fr/auth/email-confirme',
    pt: '/pt/auth/email-confirmado'
  }
} as const;

/**
 * Rutas del dashboard predefinidas
 */
export const DASHBOARD_ROUTES = {
  home: {
    es: '/dashboard',
    en: '/en/dashboard',
    fr: '/fr/dashboard',
    pt: '/pt/dashboard'
  },
  exams: {
    es: '/dashboard/examenes',
    en: '/en/dashboard/exams',
    fr: '/fr/dashboard/examens',
    pt: '/pt/dashboard/exames'
  },
  profile: {
    es: '/dashboard/perfil',
    en: '/en/dashboard/profile',
    fr: '/fr/dashboard/profil',
    pt: '/pt/dashboard/perfil'
  }
} as const;

/**
 * Rutas públicas predefinidas
 */
export const PUBLIC_ROUTES = {
  home: {
    es: '/',
    en: '/en',
    fr: '/fr',
    pt: '/pt'
  },
  howItWorks: {
    es: '/como-funciona',
    en: '/en/how-it-works',
    fr: '/fr/comment-ca-marche',
    pt: '/pt/como-funciona'
  },
  pricing: {
    es: '/precios',
    en: '/en/pricing',
    fr: '/fr/tarification',
    pt: '/pt/precos'
  },
  contact: {
    es: '/contacto',
    en: '/en/contact',
    fr: '/fr/contact',
    pt: '/pt/contato'
  },
  blog: {
    es: '/blog',
    en: '/en/blog',
    fr: '/fr/blog',
    pt: '/pt/blog'
  },
  privacy: {
    es: '/privacidad',
    en: '/en/privacy',
    fr: '/fr/confidentialite',
    pt: '/pt/privacidade'
  },
  terms: {
    es: '/terminos',
    en: '/en/terms',
    fr: '/fr/conditions',
    pt: '/pt/termos'
  },
  cookies: {
    es: '/cookies',
    en: '/en/cookies',
    fr: '/fr/cookies',
    pt: '/pt/cookies'
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