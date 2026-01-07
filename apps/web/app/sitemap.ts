import { MetadataRoute } from "next";
import {
  LOCALES,
  LOCALIZED_ROUTES,
  buildLocalizedUrl,
  buildAlternates,
} from "@/lib/seo/routes";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Generar entradas con alternates hreflang para cada ruta
  for (const canonicalPath of Object.keys(LOCALIZED_ROUTES)) {
    const isHome = canonicalPath === "/";
    const priority = isHome ? 1 : 0.7;
    const changeFrequency = isHome ? "daily" : "monthly";
    const alternates = buildAlternates(canonicalPath);

    // Agregar entrada por cada locale
    for (const locale of LOCALES) {
      entries.push({
        url: buildLocalizedUrl(canonicalPath, locale),
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
