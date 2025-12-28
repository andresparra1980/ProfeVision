# Fase 1: Implementación de Infraestructura i18n

**Estado:** En Progreso  
**Rama:** `feature/pr-fr-translation`  
**Estimado:** 1.5-2.5 horas  
**Fecha Inicio:** Diciembre 25, 2025

---

## 📋 Tareas Fase 1

### 1.1 Actualizar config.ts ⬜
- **Archivo:** `apps/web/i18n/config.ts`
- **Cambios:**
  - [ ] Agregar `'fr'` y `'pt'` a `locales` array
  - [ ] Agregar `fr: 'Français'` a `localeNames`
  - [ ] Agregar `pt: 'Português (Brasil)'` a `localeNames`
- **Verificación:** `pnpm build` sin errores

**Referencia:** Ver TECHNICAL_IMPLEMENTATION.md → Sección 1.1

---

### 1.2 Expandir routing.ts ⬜
- **Archivo:** `apps/web/i18n/routing.ts`
- **Cambios:**
  - [ ] Agregar `'fr'` y `'pt'` a `locales` array en `defineRouting`
  - [ ] Expandir TODOS los `pathnames` (200+ rutas) con traducción FR/PT
  - [ ] Usar tabla de traducción en TECHNICAL_IMPLEMENTATION.md como referencia

**Rutas críticas a traducir:**
```
'/how-it-works' → '/como-funciona' (ES), '/how-it-works' (EN), 
                  '/comment-ca-marche' (FR), '/como-funciona' (PT)
'/pricing' → '/precios', '/pricing', '/tarification', '/preco'
'/dashboard/exams' → '/dashboard/examenes', '/dashboard/exams',
                     '/dashboard/examens', '/dashboard/exames'
... y ~200 más
```

**Verificación:** `pnpm build` sin errores de ruta

**Referencia:** Ver TECHNICAL_IMPLEMENTATION.md → Sección 1.2

---

### 1.3 Crear route-mapper.ts (NUEVO ARCHIVO) ⬜
- **Archivo:** `apps/web/i18n/route-mapper.ts` (CREATE)
- **Cambios:**
  - [ ] Copiar código completo desde TECHNICAL_IMPLEMENTATION.md → Sección 1.3
  - [ ] Crear archivo con funciones `getRouteMap()` y `translateRoute()`
  - [ ] Importar `routing` desde `./routing`
  - [ ] Importar type `Locale` desde `./config`

**Verificación:** `pnpm type-check` sin errores

**Referencia:** Ver TECHNICAL_IMPLEMENTATION.md → Sección 1.3

---

### 1.4 Actualizar language-switcher-dropdown.tsx ⬜
- **Archivo:** `apps/web/components/shared/language-switcher-dropdown.tsx`
- **Cambios:**
  - [ ] Agregar import: `import { getRouteMap } from '@/i18n/route-mapper';`
  - [ ] Actualizar función `handleLocaleChange()` (líneas 73-141):
    - Reemplazar lógica if/else hardcodeada (líneas 113-119)
    - Con: `const routeMaps = getRouteMap(locale);` 
    - Y: `let targetStaticPath = routeMaps[newLocale]?.[staticPath] || staticPath;`
  - [ ] Actualizar normalizador de prefijos (líneas 79-85) para incluir `/fr/` y `/pt/`

**Cambios clave líneas a actualizar:**
```typescript
// Línea 73 (después de otros imports)
import { getRouteMap } from '@/i18n/route-mapper';

// Líneas 79-85 (normalizar prefijos)
if (pathname === '/en' || pathname === '/es' || pathname === '/fr' || pathname === '/pt') {
  // ...
} else if (pathname.startsWith('/fr/')) {
  currentPath = pathname.replace(/^\/fr/, '');
} else if (pathname.startsWith('/pt/')) {
  currentPath = pathname.replace(/^\/pt/, '');
}

// Líneas 113-120 (reemplazar lógica)
// ANTES:
if (newLocale === 'es') {
  targetStaticPath = routeMap[staticPath] || staticPath;
} else if (newLocale === 'en') {
  targetStaticPath = reverseRouteMap[staticPath] || staticPath;
}

// DESPUÉS:
const routeMaps = getRouteMap(locale);
let targetStaticPath = routeMaps[newLocale]?.[staticPath] || staticPath;

// ELIMINAR líneas 41-72 (routeMap y reverseRouteMap hardcodeados)
```

**Verificación:** `pnpm build` sin errores

**Referencia:** Ver TECHNICAL_IMPLEMENTATION.md → Sección 1.4

---

### 1.5 Actualizar middleware.ts ⬜
- **Archivo:** `apps/web/middleware.ts`
- **Cambios:**
  - [ ] Buscar `const SUPPORTED_LOCALES = ['es', 'en'];`
  - [ ] Cambiar a: `const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'pt'];`
  - [ ] Verificar que regex de locale detection incluya `fr|pt`

**Buscar y verificar:**
```typescript
// Debería tener algo como:
const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'pt'];

// Y en locale detection:
pathname.match(/\/(es|en|fr|pt)(\/|$)/)?.[1]
```

**Verificación:** `pnpm type-check`

**Referencia:** Ver TECHNICAL_IMPLEMENTATION.md → Sección 1.5

---

### 1.6 Actualizar docs/middleware.ts ⬜
- **Archivo:** `apps/docs/middleware.ts`
- **Cambios:**
  - [ ] Buscar `locales: ['es', 'en']`
  - [ ] Cambiar a: `locales: ['es', 'en', 'fr', 'pt']`
  - [ ] Si hay regex de locale, actualizar a incluir `fr|pt`

