import es from "./es.json" assert { type: "json" };
import en from "./en.json" assert { type: "json" };
import fr from "./fr.json" assert { type: "json" };
import pt from "./pt.json" assert { type: "json" };

export type Locale = "es" | "en" | "fr" | "pt";

const translations: Record<Locale, typeof es> = {
  es,
  en,
  fr,
  pt,
};

/**
 * Get translations for a specific locale
 * Falls back to 'es' if locale is not supported
 */
export function getTranslation(locale: string): typeof es {
  if (!locale || !["es", "en", "fr", "pt"].includes(locale)) {
    locale = "es";
  }
  return translations[locale as Locale];
}
