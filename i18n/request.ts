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
    dashboard: (await import(`./locales/${locale}/dashboard.json`)).default,
    errors: (await import(`./locales/${locale}/errors.json`)).default,
    exam: (await import(`./locales/${locale}/exam.json`)).default,
    forms: (await import(`./locales/${locale}/forms.json`)).default,
    navigation: (await import(`./locales/${locale}/navigation.json`)).default,
    // 🧙‍♀️ Wizard steps components
    'wizard-step-confirmation': (await import(`./locales/${locale}/wizard-step-confirmation.json`)).default,
    'wizard-step-instructions': (await import(`./locales/${locale}/wizard-step-instructions.json`)).default,
    'wizard-step-image-capture': (await import(`./locales/${locale}/wizard-step-image-capture.json`)).default,
    'wizard-step-processing': (await import(`./locales/${locale}/wizard-step-processing.json`)).default,
    'wizard-step-results': (await import(`./locales/${locale}/wizard-step-results.json`)).default,
    // 🧙‍♀️ Main wizard component
    'scan-wizard': (await import(`./locales/${locale}/scan-wizard.json`)).default,
    // 🎠 Feature slideshow component
    'feature-slideshow': (await import(`./locales/${locale}/feature-slideshow.json`)).default,
    // 📰 Website pages
    'blog': (await import(`./locales/${locale}/blog.json`)).default,
    'mobile-app': (await import(`./locales/${locale}/mobile-app.json`)).default,
  };

  return {
    locale,
    messages,
    timeZone: 'America/Bogota',
    now: new Date(),
  };
}); 