import es from "./es.json" with { type: "json" };
import en from "./en.json" with { type: "json" };
import fr from "./fr.json" with { type: "json" };
import pt from "./pt.json" with { type: "json" };

export const translations = { es, en, fr, pt };

export type Locale = keyof typeof translations;
export type Translation = typeof es;

export const getTranslation = (locale: string): Translation => {
  if (locale in translations) {
    return translations[locale as Locale];
  }
  return es;
};
