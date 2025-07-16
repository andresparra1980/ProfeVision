import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = requested && routing.locales.includes(requested as any)
    ? requested
    : routing.defaultLocale;

  // 🌍 Importar todos los archivos de traducción
  const messages = {
    common: (await import(`./locales/${locale}/common.json`)).default,
    auth: (await import(`./locales/${locale}/auth.json`)).default,
  };

  return {
    locale,
    messages,
    timeZone: 'America/Bogota',
    now: new Date(),
  };
}); 