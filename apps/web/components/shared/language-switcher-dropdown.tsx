'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { locales, localeNames } from '@/i18n/config';
import { getRouteMap } from '@/i18n/route-mapper';
import { logger } from '@/lib/utils/logger';
import { Languages } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LanguageSwitcherDropdownProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  withTooltip?: boolean;
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
  centered?: boolean;
}

export function LanguageSwitcherDropdown({
  variant = 'outline',
  size = 'sm',
  showLabel = false,
  withTooltip = false,
  tooltipSide = 'top',
  centered = false,
}: LanguageSwitcherDropdownProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('dashboard');

  // Obtener mapeos de rutas desde route-mapper (basados en routing.ts)
  const routeMaps = getRouteMap(locale);

  const handleLocaleChange = (newLocale: string) => {
    logger.log('🔄 Language Switch START:', { pathname, locale, newLocale });

    let currentPath = pathname;

    // 1) Normalizar: quitar prefijo de idioma actual (/es, /en, /fr, /pt)
    if (pathname === '/en' || pathname === '/es' || pathname === '/fr' || pathname === '/pt') {
      currentPath = '/';
    } else if (pathname.startsWith('/en/')) {
      currentPath = pathname.replace(/^\/en/, '');
    } else if (pathname.startsWith('/es/')) {
      currentPath = pathname.replace(/^\/es/, '');
    } else if (pathname.startsWith('/fr/')) {
      currentPath = pathname.replace(/^\/fr/, '');
    } else if (pathname.startsWith('/pt/')) {
      currentPath = pathname.replace(/^\/pt/, '');
    }

    logger.log('🔄 Current path (no prefix):', currentPath);

    // 2) Extraer parámetros dinámicos (IDs, slugs, etc.) y segmentos estáticos
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
    // Usar route-mapper para obtener la traducción de la ruta
    const targetStaticPath = routeMaps[newLocale]?.[staticPath] || staticPath;

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

  const trigger = (
    <Button
      variant={variant}
      size={size}
      className={`gap-2 ${centered ? 'flex-1 justify-center' : ''}`}
    >
      <Languages className="h-4 w-4" />
      {showLabel && <span>{localeNames[locale as keyof typeof localeNames]}</span>}
    </Button>
  );

  const dropdownComponent = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[3000]">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className="cursor-pointer"
          >
            {localeNames[loc]}
            {loc === locale && <span className="ml-2 text-xs">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (withTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-full">
              {dropdownComponent}
            </div>
          </TooltipTrigger>
          <TooltipContent side={tooltipSide}>
            {t('ui.language')}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return dropdownComponent;
}
