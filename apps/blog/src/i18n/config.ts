export const defaultLocale = 'es';
export const locales = ['es', 'en', 'fr', 'pt'] as const;
export type Locale = (typeof locales)[number];

export const localeNames = {
    es: 'Español',
    en: 'English',
    fr: 'Français',
    pt: 'Português (Brasil)',
} as const;

// Cookie name for locale persistence
export const localeCookieName = 'NEXT_LOCALE';
