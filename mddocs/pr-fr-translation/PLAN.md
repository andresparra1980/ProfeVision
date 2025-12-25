# Plan de Traducción: Francés (FR) y Portugués Brasileño (PT-BR)

**Fecha:** Diciembre 25, 2025  
**Objetivo:** Agregar soporte completo para Francés y Portugués (Brasil) a la página pública, dashboards y API  
**Enfoque:** Traducción automática con IA + revisión de calidad  
**Ejecución:** Paralela por archivo (JSON y MDX simultáneamente)  
**Arquitectura:** Escalable a 12+ idiomas sin redundancia

---

## 📊 Análisis Actual

### Idiomas Soportados
- ✅ Español (es) - Default
- ✅ Inglés (en)
- ⬜ Francés (fr) - Nuevo
- ⬜ Portugués Brasil (pt) - Nuevo

### Estructura Existente de Traducciones
```
apps/web/i18n/
├── locales/
│   ├── es/          (18 archivos JSON, ~54KB cada uno)
│   ├── en/          (18 archivos JSON, ~54KB cada uno)
│   ├── fr/          ← NUEVO (18 archivos JSON)
│   └── pt/          ← NUEVO (18 archivos JSON)
├── api/
│   ├── locales/
│   │   ├── es/      (22 archivos JSON, ~21KB cada uno)
│   │   ├── en/      (22 archivos JSON, ~21KB cada uno)
│   │   ├── fr/      ← NUEVO (22 archivos JSON)
│   │   └── pt/      ← NUEVO (22 archivos JSON)
│   ├── config.ts
│   └── index.ts

apps/docs/content/
├── docs/
│   ├── *.mdx        (Español)
│   ├── *.en.mdx     (Inglés)
│   ├── *.fr.mdx     ← NUEVO
│   └── *.pt.mdx     ← NUEVO
```

### Archivos de Configuración a Actualizar
- `apps/web/i18n/config.ts` - Agregar 'fr', 'pt' a locales
- `apps/web/i18n/routing.ts` - Expandir pathnames para rutas FR/PT (SoT única)
- `apps/web/i18n/route-mapper.ts` - NUEVO: Generador de mapeos (sin redundancia)
- `apps/web/middleware.ts` - Incluir nuevas locales en detección
- `apps/docs/middleware.ts` - Agregar soporte fumadocs para FR/PT

---

## 🚀 Fases de Ejecución

### **Fase 1: Preparación de Infraestructura** (1.5-2.5 horas)

#### 1.1 Configuración Base i18n
- [ ] Actualizar `apps/web/i18n/config.ts`
  - Agregar 'fr' y 'pt' a `locales: ['es', 'en', 'fr', 'pt']`
  - Agregar nombres localizados en `localeNames`:
    ```typescript
    export const localeNames = {
      es: 'Español',
      en: 'English',
      fr: 'Français',
      pt: 'Português (Brasil)',
    } as const;
    ```
  - Mantener 'es' como `defaultLocale`

#### 1.2 Expandir routing.ts (SoT - Single Source of Truth)
- [ ] Actualizar `apps/web/i18n/routing.ts`
  - Agregar 'fr' y 'pt' a `locales` array
  - Expandir `pathnames` con traducción de rutas para FR y PT
  - **Estructura de pathnames (ejemplo):**
    ```typescript
    pathnames: {
      '/how-it-works': {
        es: '/como-funciona',
        en: '/how-it-works',
        fr: '/comment-ca-marche',
        pt: '/como-funciona',
      },
      '/pricing': {
        es: '/precios',
        en: '/pricing',
        fr: '/tarification',
        pt: '/preco',
      },
      '/dashboard/exams': {
        es: '/dashboard/examenes',
        en: '/dashboard/exams',
        fr: '/dashboard/examens',
        pt: '/dashboard/exames',
      },
      // ... 200+ rutas
    }
    ```
  - **Nota:** routing.ts es ahora la SoT única para todas las traducciones de rutas

