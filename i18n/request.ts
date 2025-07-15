import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = requested && routing.locales.includes(requested as any)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`./locales/${locale}/common.json`)).default,
    timeZone: 'America/Bogota',
    now: new Date(),
  };
}); 