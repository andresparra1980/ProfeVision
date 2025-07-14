# Plan de Implementación de Internacionalización (i18n) - ProfeVision

## 📋 Contexto del Proyecto

**Aplicación:** ProfeVision - Plataforma de gestión de exámenes
**Framework:** Next.js 15.3.1 con App Router
**Gestor de paquetes:** Yarn
**Idiomas objetivo:** Español (ES) como default, Inglés (EN)
**Estrategia:** Detección automática por idioma del navegador (Accept-Language header)
**Rutas:** Personalizadas por idioma para SEO (ej. `/es/examenes` vs `/en/exams`)

## 🎯 Objetivos

- [ ] Implementar soporte para español e inglés
- [ ] Rutas personalizadas por idioma para SEO
- [ ] Detección automática del idioma del navegador
- [ ] Selector de idioma en el header
- [ ] Mantener toda la funcionalidad existente

---

## 🚀 CHECKPOINT 1: Preparación e Instalación

### 1.1 Setup Inicial
```bash
# Crear feature branch
git checkout -b feature/i18n-implementation

# Instalar next-intl
yarn add next-intl@^4.3.4
```

### 1.2 Checklist de Preparación
- [ ] Feature branch creada
- [ ] next-intl instalado
- [ ] Verificar compatibilidad con Next.js 15.3.1
- [ ] Backup del estado actual (commit)

---

## 🗂️ CHECKPOINT 2: Estructura de Archivos

### 2.1 Crear Estructura Base
```
ProfeVision/
├── i18n/
│   ├── locales/
│   │   ├── es/
│   │   │   ├── common.json
│   │   │   ├── dashboard.json
│   │   │   ├── exam.json
│   │   │   ├── auth.json
│   │   │   ├── navigation.json
│   │   │   ├── errors.json
│   │   │   └── forms.json
│   │   └── en/
│   │       ├── common.json
│   │       ├── dashboard.json
│   │       ├── exam.json
│   │       ├── auth.json
│   │       ├── navigation.json
│   │       ├── errors.json
│   │       └── forms.json
│   ├── config.ts
│   ├── routing.ts
│   └── server.ts
└── middleware.ts (modificar)
```

### 2.2 Checklist de Estructura
- [ ] Directorio `/i18n/` creado
- [ ] Subdirectorios `/locales/es/` y `/locales/en/` creados
- [ ] Archivos JSON base creados (vacíos inicialmente)
- [ ] Archivos de configuración preparados

---

## ⚙️ CHECKPOINT 3: Configuración Base

### 3.1 Archivos de Configuración

**Archivo: `i18n/config.ts`**
```typescript
export const defaultLocale = 'es';
export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];

export const localeNames = {
  es: 'Español',
  en: 'English',
} as const;

// Configuración para detección de idioma del navegador
export const localeDetection = {
  strategy: 'acceptLanguageHeader',
  cookieName: 'locale',
  defaultLocale,
  locales,
} as const;
```

**Archivo: `i18n/routing.ts`**
```typescript
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  
  // Rutas personalizadas por idioma
  pathnames: {
    // Páginas públicas
    '/': '/',
    '/about': {
      es: '/acerca-de',
      en: '/about'
    },
    '/pricing': {
      es: '/precios',
      en: '/pricing'
    },
    '/exams': {
      es: '/examenes',
      en: '/exams'
    },
    '/how-it-works': {
      es: '/como-funciona',
      en: '/how-it-works'
    },
    '/contact': {
      es: '/contacto',
      en: '/contact'
    },
    '/blog': {
      es: '/blog',
      en: '/blog'
    },
    
    // Páginas de autenticación
    '/auth/login': {
      es: '/auth/iniciar-sesion',
      en: '/auth/login'
    },
    '/auth/register': {
      es: '/auth/registro',
      en: '/auth/register'
    },
    
    // Dashboard
    '/dashboard': {
      es: '/panel',
      en: '/dashboard'
    },
    '/dashboard/exams': {
      es: '/panel/examenes',
      en: '/dashboard/exams'
    },
    '/dashboard/students': {
      es: '/panel/estudiantes',
      en: '/dashboard/students'
    },
    '/dashboard/groups': {
      es: '/panel/grupos',
      en: '/dashboard/groups'
    },
    '/dashboard/subjects': {
      es: '/panel/materias',
      en: '/dashboard/subjects'
    },
    '/dashboard/reports': {
      es: '/panel/reportes',
      en: '/dashboard/reports'
    },
    '/dashboard/settings': {
      es: '/panel/configuracion',
      en: '/dashboard/settings'
    },
    '/dashboard/profile': {
      es: '/panel/perfil',
      en: '/dashboard/profile'
    }
  }
});
```