#### 1.3 Crear Route Mapper (Generador de Mapeos - Sin Redundancia)
- [ ] Crear nuevo archivo `apps/web/i18n/route-mapper.ts`
  - **Propósito:** Generar mapeos bidireccionales dinámicamente desde routing.ts
  - **Funcionalidad:**
    ```typescript
    import { routing } from './routing';

    /**
     * Genera mapeos bidireccionales entre dos locales
     * Ejemplo: getRouteMap('es') → mapeo de ES a todos los demás idiomas
     */
    export function getRouteMap(sourceLocale: string): Record<string, Record<string, string>> {
      const maps = {} as Record<string, Record<string, string>>;
      
      Object.entries(routing.pathnames).forEach(([baseKey, translations]) => {
        const sourceRoute = (translations as any)[sourceLocale] || baseKey;
        
        Object.entries(translations as object).forEach(([targetLocale, targetRoute]) => {
          if (!maps[targetLocale]) maps[targetLocale] = {};
          maps[targetLocale][sourceRoute] = targetRoute as string;
        });
      });
      
      return maps;
    }
    ```
  - **Ventaja:** Una sola fuente de verdad (routing.ts). Los mapeos se calculan bajo demanda.
  - **Escalabilidad:** Agregar idioma a routing.ts automáticamente funciona en todos lados

#### 1.4 Actualizar Language Switcher Component
- [ ] Actualizar `apps/web/components/shared/language-switcher-dropdown.tsx`
  - Reemplazar lógica de mapeo hardcoded (líneas 41-119) con llamada a `getRouteMap(locale)`
  - **Cambio clave:** En lugar de `if (newLocale === 'es') ... else if (newLocale === 'en')`
    - Usar: `const routeMaps = getRouteMap(locale); const targetPath = routeMaps[newLocale]?.[staticPath] || staticPath;`
  - El componente automáticamente soportará FR, PT y futuros idiomas sin cambios

#### 1.5 Actualizar Middleware
- [ ] Actualizar `apps/web/middleware.ts`
  - Incluir 'fr' y 'pt' en `SUPPORTED_LOCALES`
  - Verificar que locale detection chain incluya todos los locales

- [ ] Actualizar `apps/docs/middleware.ts`
  - Configurar fumadocs para soportar /fr/docs y /pt/docs
  - Agregar rutas a `localePrefix` si es necesario

#### 1.6 Crear Estructura de Carpetas
```bash
# UI Translations
mkdir -p apps/web/i18n/locales/{fr,pt}

# API Translations
mkdir -p apps/web/i18n/api/locales/{fr,pt}

# Docs
# (Los .fr.mdx y .pt.mdx se crearán al traducir)
```

---

### **Fase 2: Traducción UI (18 archivos JSON × 2 idiomas = 36 archivos)**

**Archivos a traducir (en orden de prioridad/tamaño):**

#### Traducción Automática (IA)

1. **Script de traducción:**
   - Leer `apps/web/i18n/locales/es/<archivo>.json`
   - Traducir a FR y PT con IA (paralelo)
   - Guardar en `apps/web/i18n/locales/fr/<archivo>.json` y `pt/<archivo>.json`

2. **Orden de archivos UI (prioridad):**
   - common.json (54KB) - Términos generales
   - dashboard.json (64KB) - Panel de control
   - auth.json - Autenticación
   - admin.json - Panel administrativo
   - onboarding.json - Onboarding
   - scan-wizard.json - Wizard de escaneo
   - wizard-step-*.json (7 archivos) - Pasos del wizard
   - exams.json - Exámenes
   - grades.json - Calificaciones
   - groups.json - Grupos
   - students.json - Estudiantes
   - subjects.json - Materias
   - reports.json - Reportes
   - settings.json - Configuración
   - errors.json - Mensajes de error
   - notifications.json - Notificaciones
   - upload.json - Carga de archivos
   - qr.json - Códigos QR

**Estimado:** ~15-20 horas (IA + validación de integridad)

---

### **Fase 3: Traducción API (22 endpoints × 2 idiomas = 44 archivos)**

**Archivos a traducir (por endpoint):**

#### Traducción Automática (IA)

1. **Patrón de archivos API:**
   - `exams.base.json` - Respuesta base
   - `exams.details.json` - Detalles
   - `exams.id.*.json` - Detalles específicos (edit, assign, results, etc.)
   - `groups.*.json` - Grupos (create, update, delete, get)
   - `students.*.json` - Estudiantes (create, update, delete, get)
   - `uploads.*.json` - Subidas (create, delete)
   - `qr.*.json` - QR codes (generate)
   - Error responses generales

2. **Orden de archivos API:**
   - exams.*.json (7 archivos)
   - groups.*.json (5 archivos)
   - students.*.json (5 archivos)
   - subjects.*.json (3 archivos)
   - uploads.*.json (2 archivos)
   - qr.*.json (1 archivo)
   - Mensajes de error generales

