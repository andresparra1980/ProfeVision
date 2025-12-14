import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://profevision.com";

  const locales = ["es", "en"] as const;

  const slugsByLocale: Record<(typeof locales)[number], string[]> = {
    es: [
      // contenido estático / marketing
      "privacidad",
      "terminos",
      "cookies",
      "como-funciona",
      "precios",
      "contacto",
      "blog",
      "examenes-con-ia",
      "examenes-papel",
      "gestion-instituciones",
      "gestion-materias",
      "gestion-grupos",
      "gestion-estudiantes",
      "reportes",
      "aplicacion-movil",
      "data-deletion",
    ],
    en: [
      "privacy",
      "terms",
      "cookies",
      "how-it-works",
      "pricing",
      "contact",
      "blog",
      "exams-with-ai",
      "paper-exams",
      "institutions-management",
      "subjects-management",
      "groups-management",
      "students-management",
      "reports",
      "mobile-app",
      "data-deletion",
    ],
  };

  const entries: MetadataRoute.Sitemap = [];

  // home por locale
  for (const locale of locales) {
    entries.push({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    });

    for (const slug of slugsByLocale[locale]) {
      entries.push({
        url: `${baseUrl}/${locale}/${slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  // Nota: Excluimos páginas de autenticación del sitemap (no index)

  return entries;
}