**Archivo: `i18n/server.ts`**
```typescript
import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ locale }) => {
  // Validar que el locale sea válido
  if (!routing.locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`./locales/${locale}/common.json`)).default,
    timeZone: 'America/Bogota',
    now: new Date(),
  };
});
```

### 3.2 Checklist de Configuración
- [ ] `i18n/config.ts` creado con configuración base
- [ ] `i18n/routing.ts` creado con rutas personalizadas
- [ ] `i18n/server.ts` creado con configuración del servidor
- [ ] Verificar que todas las rutas estén mapeadas

---

## 🔧 CHECKPOINT 4: Modificación de Middleware

### 4.1 Actualizar Middleware Existente

**Archivo: `middleware.ts`**
```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware({
  ...routing,
  
  // Configuración adicional para detección de idioma
  localeDetection: true,
  
  // Rutas que no requieren prefijo de idioma
  localePrefix: 'as-needed',
  
  // Configuración de cookies
  alternateLinks: false,
});

export const config = {
  // Aplicar middleware a todas las rutas excepto archivos estáticos
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
```

### 4.2 Checklist de Middleware
- [ ] Middleware actualizado con configuración de i18n
- [ ] Matcher configurado correctamente
- [ ] Detección automática habilitada
- [ ] Testear que no rompa rutas existentes

---

## 🌍 CHECKPOINT 5: Actualización de Layouts

### 5.1 Root Layout

**Archivo: `app/layout.tsx`**
```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '../i18n/routing';

// Resto de imports existentes...

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  
  // Validar locale
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
  
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages}>
          {/* Resto del layout existente */}
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### 5.2 Layout de Páginas Públicas

**Archivo: `app/(website)/layout.tsx`**
```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {/* Layout existente */}
      {children}
    </NextIntlClientProvider>
  );
}
```

### 5.3 Checklist de Layouts
- [ ] Root layout actualizado con NextIntlClientProvider
- [ ] Layout de website actualizado
- [ ] Layout de dashboard actualizado
- [ ] Layout de auth actualizado
- [ ] Validación de locale implementada

---

## 📝 CHECKPOINT 6: Archivos de Traducción

### 6.1 Organización de Traducciones

**Estrategia:**
- Extraer primero todos los textos en español
- Crear estructura JSON organizada por secciones
- Traducir al inglés manteniendo las claves

### 6.2 Archivos JSON Base

**Archivo: `i18n/locales/es/common.json`**
```json
{
  "buttons": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "create": "Crear",
    "back": "Volver",
    "next": "Siguiente",
    "previous": "Anterior",
    "submit": "Enviar",
    "close": "Cerrar"
  },
  "labels": {
    "name": "Nombre",
    "email": "Correo electrónico",
    "password": "Contraseña",
    "description": "Descripción",
    "date": "Fecha",
    "status": "Estado",
    "actions": "Acciones"
  },
  "status": {
    "active": "Activo",
    "inactive": "Inactivo",
    "pending": "Pendiente",
    "completed": "Completado",
    "draft": "Borrador"
  },
  "messages": {
    "loading": "Cargando...",
    "success": "Operación exitosa",
    "error": "Ha ocurrido un error",
    "noData": "No hay datos disponibles",
    "confirmDelete": "¿Estás seguro de que quieres eliminar este elemento?"
  }
}
```

**Archivo: `i18n/locales/es/navigation.json`**
```json
{
  "header": {
    "home": "Inicio",
    "features": "Características",
    "pricing": "Precios",
    "about": "Acerca de",
    "contact": "Contacto",
    "blog": "Blog",
    "login": "Iniciar Sesión",
    "register": "Registrarse",
    "dashboard": "Panel"
  },
  "footer": {
    "company": "Empresa",
    "product": "Producto",
    "support": "Soporte",
    "legal": "Legal",
    "privacy": "Privacidad",
    "terms": "Términos",
    "cookies": "Cookies"
  },
  "dashboard": {
    "home": "Inicio",
    "exams": "Exámenes",
    "students": "Estudiantes",
    "groups": "Grupos",
    "subjects": "Materias",
    "reports": "Reportes",
    "settings": "Configuración",
    "profile": "Perfil"
  }
}
```

### 6.3 Checklist de Traducciones
- [ ] Identificar todos los textos estáticos
- [ ] Crear archivos JSON en español
- [ ] Traducir archivos al inglés
- [ ] Verificar consistencia de claves
- [ ] Organizar por secciones lógicas

---

## 🔄 CHECKPOINT 7: Selector de Idioma

### 7.1 Componente Language Switcher

**Archivo: `components/shared/language-switcher.tsx`**
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { locales, localeNames } from '@/i18n/config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function LanguageSwitcher() {
  const router = useRouter();
  const locale = useLocale();

  const handleLocaleChange = (newLocale: string) => {
    // Cambiar idioma manteniendo la ruta actual
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
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
```

### 7.2 Integrar en Header