**Estimado:** ~5-10 horas (IA + validación)

---

### **Fase 4: Traducción Documentación (MDX files)**

**Estructura docs actual:**
- `*.mdx` → Español
- `*.en.mdx` → Inglés
- `*.fr.mdx` → Francés (nuevo)
- `*.pt.mdx` → Portugués (nuevo)

**Archivos a traducir:**
- Todas las páginas en `/apps/docs/content/docs/`
- Incluye: guías, tutoriales, referencias, FAQ, etc.

**Translating approach:**
1. Leer `*.mdx` (español)
2. Traducir contenido a FR y PT con IA
3. Preservar estructura frontmatter y componentes
4. Crear `*.fr.mdx` y `*.pt.mdx`

**Estimado:** ~10-15 horas (IA + validación de formato)

---

### **Fase 5: Validación e Integridad**

- [ ] **Verificar completitud:**
  - Todas las claves en common.json existen en FR/PT
  - Todos los endpoints API tienen respuestas en FR/PT
  - Todos los archivos MDX tienen versiones FR/PT
  - Todos los pathnames en routing.ts incluyen FR/PT

- [ ] **Validar JSON:**
  - Sin errores de sintaxis
  - Claves idénticas entre idiomas
  - Valores no vacíos

- [ ] **Testing de rutas:**
  - `/fr/dashboard` funciona
  - `/pt/examenes` (o equivalente en PT) funciona
  - Selector de idioma funciona
  - Language switcher muestra FR y PT
  - Fallback correcto cuando no hay traducción

- [ ] **Testing de API:**
  - Parámetro `Accept-Language: fr` devuelve respuestas en FR
  - Parámetro `Accept-Language: pt` devuelve respuestas en PT
  - Fallback a ES/EN si no existe

**Estimado:** ~5-8 horas

---

### **Fase 6: Despliegue y Monitoreo**

- [ ] Deploy a staging
- [ ] Verificar en navegadores reales (FR y PT)
- [ ] Monitorear logs de traducción faltante
- [ ] Deploy a producción
- [ ] Documentar nuevas locales en README
- [ ] Actualizar documentación de desarrollo (CONTRIBUTING, etc.)

**Estimado:** ~2-3 horas

---

## 📈 Resumen de Trabajo

| Fase | Descripción | Archivos | Estimado |
|------|-------------|----------|----------|
| 1 | Infraestructura + Route Mapper | 5 archivos (config + mapper) | 1.5-2.5h |
| 2 | UI Translations | 36 archivos JSON | 15-20h |
| 3 | API Translations | 44 archivos JSON | 5-10h |
| 4 | Docs Translations | ~30 archivos MDX | 10-15h |
| 5 | Validación | - | 5-8h |
| 6 | Despliegue | - | 2-3h |
| **TOTAL** | | **120 archivos nuevos** | **39-58.5h** |

---

## 🏗️ Arquitectura de Escalabilidad

### Por qué Route Mapper (Sin Redundancia)

**Problema evitado:** Duplicación de datos de rutas

**Solución elegida:** Generador automático desde SoT (routing.ts)

```
routing.ts (SoT)
    ↓
    ├→ next-intl (para URL routing)
    └→ route-mapper.ts (para language switcher)
        └→ language-switcher-dropdown.tsx (consumidor)
```

**Ventajas:**
- ✅ Una sola fuente de verdad (routing.ts)
- ✅ Agregar idioma = actualizar routing.ts solamente
- ✅ Escalable a 12+ idiomas sin cambiar lógica
- ✅ Cambiar una ruta = un solo lugar
- ✅ Type-safe con TypeScript

**Impacto:** Con 12 idiomas, esto evita mantener 132 combinaciones de rutas en múltiples lugares

---

## 🔧 Herramientas y Scripts Recomendados

### Script de Traducción Automática (IA)
```bash
# Pseudocódigo para traducir JSON en paralelo
for archivo in apps/web/i18n/locales/es/*.json; do
  traducir_con_ia "$archivo" "fr" > "apps/web/i18n/locales/fr/$(basename $archivo)"
  traducir_con_ia "$archivo" "pt" > "apps/web/i18n/locales/pt/$(basename $archivo)"
done

# Lo mismo para API translations
for archivo in apps/web/i18n/api/locales/es/*.json; do
  traducir_con_ia "$archivo" "fr" > "apps/web/i18n/api/locales/fr/$(basename $archivo)"
  traducir_con_ia "$archivo" "pt" > "apps/web/i18n/api/locales/pt/$(basename $archivo)"
done
```

