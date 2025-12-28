'use client';

import { routing } from './routing';
import type { Locale } from './config';

/**
 * Genera mapeos bidireccionales de rutas para cambio de idioma
 * 
 * Ejemplo:
 *   getRouteMap('es') genera mapeos de ES → {en: ..., fr: ..., pt: ...}
 *   getRouteMap('fr') genera mapeos de FR → {es: ..., en: ..., pt: ...}
 * 
 * Ventaja: Una sola fuente de verdad (routing.ts)
 * Sin redundancia, escalable a 12+ idiomas
 */

export function getRouteMap(sourceLocale: string): Record<string, Record<string, string>> {
  const maps = {} as Record<string, Record<string, string>>;

  Object.entries(routing.pathnames).forEach(([_baseKey, translations]) => {
    // El primer valor es la ruta en el locale de origen
    const sourceRoute = (translations as any)[sourceLocale];
    
    if (!sourceRoute) {
      // Si el locale de origen no existe, saltar
      console.warn(`⚠️ Route mapper: No se encontró ruta para locale "${sourceLocale}" en pathnames`);
      return;
    }

    // Mapear a todos los otros locales
    Object.entries(translations as object).forEach(([targetLocale, targetRoute]) => {
      if (!maps[targetLocale]) {
        maps[targetLocale] = {};
      }
      maps[targetLocale][sourceRoute] = targetRoute as string;
    });
  });

  return maps;
}

/**
 * Obtiene la ruta equivalente en otro idioma
 * 
 * Uso:
 *   translateRoute('/examenes', 'es', 'en') → '/exams'
 *   translateRoute('/exams', 'en', 'fr') → '/examens'
 */
export function translateRoute(
  currentPath: string,
  sourceLocale: string,
  targetLocale: string
): string {
  const routeMaps = getRouteMap(sourceLocale);
  return routeMaps[targetLocale]?.[currentPath] || currentPath;
}
