'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { locales } from '@/i18n/config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
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

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger className="w-20">
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