### Validación de Integridad
```bash
# Verificar que todas las claves existen en todos idiomas
validate_translation_keys es en fr pt

# Verificar rutas en routing.ts
validate_route_translations es en fr pt
```

---

## ✅ Checklist de Ejecución

### Antes de Comenzar
- [ ] Confirmar disponibilidad de herramienta IA para traducción
- [ ] Backup de archivos actuales
- [ ] Branch git para feature
- [ ] Revisar routing.ts actual para entender estructura de pathnames

### Durante Fase 1
- [ ] Actualizar config.ts (agregar locales + nombres)
- [ ] Expandir routing.ts (agregar FR/PT a todos los pathnames)
- [ ] Crear route-mapper.ts (generador de mapeos)
- [ ] Actualizar language-switcher-dropdown.tsx (usar getRouteMap)
- [ ] Actualizar middleware.ts (soportar nuevas locales)
- [ ] Actualizar docs middleware (si aplica)
- [ ] Crear carpetas (fr, pt en locales y api/locales)
- [ ] Build y test que no hay errores de tipo

### Durante Fases 2-4 (Traducción)
- [ ] Traducir UI JSONs (36 archivos)
- [ ] Traducir API JSONs (44 archivos)
- [ ] Traducir docs MDX (~30 archivos)
- [ ] Validar formato JSON/MDX
- [ ] Verificar integridad de claves

### Antes de Desplegar
- [ ] Todas las validaciones pasan
- [ ] Testing en staging
- [ ] Monitoreo configurado
- [ ] Language switcher muestra 4 idiomas
- [ ] Rutas FR y PT funcionan
- [ ] API devuelve respuestas en FR y PT

---

## 🎯 Definiciones

- **FR (Francés):** Francés estándar (Francia)
- **PT (Portugués Brasileño):** Portugués variante Brasil (pt-BR)
- **IA:** Usar Claude/GPT/similar para traducción automática + revisión
- **Paralelo:** Traducir FR y PT simultáneamente, archivo por archivo
- **SoT:** Source of Truth (routing.ts es la única fuente de verdad para traducciones de rutas)
- **Route Mapper:** Generador dinámico de mapeos desde routing.ts (sin redundancia)

---

## 📝 Notas Técnicas

### Rutas que NO se Traducen
```
/api/*              - API endpoints (headers para idioma)
/auth/callback      - Supabase OAuth
/auth/direct-recovery - Supabase password recovery
```

### Fallback Chain (Locale Detection)
1. URL pathname (/fr/..., /pt/...)
2. Header: x-next-intl-locale
3. Header: x-locale
4. Header: Accept-Language
5. Cookie: locale
6. Default: 'es'

### Detección Automática de Idioma
- Cliente: `navigator.language` en browser
- Servidor: `Accept-Language` header

### Componentes Afectados
| Componente | Cambio | Razón |
|------------|--------|-------|
| language-switcher-dropdown.tsx | Usar getRouteMap() | Soportar múltiples idiomas |
| language-switcher.tsx | No aplica | Usa el dropdown (automático) |
| language-switcher-dashboard.tsx | No aplica | Usa el dropdown (automático) |
| config.ts | Agregar FR/PT | SoT de locales |
| routing.ts | Expandir pathnames | SoT de rutas |
| middleware.ts | Validar FR/PT | Detección de locale |
| route-mapper.ts | NUEVO archivo | Generador de mapeos |

---

## 🔮 Preparación para Futuros Idiomas (12+)

Una vez completadas estas 6 fases, agregar un nuevo idioma (Ej: Italiano) será:

1. Actualizar `config.ts`: Agregar `it: 'Italiano'`
2. Actualizar `routing.ts`: Agregar IT a cada pathname
3. Crear carpetas: `mkdir apps/web/i18n/locales/it apps/web/i18n/api/locales/it`
4. Traducir files (mismo proceso con IA)
5. **Listo.** El route-mapper y language-switcher funcionarán automáticamente.

**Tiempo estimado por idioma adicional:** ~35-45 horas (solo traducción, cero cambios arquitectónicos)

---

*Documento versionado: v1.1 - Arquitectura mejorada con Route Mapper (25 Dec 2025)*