**Actualizar: `components/shared/site-header.tsx`**
- Importar y usar `LanguageSwitcher`
- Posicionar en la barra de navegación

### 7.3 Checklist de Selector
- [ ] Componente LanguageSwitcher creado
- [ ] Integrado en site-header
- [ ] Funcionalidad de cambio de idioma
- [ ] Persistencia en cookie
- [ ] Estilos consistentes

---

## 🔤 CHECKPOINT 8: Implementación de useTranslations

### 8.1 Actualizar Componentes Principales

**Ejemplo de conversión:**
```typescript
// Antes
const title = "Crear Examen";

// Después
import { useTranslations } from 'next-intl';

const t = useTranslations('exam');
const title = t('create');
```

### 8.2 Componentes a Actualizar (Prioridad)

**Orden de implementación:**
1. [ ] `components/shared/site-header.tsx`
2. [ ] `components/shared/site-footer.tsx`
3. [ ] `components/shared/main-navigation.tsx`
4. [ ] `app/(website)/page.tsx` (Landing page)
5. [ ] `app/(website)/pricing/page.tsx`
6. [ ] `app/dashboard/page.tsx`
7. [ ] `app/dashboard/exams/page.tsx`
8. [ ] `app/auth/login/page.tsx`
9. [ ] `app/auth/register/page.tsx`
10. [ ] Componentes de formularios

### 8.3 Checklist de Implementación
- [ ] Identificar todos los textos hardcodeados
- [ ] Reemplazar con hooks de traducción
- [ ] Verificar que las claves existan en JSON
- [ ] Testear cambio de idioma
- [ ] Verificar funcionalidad intacta

---

## 🧪 CHECKPOINT 9: Testing y Validación

### 9.1 Tests de Funcionalidad
- [ ] Cambio de idioma funciona correctamente
- [ ] Detección automática del navegador
- [ ] Persistencia de preferencia
- [ ] Rutas personalizadas funcionan
- [ ] SEO URLs correctas

### 9.2 Tests de Compatibilidad
- [ ] Todas las páginas cargan sin errores
- [ ] Formularios funcionan en ambos idiomas
- [ ] Dashboard mantiene funcionalidad
- [ ] Autenticación funciona
- [ ] API endpoints no afectados

### 9.3 Tests de UX
- [ ] Selector de idioma intuitivo
- [ ] Cambio de idioma sin pérdida de contexto
- [ ] Textos traducidos correctamente
- [ ] Consistencia en terminología
- [ ] Responsive design mantenido

---

## 🚀 CHECKPOINT 10: Despliegue y Configuración

### 10.1 Configuración de Producción
- [ ] Variables de entorno actualizadas
- [ ] Configuración de Vercel/hosting
- [ ] Sitemap actualizado con rutas localizadas
- [ ] Configuración de dominio (si aplica)

### 10.2 SEO y Metadatos
- [ ] Metadatos localizados
- [ ] OpenGraph tags por idioma
- [ ] Hreflang tags implementados
- [ ] Sitemap multiidioma

### 10.3 Monitoreo
- [ ] Analytics configurado por idioma
- [ ] Error tracking actualizado
- [ ] Performance monitoring
- [ ] Métricas de adopción por idioma

---

## 📚 Recursos y Referencias

### Dependencias Principales
- `next-intl@^4.3.4` - Biblioteca principal de i18n
- Next.js 15.3.1 - Framework base

### Documentación
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Next.js 15 Internationalization](https://nextjs.org/docs/pages/building-your-application/routing/internationalization)

### Comandos Útiles
```bash
# Instalar dependencias
yarn add next-intl@^4.3.4

# Verificar build
yarn build

# Desarrollo
yarn dev

# Lint
yarn lint
```

---

## 🎯 Métricas de Éxito

### Objetivos Cuantificables
- [ ] 100% de textos traducidos
- [ ] 0 errores de hidratación
- [ ] < 5% impacto en bundle size
- [ ] Tiempo de implementación < 8 horas

### Validaciones Finales
- [ ] Aplicación funciona en español
- [ ] Aplicación funciona en inglés
- [ ] Cambio de idioma suave
- [ ] SEO URLs optimizadas
- [ ] Performance mantenida

---

## 🐛 Troubleshooting Común

### Problemas Potenciales
1. **Hydration errors**: Verificar que el locale sea consistente entre servidor y cliente
2. **Missing translations**: Implementar fallbacks
3. **Route conflicts**: Verificar configuración de pathnames
4. **Cookie issues**: Configurar correctamente el middleware

### Soluciones
- Usar `suppressHydrationWarning` solo cuando sea necesario
- Implementar sistema de fallback a idioma por defecto
- Testear todas las rutas después de cambios
- Verificar configuración de cookies en producción

---

*Este plan debe ser ejecutado secuencialmente, completando cada checkpoint antes de continuar al siguiente.* 