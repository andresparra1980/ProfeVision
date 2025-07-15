'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { locales } from '@/i18n/config';
import { routing } from '@/i18n/routing';
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

  const handleLocaleChange = (newLocale: string) => {
    // 🌍 Construir nueva ruta manteniendo la estructura
    let newPath = pathname;
    
    // Si la ruta actual tiene prefijo de idioma, removerlo
    if (pathname.startsWith(`/${locale}/`)) {
      newPath = pathname.replace(`/${locale}/`, '/');
    } else if (pathname === `/${locale}`) {
      newPath = '/';
    }
    
    // 🔄 Mapear rutas usando routing.pathnames si existe
    const currentPathnameKey = Object.keys(routing.pathnames).find(key => {
      const paths = routing.pathnames[key as keyof typeof routing.pathnames];
      if (typeof paths === 'object' && paths !== null) {
        return paths[locale as keyof typeof paths] === pathname.replace(`/${locale}`, '') || 
               paths[locale as keyof typeof paths] === pathname;
      }
      return false;
    });
    
    if (currentPathnameKey) {
      const targetPaths = routing.pathnames[currentPathnameKey as keyof typeof routing.pathnames];
      if (typeof targetPaths === 'object' && targetPaths !== null) {
        newPath = targetPaths[newLocale as keyof typeof targetPaths] || newPath;
      }
    }
    
    // Construir URL final
    const finalPath = newLocale === 'es' && newPath === '/' ? '/' : `/${newLocale}${newPath}`;
    
    // 🔄 Navegar a la nueva ruta
    router.push(finalPath);
  };

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger className="w-20">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {loc.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 