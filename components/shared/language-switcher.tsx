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
    '/dashboard': '/panel'
  };

  // Crear mapa inverso
  const reverseRouteMap = Object.entries(routeMap).reduce((acc, [en, es]) => {
    acc[es] = en;
    return acc;
  }, {} as Record<string, string>);

  const handleLocaleChange = (newLocale: string) => {
    console.log('🔄 Language Switch START:', { pathname, locale, newLocale });
    
    let currentPath = pathname;
    
    // 1. Obtener la ruta sin prefijo de idioma
    if (locale === 'en' && pathname.startsWith('/en')) {
      currentPath = pathname === '/en' ? '/' : pathname.replace('/en', '');
    }
    
    console.log('🔄 Current path (no prefix):', currentPath);
    
    // 2. Mapear la ruta al idioma de destino
    let targetPath = currentPath;
    
    if (newLocale === 'es') {
      // Cambiar de inglés a español
      if (locale === 'en') {
        targetPath = routeMap[currentPath] || currentPath;
      }
      // Si ya estamos en español, no cambiar la ruta
    } else if (newLocale === 'en') {
      // Cambiar de español a inglés
      if (locale === 'es') {
        targetPath = reverseRouteMap[currentPath] || currentPath;
      }
      // Si ya estamos en inglés, no cambiar la ruta
    }
    
    console.log('🔄 Target path:', targetPath);
    
    // 3. Construir URL final
    let finalPath = targetPath;
    if (newLocale === 'en') {
      finalPath = targetPath === '/' ? '/en' : `/en${targetPath}`;
    } else if (newLocale === 'es') {
      // Forzar prefijo /es para asegurar cambio de idioma
      finalPath = targetPath === '/' ? '/es' : `/es${targetPath}`;
    }
    
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