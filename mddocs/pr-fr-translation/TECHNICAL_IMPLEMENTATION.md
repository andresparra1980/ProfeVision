# Detalles Técnicos de Implementación - FR/PT Translation

**Documento de referencia para desarrolladores**  
**Fecha:** Diciembre 25, 2025

---

## 1️⃣ Fase 1.1: Actualizar config.ts

### Archivo: `apps/web/i18n/config.ts`

**Cambio:**
```typescript
// ANTES
export const defaultLocale = 'es';
export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];

export const localeNames = {
  es: 'Español',
  en: 'English',
} as const;

// DESPUÉS
export const defaultLocale = 'es';
export const locales = ['es', 'en', 'fr', 'pt'] as const;  // ← Agregar FR/PT
export type Locale = (typeof locales)[number];

export const localeNames = {
  es: 'Español',
  en: 'English',
  fr: 'Français',                    // ← NUEVO
  pt: 'Português (Brasil)',          // ← NUEVO
} as const;
```

**Verificación:**
```bash
pnpm build  # Debe compilar sin errores de tipo
```

---

## 2️⃣ Fase 1.2: Expandir routing.ts

### Archivo: `apps/web/i18n/routing.ts`

**Cambios principales:**

```typescript
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['es', 'en', 'fr', 'pt'],    // ← Agregar FR/PT
  defaultLocale: 'es',
  localePrefix: 'always',
  pathnames: {
    // ====== EJEMPLOS DE PATHNAMES CON FR/PT ======
    
    // 1. Rutas con traducción simple
    '/how-it-works': {
      es: '/como-funciona',
      en: '/how-it-works',
      fr: '/comment-ca-marche',        // ← NUEVO
      pt: '/como-funciona',            // ← NUEVO (igual a ES por coincidencia)
    },
    
    // 2. Rutas con traducción en dashboard
    '/dashboard/exams': {
      es: '/dashboard/examenes',
      en: '/dashboard/exams',
      fr: '/dashboard/examens',        // ← NUEVO
      pt: '/dashboard/exames',         // ← NUEVO
    },
    
    // 3. Rutas dinámicas (se manejan automáticamente con route-mapper)
    '/dashboard/exams/[id]': {
      es: '/dashboard/examenes/[id]',
      en: '/dashboard/exams/[id]',
      fr: '/dashboard/examens/[id]',   // ← NUEVO
      pt: '/dashboard/exames/[id]',    // ← NUEVO
    },
    
    // 4. Rutas de autenticación
    '/auth/login': {
      es: '/auth/iniciar-sesion',
      en: '/auth/login',
      fr: '/auth/connexion',           // ← NUEVO
      pt: '/auth/entrar',              // ← NUEVO
    },
    
    // ... (repetir para TODOS los pathnames existentes)
  }
});
```

**Guía de traducción de rutas comunes:**

| Concepto | ES | EN | FR | PT |
|----------|----|----|----|----|
| Exámenes | examenes | exams | examens | exames |
| Estudiantes | estudiantes | students | etudiants | estudantes |
| Grupos | grupos | groups | groupes | grupos |
| Materias | materias | subjects | matieres | materias |
| Calificaciones | calificaciones | grades | notes | notas |
| Reportes | reportes | reports | rapports | relatorios |
| Configuración | configuracion | settings | parametres | configuracoes |
| Contacto | contacto | contact | contact | contato |
| Privacidad | privacidad | privacy | confidentialite | privacidade |
| Términos | terminos | terms | conditions | termos |

**Verificación:**
```bash
# Compilar y verificar tipos
pnpm build

# Si hay errores de ruta, asegurar que TODOS los pathnames tengan FR/PT
```

---

## 3️⃣ Fase 1.3: Crear route-mapper.ts (NUEVO)

### Archivo: `apps/web/i18n/route-mapper.ts` (CREATE)

```typescript
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
```

**Tests esperados:**
```typescript
// Verificar que los mapeos funcionan correctamente
expect(translateRoute('/examenes', 'es', 'en')).toBe('/exams');
expect(translateRoute('/exams', 'en', 'fr')).toBe('/examens');
expect(translateRoute('/exams', 'en', 'pt')).toBe('/exames');
```

---

## 4️⃣ Fase 1.4: Actualizar language-switcher-dropdown.tsx

### Archivo: `apps/web/components/shared/language-switcher-dropdown.tsx`

**Cambio en la lógica de mapeo (reemplazar líneas 40-119):**

```typescript
'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { locales, localeNames } from '@/i18n/config';
import { getRouteMap } from '@/i18n/route-mapper';  // ← AGREGAR IMPORT
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

  // ====== NUEVA LÓGICA (reemplazar líneas 40-119) ======
  const handleLocaleChange = (newLocale: string) => {
    logger.log('🔄 Language Switch START:', { pathname, locale, newLocale });

    let currentPath = pathname;

    // 1) Normalizar: quitar prefijo de idioma actual
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

    // 3) ====== USAR ROUTE MAPPER PARA MAPEO GENÉRICO ======
    const routeMaps = getRouteMap(locale);
    let targetStaticPath = routeMaps[newLocale]?.[staticPath] || staticPath;

    logger.log('🔄 Target static path:', targetStaticPath);

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

    // 6) Construir URL final con prefijo (localePrefix: 'always')
    const finalPath = targetPathWithQuery === '/' ? `/${newLocale}` : `/${newLocale}${targetPathWithQuery}`;

    logger.log('🔄 Final path:', finalPath);

    // 7. Navegar a la nueva ruta
    router.push(finalPath);
  };

  // ====== RESTO DEL COMPONENTE SIN CAMBIOS ======
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
```

