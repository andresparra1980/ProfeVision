'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { locales } from '@/i18n/config';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LanguageSwitcherDashboardProps {
  collapsed?: boolean;
}

export function LanguageSwitcherDashboard({ collapsed = false }: LanguageSwitcherDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('dashboard');

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
    console.log('🔄 Language Switch START:', { pathname, locale, newLocale });

    let currentPath = pathname;

    // 1) Normalizar: quitar prefijo de idioma actual (/es o /en)
    if (pathname === '/en' || pathname === '/es') {
      currentPath = '/';
    } else if (pathname.startsWith('/en/')) {
      currentPath = pathname.replace(/^\/en/, '');
    } else if (pathname.startsWith('/es/')) {
      currentPath = pathname.replace(/^\/es/, '');
    }

    console.log('🔄 Current path (no prefix):', currentPath);

    // 2) Mapear la ruta al idioma de destino usando slugs canónicos
    let targetPath = currentPath;

    if (newLocale === 'es') {
      // EN -> ES
      targetPath = routeMap[currentPath] || currentPath;
    } else if (newLocale === 'en') {
      // ES -> EN
      targetPath = reverseRouteMap[currentPath] || currentPath;
    }

    console.log('🔄 Target path:', targetPath);

    // 3) Construir URL final con prefijo SIEMPRE (localePrefix: 'always')
    const finalPath = targetPath === '/' ? `/${newLocale}` : `/${newLocale}${targetPath}`;

    console.log('🔄 Final path:', finalPath);

    // 4. Navegar a la nueva ruta
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
