'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { locales } from '@/i18n/config';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { logger } from '@/lib/utils/logger';
import { pathnames } from '@/i18n/routing';

interface LanguageSwitcherDashboardProps {
  collapsed?: boolean;
}

// Función para encontrar la ruta canónica desde una ruta localizada
function getCanonicalPath(localizedPath: string, fromLocale: string): string {
  for (const [canonical, localized] of Object.entries(pathnames)) {
    if (typeof localized === 'string') {
      if (localized === localizedPath) return canonical;
    } else {
      const localePath = localized[fromLocale as 'es' | 'en'];
      if (localePath === localizedPath) return canonical;
    }
  }
  return localizedPath; // fallback
}

// Función para obtener la ruta localizada desde la canónica
function getLocalizedPath(canonicalPath: string, toLocale: string): string {
  const localized = pathnames[canonicalPath as keyof typeof pathnames];
  if (!localized) return canonicalPath;
  if (typeof localized === 'string') return localized;
  return localized[toLocale as 'es' | 'en'] || canonicalPath;
}

export function LanguageSwitcherDashboard({ collapsed = false }: LanguageSwitcherDashboardProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('dashboard');

  const handleLocaleChange = (newLocale: string) => {
    // Obtener pathname actual sin prefijo de locale
    const currentPath = window.location.pathname;
    const pathWithoutLocale = currentPath.replace(/^\/(es|en)/, '') || '/';

    logger.log('🔄 Language Switch:', { currentPath, pathWithoutLocale, locale, newLocale });

    // Encontrar la ruta canónica y luego la localizada para el nuevo locale
    const canonicalPath = getCanonicalPath(pathWithoutLocale, locale);
    const newLocalizedPath = getLocalizedPath(canonicalPath, newLocale);
    const finalPath = `/${newLocale}${newLocalizedPath === '/' ? '' : newLocalizedPath}`;

    logger.log('🔄 Navigating to:', { canonicalPath, newLocalizedPath, finalPath });

    router.push(finalPath);
  };

  // Get tooltip text for inactive language (in the destination language)
  const getTooltipText = (loc: string) => {
    // Show tooltip in the destination language, not the current one
    if (loc === 'es') {
      return 'Cambiar a Español'; // Always in Spanish
    }
    return 'Switch to English'; // Always in English
  };

  // Render tab with conditional tooltip
  const renderTab = (loc: string, side: 'top' | 'right' = 'top') => {
    const isActive = loc === locale;
    const tabTrigger = (
      <TabsTrigger
        key={loc}
        value={loc}
        className="text-xs font-semibold rounded-md border border-border/40 bg-card data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-border hover:bg-background/50 transition-colors"
      >
        {loc.toUpperCase()}
      </TabsTrigger>
    );

    // Only show tooltip if NOT active
    if (!isActive) {
      return (
        <Tooltip key={loc}>
          <TooltipTrigger asChild>
            {tabTrigger}
          </TooltipTrigger>
          <TooltipContent side={side}>
            {getTooltipText(loc)}
          </TooltipContent>
        </Tooltip>
      );
    }

    return tabTrigger;
  };

  if (collapsed) {
    // Versión colapsada: tabs verticales sin título
    return (
      <TooltipProvider>
        <Tabs value={locale} onValueChange={handleLocaleChange} className="w-full">
          <TabsList className="grid w-full grid-rows-2 h-auto bg-transparent gap-1 p-0">
            {locales.map((loc) => renderTab(loc, 'right'))}
          </TabsList>
        </Tabs>
      </TooltipProvider>
    );
  }

  // Versión expandida: título centrado + tabs horizontales
  return (
    <TooltipProvider>
      <div className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground text-center">
          {t('ui.language')}
        </p>
        <Tabs value={locale} onValueChange={handleLocaleChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-transparent gap-2 p-0">
            {locales.map((loc) => renderTab(loc, 'top'))}
          </TabsList>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