**Cambios clave:**
- Línea 73: `import { getRouteMap } from '@/i18n/route-mapper'`
- Líneas 119-120: Usar `getRouteMap(locale)` en lugar de lógica if/else hardcodeada
- Soporta automáticamente 4+ idiomas sin cambios adicionales

---

## 5️⃣ Fase 1.5: Actualizar middleware.ts

### Archivo: `apps/web/middleware.ts`

**Buscar sección SUPPORTED_LOCALES y actualizar:**

```typescript
// ANTES
const SUPPORTED_LOCALES = ['es', 'en'];

// DESPUÉS
const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'pt'];  // ← Agregar FR/PT
```

**Buscar locale detection y verificar que funcione:**

```typescript
// Debe estar en la cadena de detección
const detectedLocale = 
  pathname.match(/\/(es|en|fr|pt)(\/|$)/)?.[1] ||  // Detectar desde URL
  headers.get('x-next-intl-locale') ||              // Header personalizado
  headers.get('x-locale') ||                        // Header alternativo
  headers.get('accept-language')?.split(',')[0].substring(0, 2) ||  // Accept-Language
  'es';  // Default
```

---

## 6️⃣ Fase 1.6: Actualizar docs middleware.ts (si aplica)

### Archivo: `apps/docs/middleware.ts`

```typescript
// ANTES
export const config = {
  locales: ['es', 'en'],
  // ...
};

// DESPUÉS
export const config = {
  locales: ['es', 'en', 'fr', 'pt'],  // ← Agregar FR/PT
  // ...
};
```

---

## 📝 Testing de la Fase 1

### Checklist de Verificación

```bash
# 1. Compilar sin errores
pnpm build

# 2. Verificar que route-mapper.ts compila
pnpm type-check

# 3. Iniciar servidor local
pnpm dev

# 4. Navegar a:
#    - http://localhost:3000/es/dashboard (Español)
#    - http://localhost:3000/en/dashboard (English)
#    - http://localhost:3000/fr/dashboard (Français) ← NUEVO
#    - http://localhost:3000/pt/dashboard (Português) ← NUEVO

# 5. Verificar que language switcher muestra 4 opciones
#    - Click en dropdown = debe mostrar ES, EN, FR, PT

# 6. Probar cambio de idioma
#    - Estar en /es/dashboard → Click FR → Debe ir a /fr/dashboard
#    - Estar en /en/exams → Click PT → Debe ir a /pt/exames

# 7. Verificar que parámetros dinámicos se preservan
#    - Estar en /es/dashboard/exams/123 → Click FR → /fr/dashboard/examens/123
```

---

## 🚀 Fase 2-4: Traducción de Archivos

### Estructura de Carpetas Necesarias

```bash
# Crear si no existen
mkdir -p apps/web/i18n/locales/fr
mkdir -p apps/web/i18n/locales/pt
mkdir -p apps/web/i18n/api/locales/fr
mkdir -p apps/web/i18n/api/locales/pt

# Verificar que existen
ls -la apps/web/i18n/locales/
```

### Script de Traducción Template

```bash
#!/bin/bash
# script/translate-fr-pt.sh

set -e

LOCALES_DIR="apps/web/i18n/locales"
API_DIR="apps/web/i18n/api/locales"

echo "Traduciendo archivos UI..."
for es_file in $LOCALES_DIR/es/*.json; do
  filename=$(basename "$es_file")
  
  # Traducir a FR
  echo "Traduciendo $filename a Francés..."
  # Usar IA para traducir contenido (placeholder)
  cp "$es_file" "$LOCALES_DIR/fr/$filename"
  
  # Traducir a PT
  echo "Traduciendo $filename a Portugués..."
  # Usar IA para traducir contenido (placeholder)
  cp "$es_file" "$LOCALES_DIR/pt/$filename"
done

echo "✅ Traducción completada"
```

---

## ✅ Resumen de Cambios de Código

| Archivo | Cambios | Líneas |
|---------|---------|--------|
| `config.ts` | Agregar 'fr', 'pt' a locales + localeNames | 5-10 |
| `routing.ts` | Expandir pathnames (200+ rutas) | 200+ |
| `route-mapper.ts` | NUEVO - Generador de mapeos | 50-60 |
| `language-switcher-dropdown.tsx` | Usar getRouteMap() | 10-15 |
| `middleware.ts` | Actualizar SUPPORTED_LOCALES | 1-5 |
| `docs/middleware.ts` | Actualizar locales config | 1-5 |
| **TOTAL** | | ~270 líneas |

---

*Documento técnico v1.1 - Actualizado para usar pnpm (25 Dec 2025)*
