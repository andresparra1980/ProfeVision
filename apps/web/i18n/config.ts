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