'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { locales } from '@/i18n/config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { logger } from '@/lib/utils/logger';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();

  // Mapa bidireccional de rutas
  const routeMap: Record<string, string> = {
    '/': '/',
    '/how-it-works': '/como-funciona',
    '/pricing': '/precios',
    '/contact': '/contacto',
    '/blog': '/blog',
    '/exams': '/examenes',
    '/paper-exams': '/examenes-papel',
    '/mobile-app': '/aplicacion-movil',
    '/privacy': '/privacidad',
    '/terms': '/terminos',
    '/cookies': '/cookies',
    '/reports': '/reportes',
    '/institutions-management': '/gestion-instituciones',
    '/subjects-management': '/gestion-materias',
    '/groups-management': '/gestion-grupos',
    '/students-management': '/gestion-estudiantes',
    '/auth/login': '/auth/iniciar-sesion',
    '/auth/register': '/auth/registro',
    '/auth/reset-password': '/auth/restablecer-contrasena',
    '/auth/update-password': '/auth/actualizar-contrasena',
    '/auth/verify-email': '/auth/verificar-email',
    '/auth/email-confirmed': '/auth/email-confirmado',
    '/dashboard': '/dashboard'
  };

  // Crear mapa inverso
  const reverseRouteMap = Object.entries(routeMap).reduce((acc, [en, es]) => {
    acc[es] = en;
    return acc;
  }, {} as Record<string, string>);

  const handleLocaleChange = (newLocale: string) => {
    logger.log('🔄 Language Switch START:', { pathname, locale, newLocale });

    let currentPath = pathname;

    // 1) Normalizar: quitar prefijo de idioma actual (/es o /en)
    if (pathname === '/en' || pathname === '/es') {
      currentPath = '/';
    } else if (pathname.startsWith('/en/')) {
      currentPath = pathname.replace(/^\/en/, '');
    } else if (pathname.startsWith('/es/')) {
      currentPath = pathname.replace(/^\/es/, '');
    }

    logger.log('🔄 Current path (no prefix):', currentPath);

    // 2) Extraer parámetros dinámicos (IDs, slugs, etc.) y segmentos estáticos
    // Ej: /dashboard/exams/123/edit -> base: /dashboard/exams/[id]/edit, params: {id: 123}
    const segments = currentPath.split('/').filter(Boolean);
    const dynamicParams: string[] = [];
    const staticSegments: string[] = [];

    segments.forEach((segment, idx) => {
      // Detectar si es un segmento dinámico (número, UUID, etc.)
      const isNumeric = /^\d+$/.test(segment);
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);

      if (isNumeric || isUUID) {
        dynamicParams.push(segment);
        staticSegments.push(`__DYNAMIC_${idx}__`);
      } else {
        staticSegments.push(segment);
      }
    });

    const staticPath = '/' + staticSegments.join('/');
    logger.log('🔄 Static path:', staticPath, 'Dynamic params:', dynamicParams);

    // 3) Mapear solo la parte estática al idioma de destino
    let targetStaticPath = staticPath;

    if (newLocale === 'es') {
      // EN -> ES
      targetStaticPath = routeMap[staticPath] || staticPath;
    } else if (newLocale === 'en') {
      // ES -> EN
      targetStaticPath = reverseRouteMap[staticPath] || staticPath;
    }

    // 4) Reconstruir ruta con parámetros dinámicos
    let targetPath = targetStaticPath;
    let paramIdx = 0;
    targetPath = targetPath.replace(/__DYNAMIC_\d+__/g, () => {
      return dynamicParams[paramIdx++] || '';
    });

    logger.log('🔄 Target path:', targetPath);

    // 5) Preservar query params si existen
    const queryString = searchParams.toString();
    const targetPathWithQuery = queryString ? `${targetPath}?${queryString}` : targetPath;

    // 6) Construir URL final con prefijo SIEMPRE (localePrefix: 'always')
    const finalPath = targetPathWithQuery === '/' ? `/${newLocale}` : `/${newLocale}${targetPathWithQuery}`;

    logger.log('🔄 Final path:', finalPath);

    // 7. Navegar a la nueva ruta
    router.push(finalPath);
  };

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger className="w-14 md:w-20 h-8 md:h-10 text-xs md:text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="z-[3000]">
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {loc.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 