**Verificación:** `pnpm type-check`

**Referencia:** Ver TECHNICAL_IMPLEMENTATION.md → Sección 1.6

---

### 1.7 Crear Estructura de Carpetas ⬜
- **Cambios:**
  - [ ] `mkdir -p apps/web/i18n/locales/fr`
  - [ ] `mkdir -p apps/web/i18n/locales/pt`
  - [ ] `mkdir -p apps/web/i18n/api/locales/fr`
  - [ ] `mkdir -p apps/web/i18n/api/locales/pt`
- [ ] Verificar que existen: `ls -la apps/web/i18n/locales/`

---

## 🧪 Testing Fase 1

### Pre-Testing Compilation
```bash
# 1. Compilar proyecto completo
pnpm build

# 2. Verificar tipos
pnpm type-check

# 3. Iniciar servidor local
pnpm dev
```

**Resultado esperado:** ✅ Sin errores, servidor corriendo en http://localhost:3000

### Testing Manual

#### Test 1: Rutas accesibles en 4 idiomas
- [ ] Navegar a http://localhost:3000/es/dashboard → ✅ Funciona
- [ ] Navegar a http://localhost:3000/en/dashboard → ✅ Funciona
- [ ] Navegar a http://localhost:3000/fr/dashboard → ✅ Funciona (NUEVO)
- [ ] Navegar a http://localhost:3000/pt/dashboard → ✅ Funciona (NUEVO)

#### Test 2: Language Switcher muestra 4 opciones
- [ ] Abrir http://localhost:3000/es/dashboard
- [ ] Buscar botón de language switcher (ícono de globo)
- [ ] Clickear dropdown
- [ ] Verificar que muestra:
  - [ ] Español ✓
  - [ ] English
  - [ ] Français ← NUEVO
  - [ ] Português (Brasil) ← NUEVO

#### Test 3: Cambio de idioma funciona
- [ ] Estar en `/es/dashboard` → Clickear FR → Ir a `/fr/dashboard` ✅
- [ ] Estar en `/en/dashboard` → Clickear PT → Ir a `/pt/dashboard` ✅
- [ ] Estar en `/fr/dashboard` → Clickear ES → Ir a `/es/dashboard` ✅

#### Test 4: Parámetros dinámicos se preservan
- [ ] Navegar a `/es/dashboard/exams/123-abc-456`
- [ ] Clickear FR en language switcher
- [ ] Verificar URL: `/fr/dashboard/examens/123-abc-456` ✅ (ID preservado)

#### Test 5: Query params se preservan
- [ ] Navegar a `/es/dashboard?tab=results`
- [ ] Clickear EN en language switcher
- [ ] Verificar URL: `/en/dashboard?tab=results` ✅ (query param preservado)

---

## 📝 Notas de Implementación

### Puntos críticos:
1. **routing.ts es grande:** Tendrá 200+ rutas. Puedes usar buscar-reemplazar inteligente
2. **route-mapper.ts es nuevo:** Copiar exactamente desde TECHNICAL_IMPLEMENTATION.md
3. **language-switcher:** Eliminar hardcoded `routeMap` y `reverseRouteMap` (líneas 41-72)
4. **Middlewares:** Solo 1 línea cada uno

### Orden recomendado de ejecución:
1. config.ts (rápido, ~2 min)
2. routing.ts (más lento, ~20-30 min)
3. route-mapper.ts (rápido, ~5 min)
4. language-switcher-dropdown.tsx (medio, ~10 min)
5. middleware.ts (muy rápido, ~2 min)
6. docs/middleware.ts (muy rápido, ~2 min)
7. Crear carpetas (instantáneo)
8. Testing (15-20 min)

---

## 🔄 Git Workflow

### Durante implementación:
```bash
# Commit incremental por archivo/cambio
git add apps/web/i18n/config.ts
git commit -m "feat: Add FR/PT to i18n config locales and names"

git add apps/web/i18n/routing.ts
git commit -m "feat: Expand routing.ts with FR/PT pathnames"

# ... etc
```

### Al final de Fase 1:
```bash
# Ver commits
git log --oneline -n 10

# Verificar cambios
git diff main..feature/pr-fr-translation --stat
```

---

## ✅ Checklist de Finalización

- [ ] Todos los cambios implementados
- [ ] `pnpm build` sin errores
- [ ] `pnpm type-check` sin errores
- [ ] `pnpm dev` inicia sin problemas
- [ ] Language switcher muestra 4 idiomas
- [ ] Todos los tests manuales pasan
- [ ] Commits bien organizados
- [ ] Rama lista para PR

---

## 📊 Progreso

| Tarea | Estado | Tiempo |
|-------|--------|--------|
| 1.1 config.ts | ⬜ | 2 min |
| 1.2 routing.ts | ⬜ | 20-30 min |
| 1.3 route-mapper.ts | ⬜ | 5 min |
| 1.4 language-switcher | ⬜ | 10 min |
| 1.5 middleware.ts | ⬜ | 2 min |
| 1.6 docs/middleware.ts | ⬜ | 2 min |
| 1.7 Carpetas | ⬜ | 1 min |
| 🧪 Testing | ⬜ | 15-20 min |
| **TOTAL** | | **1.5-2.5h** |

---

*Checklist de Fase 1 - v1.0 (Diciembre 25, 2025)*
