import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://profevision.com";

  const locales = ["es", "en", "fr", "pt"] as const;
  type Locale = (typeof locales)[number];

  // Rutas canónicas (en inglés) con sus traducciones por locale
  const routes: Record<string, Record<Locale, string>> = {
    // Home
    "/": { es: "", en: "", fr: "", pt: "" },
    // Páginas públicas de marketing
    "/privacy": {
      es: "privacidad",
      en: "privacy",
      fr: "confidentialite",
      pt: "privacidade",
    },
    "/terms": {
      es: "terminos",
      en: "terms",
      fr: "conditions",
      pt: "termos",
    },
    "/cookies": {
      es: "cookies",
      en: "cookies",
      fr: "cookies",
      pt: "cookies",
    },
    "/how-it-works": {
      es: "como-funciona",
      en: "how-it-works",
      fr: "comment-ca-marche",
      pt: "como-funciona",
    },
    "/pricing": {
      es: "precios",
      en: "pricing",
      fr: "tarification",
      pt: "precos",
    },
    "/contact": {
      es: "contacto",
      en: "contact",
      fr: "contact",
      pt: "contato",
    },
    "/blog": {
      es: "blog",
      en: "blog",
      fr: "blog",
      pt: "blog",
    },
    "/exams-with-ai": {
      es: "examenes-con-ia",
      en: "exams-with-ai",
      fr: "examens-avec-ia",
      pt: "exames-com-ia",
    },
    "/paper-exams": {
      es: "examenes-papel",
      en: "paper-exams",
      fr: "examens-papier",
      pt: "exames-papel",
    },
    "/institutions-management": {
      es: "gestion-instituciones",
      en: "institutions-management",
      fr: "gestion-etablissements",
      pt: "gerenciamento-instituicoes",
    },
    "/subjects-management": {
      es: "gestion-materias",
      en: "subjects-management",
      fr: "gestion-matieres",
      pt: "gerenciamento-disciplinas",
    },
    "/groups-management": {
      es: "gestion-grupos",
      en: "groups-management",
      fr: "gestion-groupes",
      pt: "gerenciamento-grupos",
    },
    "/students-management": {
      es: "gestion-estudiantes",
      en: "students-management",
      fr: "gestion-etudiants",
      pt: "gerenciamento-estudantes",
    },
    "/reports": {
      es: "reportes",
      en: "reports",
      fr: "rapports",
      pt: "relatorios",
    },
    "/mobile-app": {
      es: "aplicacion-movil",
      en: "mobile-app",
      fr: "application-mobile",
      pt: "aplicativo-movil",
    },
    "/data-deletion": {
      es: "data-deletion",
      en: "data-deletion",
      fr: "data-deletion",
      pt: "data-deletion",
    },
  };

  const entries: MetadataRoute.Sitemap = [];

  // Generar entradas con alternates hreflang para cada ruta
  for (const [canonicalPath, slugs] of Object.entries(routes)) {
    const isHome = canonicalPath === "/";
    const priority = isHome ? 1 : 0.7;
    const changeFrequency = isHome ? "daily" : "monthly";

    // Crear objeto alternates para hreflang
    const alternates: Record<string, string> = {
      "x-default": `${baseUrl}/en${isHome ? "" : `/${slugs.en}`}`,
    };

    for (const locale of locales) {
      const slug = slugs[locale];
      alternates[locale] = `${baseUrl}/${locale}${slug ? `/${slug}` : ""}`;
    }

    // Agregar entrada por cada locale
    for (const locale of locales) {
      const slug = slugs[locale];
      entries.push({
        url: `${baseUrl}/${locale}${slug ? `/${slug}` : ""}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
        alternates: {
          languages: alternates,
        },
      });
    }
  }

  // Nota: Excluimos páginas de autenticación del sitemap (no index)

  return entries;
}
