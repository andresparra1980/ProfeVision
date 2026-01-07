export const BASE_URL = 'https://profevision.com';

export const LOCALES = ['en', 'es', 'fr', 'pt'] as const;
export type Locale = (typeof LOCALES)[number];

// Rutas canónicas con sus slugs localizados
export const LOCALIZED_ROUTES: Record<string, Record<Locale, string>> = {
  '/': { en: '', es: '', fr: '', pt: '' },
  '/privacy': {
    es: 'privacidad',
    en: 'privacy',
    fr: 'confidentialite',
    pt: 'privacidade',
  },
  '/terms': {
    es: 'terminos',
    en: 'terms',
    fr: 'conditions',
    pt: 'termos',
  },
  '/cookies': {
    es: 'cookies',
    en: 'cookies',
    fr: 'cookies',
    pt: 'cookies',
  },
  '/how-it-works': {
    es: 'como-funciona',
    en: 'how-it-works',
    fr: 'comment-ca-marche',
    pt: 'como-funciona',
  },
  '/pricing': {
    es: 'precios',
    en: 'pricing',
    fr: 'tarification',
    pt: 'precos',
  },
  '/contact': {
    es: 'contacto',
    en: 'contact',
    fr: 'contact',
    pt: 'contato',
  },
  '/blog': {
    es: 'blog',
    en: 'blog',
    fr: 'blog',
    pt: 'blog',
  },
  '/exams-with-ai': {
    es: 'examenes-con-ia',
    en: 'exams-with-ai',
    fr: 'examens-avec-ia',
    pt: 'exames-com-ia',
  },
  '/paper-exams': {
    es: 'examenes-papel',
    en: 'paper-exams',
    fr: 'examens-papier',
    pt: 'exames-papel',
  },
  '/institutions-management': {
    es: 'gestion-instituciones',
    en: 'institutions-management',
    fr: 'gestion-etablissements',
    pt: 'gerenciamento-instituicoes',
  },
  '/subjects-management': {
    es: 'gestion-materias',
    en: 'subjects-management',
    fr: 'gestion-matieres',
    pt: 'gerenciamento-disciplinas',
  },
  '/groups-management': {
    es: 'gestion-grupos',
    en: 'groups-management',
    fr: 'gestion-groupes',
    pt: 'gerenciamento-grupos',
  },
  '/students-management': {
    es: 'gestion-estudiantes',
    en: 'students-management',
    fr: 'gestion-etudiants',
    pt: 'gerenciamento-estudantes',
  },
  '/reports': {
    es: 'reportes',
    en: 'reports',
    fr: 'rapports',
    pt: 'relatorios',
  },
  '/mobile-app': {
    es: 'aplicacion-movil',
    en: 'mobile-app',
    fr: 'application-mobile',
    pt: 'aplicativo-movil',
  },
  '/data-deletion': {
    es: 'data-deletion',
    en: 'data-deletion',
    fr: 'data-deletion',
    pt: 'data-deletion',
  },
};

/**
 * Build full URL for a route in a specific locale
 */
export function buildLocalizedUrl(canonicalPath: string, locale: Locale): string {
  const slugs = LOCALIZED_ROUTES[canonicalPath];
  if (!slugs) return `${BASE_URL}/${locale}`;
  
  const slug = slugs[locale];
  return `${BASE_URL}/${locale}${slug ? `/${slug}` : ''}`;
}

/**
 * Build alternates object for hreflang
 */
export function buildAlternates(canonicalPath: string): Record<string, string> {
  const slugs = LOCALIZED_ROUTES[canonicalPath];
  if (!slugs) return {};

  const alternates: Record<string, string> = {
    'x-default': buildLocalizedUrl(canonicalPath, 'en'),
  };

  for (const locale of LOCALES) {
    alternates[locale] = buildLocalizedUrl(canonicalPath, locale);
  }

  return alternates;
}
