//import { notFound } from 'next/navigation';
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { Locale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale =
    requested && routing.locales.includes(requested as Locale)
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
    // 🚨 Not found page
    "not-found": (await import(`./locales/${locale}/not-found.json`)).default,
    // 🤖 AI Exams Chat module
    ai_exams_chat: (await import(`./locales/${locale}/ai_exams_chat.json`))
      .default,
    // 🧙‍♀️ Wizard steps components
    "wizard-step-confirmation": (
      await import(`./locales/${locale}/wizard-step-confirmation.json`)
    ).default,
    "wizard-step-instructions": (
      await import(`./locales/${locale}/wizard-step-instructions.json`)
    ).default,
    "wizard-step-image-capture": (
      await import(`./locales/${locale}/wizard-step-image-capture.json`)
    ).default,
    "wizard-step-processing": (
      await import(`./locales/${locale}/wizard-step-processing.json`)
    ).default,
    "wizard-step-results": (
      await import(`./locales/${locale}/wizard-step-results.json`)
    ).default,
    // 🧙‍♀️ Main wizard component
    "scan-wizard": (await import(`./locales/${locale}/scan-wizard.json`))
      .default,
    // 🎠 Feature slideshow component
    "feature-slideshow": (
      await import(`./locales/${locale}/feature-slideshow.json`)
    ).default,
    // 🔘 UI components
    "floating-action-button": (
      await import(`./locales/${locale}/floating-action-button.json`)
    ).default,
    // 🍪 Cookie banner component
    "cookie-banner": (await import(`./locales/${locale}/cookie-banner.json`))
      .default,
    // 📰 Website pages
    blog: (await import(`./locales/${locale}/blog.json`)).default,
    "mobile-app": (await import(`./locales/${locale}/mobile-app.json`)).default,
    // 🧪 Similar Exam job modal (feature namespace)
    "jobs-similar-exam": (
      await import(`./locales/${locale}/jobs-similar-exam.json`)
    ).default,
    // 🎯 Tiers system
    tiers: (await import(`./locales/${locale}/tiers.json`)).default,
    // 🚀 Onboarding wizard and checklist
    onboarding: (await import(`./locales/${locale}/onboarding.json`)).default,
  };

  return {
    locale,
    messages,
    timeZone: "America/Bogota",
    now: new Date(),
  };
});
