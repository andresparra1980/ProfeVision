# Agregar Nuevo Idioma - Guía Completa

Esta guía muestra el proceso completo para agregar un nuevo idioma (ejemplo: Alemán/DE) a ProfeVision.

---

## ⏱️ Tiempo Estimado: 85-90 minutos

| Fase | Tiempo |
|------|--------|
| Git Branch | 2 mins |
| Configuración | 15 mins |
| Traducción (scripts) | 30 mins |
| Validación traducciones | 5 mins |
| Integración apps/web | 20 mins |
| Integración apps/docs | 5 mins |
| Build & Testing | 5 mins |
| Smoke Test | 2 mins |
| Validación Manual | 10 mins |
| Git Commit & PR | 5 mins |

---

## 📚 Índice

- [Pre-requisitos](#pre-requisitos)
- [Paso 0: Git Branch Strategy](#paso-0-git-branch-strategy)
- [Paso 1: Configurar Idioma](#paso-1-configurar-idioma)
- [Paso 2: Ejecutar Traducciones](#paso-2-ejecutar-traducciones)
- [Paso 3: Validar Traducciones](#paso-3-validar-traducciones)
- [Paso 4: Integración apps/web](#paso-4-integración-appsweb)
- [Paso 5: Integración apps/docs](#paso-5-integración-appsdocs)
- [Paso 6: Build & Testing](#paso-6-build--testing)
- [Paso 7: Smoke Test](#paso-7-smoke-test)
- [Paso 8: Validación Manual](#paso-8-validación-manual)
- [Paso 9: Git Commit & PR](#paso-9-git-commit--pr)
- [Troubleshooting](#troubleshooting)

---

## Pre-requisitos

- [ ] Python 3.9+
- [ ] OpenRouter API key (ver [Setup](#setup-api-key))
- [ ] Acceso al repo ProfeVision
- [ ] Familiaridad con YAML y TypeScript
- [ ] Node.js 18+ y pnpm

### Setup API Key

1. Obtener API key en: https://openrouter.ai/keys
2. Crear archivo `.env.local` en `mddocs/translation-process/`:

```bash
cd mddocs/translation-process
cp .env.example .env.local
# Editar .env.local y agregar tu API key
```

---

## Paso 0: Git Branch Strategy

**Tiempo: 2 mins**

### 0.1 Crear Branch

Usar convención de nombres estándar:

```bash
# Desde el root del proyecto
cd /path/to/ProfeVision

# Actualizar main/master
git checkout main
git pull origin main

# Crear feature branch
git checkout -b feat/add-{lang}-translation

# Ejemplo para alemán:
git checkout -b feat/add-german-translation
```

### 0.2 Branch Naming Convention

**Formato:** `feat/add-{language}-translation`

**Ejemplos:**
- `feat/add-german-translation` (de)
- `feat/add-italian-translation` (it)
- `feat/add-chinese-translation` (zh)

---

## Paso 1: Configurar Idioma

**Tiempo: 15 mins**

### 1.1 Crear Prompt Config

Crear archivo: `config/prompts/de.yaml`

Usa `config/prompts/_template.yaml` como base y personaliza:

```yaml
# Alemán (German) - Translation Configuration
language: "de"
language_english: "German"
locale_code: "de"

formality: "formal"
formality_details: "Sie (formal), not du (informal)"

# Términos técnicos (apps/web JSON)
tech_terms:
  dashboard: "Dashboard"
  exam: "Prüfung"
  grade: "Note"
  grading: "Bewertung"
  scan: "Scannen"
  student: "Student"
  teacher: "Lehrer"
  subject: "Fach"
  group: "Gruppe"
  assignment: "Aufgabe"
  result: "Ergebnis"
  score: "Punktzahl"
  question: "Frage"
  answer: "Antwort"

# Términos UI específicos
ui_terms:
  login: "Anmelden"
  logout: "Abmelden"
  signup: "Registrieren"
  forgot_password: "Passwort vergessen"
  reset_password: "Passwort zurücksetzen"
  save: "Speichern"
  cancel: "Abbrechen"
  delete: "Löschen"
  edit: "Bearbeiten"
  create: "Erstellen"
  back: "Zurück"
  next: "Weiter"
  previous: "Zurück"
  finish: "Fertigstellen"
  loading: "Lädt"
  error: "Fehler"
  success: "Erfolg"

# ⭐ IMPORTANTE: Fumadocs UI términos (apps/docs layout.tsx)
fumadocs_ui:
  search: "Suchen"
  searchNoResult: "Keine Ergebnisse gefunden"
  toc: "Auf dieser Seite"
  tocNoHeadings: "Keine Überschriften"
  lastUpdate: "Zuletzt aktualisiert"
  chooseLanguage: "Sprache"
  nextPage: "Weiter"
  previousPage: "Zurück"
  chooseTheme: "Thema"

# Guidelines específicas
additional_guidelines: |
  - Use German standard (Hochdeutsch)
  - Capitalize all nouns (German grammar rule)
  - Use compound words appropriately
  - Academic terminology should be formal
  - Date format: DD.MM.YYYY
  - Number format: 1.234,56

# Ejemplos de traducción
examples:
  - source: "Crear Examen"
    target: "Prüfung erstellen"
    notes: "Use infinitive verb form"
  - source: "¿Olvidaste tu contraseña?"
    target: "Passwort vergessen?"
  - source: "Gestiona y crea exámenes"
    target: "Verwalten und erstellen Sie Prüfungen"
```

**Tips:**
- Investigar terminología educativa del país
- Consultar sitios académicos en el idioma
- Verificar formalidad cultural (tú vs usted)
- Incluir 3-5 ejemplos representativos

### 1.2 Habilitar en languages.yaml

Editar: `config/languages.yaml`

```yaml
languages:
  # ... idiomas existentes ...
  
  de:  # ← NUEVO
    name: "Deutsch"
    name_english: "German"
    locale_code: "de"
    iso_code: "de-DE"
    country: "Germany"
    enabled: true       # ← Habilitar para traducción
    priority: 5
    notes: "Added {date}"
```

### 1.3 Crear Directorios

```bash
# Desde mddocs/translation-process/
cd ../..  # Ir a root del proyecto

# Crear carpetas para traducciones
mkdir -p apps/web/i18n/locales/de
mkdir -p apps/web/i18n/api/locales/de

# Verificar que existen
ls -la apps/web/i18n/locales/
```

---

## Paso 2: Ejecutar Traducciones

**Tiempo: 30 mins**

### 2.1 Traducir UI/API JSON Files

```bash
# Desde mddocs/translation-process/
cd mddocs/translation-process

# Verificar .env.local existe
ls -la .env.local  # Debe existir

# Traducir todos los archivos JSON de UI/API
python scripts/translate-ui.py --lang de

# Output esperado:
# ═══════════════════════════════════════════════════════════════
# Translating to DE
# ═══════════════════════════════════════════════════════════════
# 
# 📂 UI Translations (locales/de/):
#   [1/18] 📝 common.json ... ✓
#   [2/18] 📝 dashboard.json ... ✓
#   ...
#   [18/18] 📝 settings.json ... ✓
# 
# 📂 API Translations (api/locales/de/):
#   [1/22] 📝 exams.json ... ✓
#   ...
# 
# ✅ DE: 40/40 files successful
```

**Monitoreo:**
- Script tarda ~15-20 segundos por archivo
- Si falla: revisar API key en `.env.local`
- Rate limiting: Script tiene delays automáticos

### 2.2 Traducir Docs MDX Files

```bash
# Traducir documentación
python scripts/translate-docs.py --lang de

# Output esperado:
# ═══════════════════════════════════════════════════════════════
# 📚 Processing CONTENT files for DE...
# ═══════════════════════════════════════════════════════════════
# 
# 📄 Translating getting-started.en.mdx to DE...
#   → Translating title: Getting Started
#   → Translating chunk (1250 chars)...
# ✅ Created getting-started.de.mdx
# ...
# ✅ Translation complete!
```

**Archivos traducidos:**
- `*.de.mdx` en `apps/docs/content/docs/`
- `meta.de.json` en cada subdirectorio

**⚠️ Nota:** El script `translate-docs.py` está marcado como TODO en el plan. Si no existe aún, este paso se hará manualmente o se pospone.

---

## Paso 3: Validar Traducciones

**Tiempo: 5 mins**

### 3.1 Validación Automática

```bash
# Validar estructura y claves (cuando esté implementado)
python scripts/validate.py --lang de --verbose

# Si el script no existe aún, validar manualmente:
# - Abrir 2-3 archivos JSON
# - Verificar sintaxis válida
# - Verificar claves completas
```

### 3.2 Validación Manual (Sampling)

Revisar 2-3 archivos traducidos:

```bash
# Ver archivo traducido
cat ../../apps/web/i18n/locales/de/common.json | head -20

# Verificar:
# - JSON válido
# - Claves idénticas a ES
# - Valores traducidos (no en español)
# - Placeholders preservados: {count}, {{name}}, etc.
```

**Checklist:**
- [ ] JSON estructura correcta
- [ ] Todas las claves presentes
- [ ] Valores traducidos
- [ ] Placeholders sin cambios
- [ ] HTML entities preservadas

---

## Paso 4: Integración apps/web

**Tiempo: 20 mins**

Actualizar 4 archivos de configuración en `apps/web/`.

### 4.1 Actualizar `i18n/config.ts`

**Archivo:** `apps/web/i18n/config.ts`

```typescript
// ANTES
export const locales = ['es', 'en', 'fr', 'pt'] as const;

export const localeNames = {
  es: 'Español',
  en: 'English',
  fr: 'Français',
  pt: 'Português (Brasil)',
} as const;

// DESPUÉS (agregar 'de')
export const locales = ['es', 'en', 'fr', 'pt', 'de'] as const;  // ← AGREGAR

export const localeNames = {
  es: 'Español',
  en: 'English',
  fr: 'Français',
  pt: 'Português (Brasil)',
  de: 'Deutsch',  // ← AGREGAR
} as const;
```

**Validación:**
```bash
cd ../../apps/web
pnpm tsc --noEmit  # Verificar que compila
```

---

### 4.2 Actualizar `i18n/routing.ts` (Todas las Rutas)

**Archivo:** `apps/web/i18n/routing.ts`

⚠️ **Este es el paso más tedioso** - debes agregar el nuevo idioma a **todas** las rutas (~60 pathnames).

**Estrategia:**

**Opción A: Find & Replace Pattern (Recomendado)**

1. Abre `routing.ts` en VSCode
2. Buscar: `    pt: '(.+)',`
3. Reemplazar: `    pt: '$1',\n    de: 'TRANSLATE_ME',`
4. Replace All
5. Buscar cada `TRANSLATE_ME` y reemplazar con traducción alemana

**Opción B: Manual Systematic**

1. Buscar todas las líneas con `pt:` (último idioma)
2. Después de cada `pt:`, agregar línea con `de:`

**Ejemplo de actualización:**

```typescript
// ANTES
'/dashboard/exams': {
  es: '/dashboard/examenes',
  en: '/dashboard/exams',
  fr: '/dashboard/examens',
  pt: '/dashboard/exames',
},

// DESPUÉS
'/dashboard/exams': {
  es: '/dashboard/examenes',
  en: '/dashboard/exams',
  fr: '/dashboard/examens',
  pt: '/dashboard/exames',
  de: '/dashboard/prufungen',  // ← AGREGAR
},
```

**Guía de traducción de rutas comunes:**

| Español | English | Deutsch |
|---------|---------|---------|
| examenes | exams | prufungen |
| estudiantes | students | studenten |
| grupos | groups | gruppen |
| materias | subjects | facher |
| calificaciones | grades | noten |
| configuracion | settings | einstellungen |
| perfil | profile | profil |
| iniciar-sesion | login | anmelden |
| registro | register | registrieren |
| restablecer-contrasena | reset-password | passwort-zurucksetzen |

**Validación:**

```bash
# Contar rutas por idioma (deben ser iguales)
grep -c "es:" apps/web/i18n/routing.ts
grep -c "en:" apps/web/i18n/routing.ts
grep -c "fr:" apps/web/i18n/routing.ts
grep -c "pt:" apps/web/i18n/routing.ts
grep -c "de:" apps/web/i18n/routing.ts  # ← Debe ser igual

# Ejemplo output:
# 60
# 60
# 60
# 60
# 60  ← Correcto!
```

---

### 4.3 Actualizar `i18n/route-constants.ts`

**Archivo:** `apps/web/i18n/route-constants.ts`

Este archivo contiene **subset** de rutas (~28 mappings, solo rutas públicas/auth).

```typescript
// ANTES
export const routeMappings: Record<string, Record<string, string>> = {
  login: { 
    es: "iniciar-sesion", 
    en: "login", 
    fr: "connexion", 
    pt: "entrar" 
  },
  register: {
    es: "registro",
    en: "register",
    fr: "inscription",
    pt: "cadastro"
  },
  // ... más mappings
};

// DESPUÉS (agregar 'de' a CADA mapping)
export const routeMappings: Record<string, Record<string, string>> = {
  login: { 
    es: "iniciar-sesion", 
    en: "login", 
    fr: "connexion", 
    pt: "entrar",
    de: "anmelden"  // ← AGREGAR
  },
  register: {
    es: "registro",
    en: "register",
    fr: "inscription",
    pt: "cadastro",
    de: "registrieren"  // ← AGREGAR
  },
  // ... repetir para ~28 mappings
};
```

**⚠️ IMPORTANTE: Sincronización**

`route-constants.ts` debe estar **sincronizado** con `routing.ts` para las rutas que contiene.

**Validación:**

```bash
# Verificar sincronización
# Ejemplo: login route
grep "/auth/login" apps/web/i18n/routing.ts
# Debe coincidir con:
grep "login:" apps/web/i18n/route-constants.ts
```

---

### 4.4 Actualizar `middleware.ts`

**Archivo:** `apps/web/middleware.ts`

**Cambio 1: Línea ~26**

```typescript
// ANTES
const supportedLocales = ["es", "en", "fr", "pt"] as const;

// DESPUÉS
const supportedLocales = ["es", "en", "fr", "pt", "de"] as const;  // ← AGREGAR
```

**Cambio 2: Línea ~235**

```typescript
// ANTES
const locale =
  (["es", "en", "fr", "pt"].includes(pathLocale) ? pathLocale : "es") 
    as "es" | "en" | "fr" | "pt";

// DESPUÉS
const locale =
  (["es", "en", "fr", "pt", "de"].includes(pathLocale) ? pathLocale : "es") 
    as "es" | "en" | "fr" | "pt" | "de";  // ← AGREGAR
```

**Validación:**

```bash
cd apps/web
pnpm tsc --noEmit  # Debe compilar sin errores
```

---

### 4.5 Resumen apps/web

| Archivo | Cambios |
|---------|---------|
| `i18n/config.ts` | + locale, + localeName (2 líneas) |
| `i18n/routing.ts` | + ~60 pathnames (61 líneas) |
| `i18n/route-constants.ts` | + ~28 mappings (28 líneas) |
| `middleware.ts` | + supportedLocales, + regex (2 líneas) |
| **TOTAL** | **93 líneas** |

---

## Paso 5: Integración apps/docs

**Tiempo: 5 mins**

Actualizar 2 archivos en `apps/docs/`.

### 5.1 Actualizar `lib/i18n.ts`

**Archivo:** `apps/docs/lib/i18n.ts`

```typescript
// ANTES
export const i18n: I18nConfig = {
  defaultLanguage: 'es',
  languages: ['es', 'en', 'fr', 'pt'],
  hideLocale: 'default-locale',
};

// DESPUÉS
export const i18n: I18nConfig = {
  defaultLanguage: 'es',
  languages: ['es', 'en', 'fr', 'pt', 'de'],  // ← AGREGAR
  hideLocale: 'default-locale',
};
```

---

### 5.2 Actualizar `app/[lang]/layout.tsx`

**Archivo:** `apps/docs/app/[lang]/layout.tsx`

**Cambio 1: Objeto `translations` (líneas ~7-52)**

Agregar traducciones fumadocs UI (copiar desde `config/prompts/de.yaml` sección `fumadocs_ui`):

```typescript
const translations = {
  es: { ... },
  en: { ... },
  fr: { ... },
  pt: { ... },
  de: {  // ← AGREGAR TODO ESTE BLOQUE
    search: 'Suchen',
    searchNoResult: 'Keine Ergebnisse gefunden',
    toc: 'Auf dieser Seite',
    tocNoHeadings: 'Keine Überschriften',
    lastUpdate: 'Zuletzt aktualisiert',
    chooseLanguage: 'Sprache',
    nextPage: 'Weiter',
    previousPage: 'Zurück',
    chooseTheme: 'Thema',
  },
};
```

**Cambio 2: Array `locales` (líneas ~54-59)**

```typescript
// ANTES
const locales = [
  { locale: 'es', name: 'Español' },
  { locale: 'en', name: 'English' },
  { locale: 'fr', name: 'Français' },
  { locale: 'pt', name: 'Português (Brasil)' },
];

// DESPUÉS
const locales = [
  { locale: 'es', name: 'Español' },
  { locale: 'en', name: 'English' },
  { locale: 'fr', name: 'Français' },
  { locale: 'pt', name: 'Português (Brasil)' },
  { locale: 'de', name: 'Deutsch' },  // ← AGREGAR
];
```

---

## Paso 6: Build & Testing

**Tiempo: 5 mins**

### 6.1 Build apps/web

```bash
cd ../../apps/web
pnpm build
```

**Éxito esperado:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (XX/XX)

Route (app)                              Size
┌ ○ /es                                 XX kB
├ ○ /en                                 XX kB
├ ○ /fr                                 XX kB
├ ○ /pt                                 XX kB
└ ○ /de                                 XX kB  ← NUEVO
```

**Si hay errores:**
- TypeScript → Revisar routing.ts tipos
- Missing translations → Verificar JSON files
- Route errors → Verificar pathnames completos

---

### 6.2 Build apps/docs

```bash
cd ../docs
pnpm build
```

**Éxito esperado:**
```
✓ Compiled successfully
✓ Generating static pages (XX/XX)

Route (app)
┌ ○ /es/docs                            XX kB
├ ○ /en/docs                            XX kB
├ ○ /fr/docs                            XX kB
├ ○ /pt/docs                            XX kB
└ ○ /de/docs                            XX kB  ← NUEVO
```

---

## Paso 7: Smoke Test

**Tiempo: 2 mins**

Ejecutar script de validación automatizada:

```bash
cd ../../mddocs/translation-process
./scripts/smoke-test.sh de
```

**Output esperado:**

```
═══════════════════════════════════════════════════════════════
🔍 Smoke Test - Language: de
═══════════════════════════════════════════════════════════════

📂 Translation Files
───────────────────────────────────────────────────────────────
  ✅ UI locales directory exists
  ✅ API locales directory exists
  ✅ At least 10 UI JSON files
  ✅ At least 10 API JSON files
  ✅ At least 5 MDX docs files

⚙️  Config Files - apps/web
───────────────────────────────────────────────────────────────
  ✅ i18n/config.ts includes locale
  ✅ i18n/routing.ts includes locale
  ✅ middleware.ts includes locale
  ✅ route-constants.ts has mappings

📚 Config Files - apps/docs
───────────────────────────────────────────────────────────────
  ✅ lib/i18n.ts includes locale
  ✅ layout.tsx has translations

🔍 JSON Syntax Validation
───────────────────────────────────────────────────────────────
  ✅ Valid JSON: common.json
  ✅ Valid JSON: dashboard.json
  ✅ Valid JSON: auth.json

═══════════════════════════════════════════════════════════════
📊 Results: 14/14 passed
═══════════════════════════════════════════════════════════════

✅ All checks passed! Language de is ready.
```

**Si falla:**
```bash
./scripts/smoke-test.sh de --verbose  # Ver detalles
```

---

## Paso 8: Validación Manual

**Tiempo: 10 mins**

Ver checklist completo en: [`VALIDATION_CHECKLIST.md`](./VALIDATION_CHECKLIST.md)

### 8.1 Testing apps/web

```bash
cd ../../apps/web
pnpm dev
# Abrir http://localhost:3000/de
```

**Verificar:**
- [ ] Homepage carga en alemán
- [ ] Language switcher muestra "Deutsch"
- [ ] Cambio de idioma funciona
- [ ] Dashboard: `http://localhost:3000/de/dashboard`
- [ ] Ruta traducida: `http://localhost:3000/de/dashboard/prufungen`

### 8.2 Testing apps/docs

```bash
cd ../docs
pnpm dev
# Abrir http://localhost:3001/de/docs
```

**Verificar:**
- [ ] Docs homepage carga
- [ ] Sidebar en alemán
- [ ] Search placeholder: "Suchen"
- [ ] TOC: "Auf dieser Seite"
- [ ] Language switcher funciona

---

## Paso 9: Git Commit & PR

**Tiempo: 5 mins**

### 9.1 Verificar Cambios

```bash
cd ../../
git status
```

**Archivos esperados:**
```
Modified:
  apps/web/i18n/config.ts
  apps/web/i18n/routing.ts
  apps/web/i18n/route-constants.ts
  apps/web/middleware.ts
  apps/docs/lib/i18n.ts
  apps/docs/app/[lang]/layout.tsx

New files:
  apps/web/i18n/locales/de/*.json (18 files)
  apps/web/i18n/api/locales/de/*.json (22 files)
  apps/docs/content/docs/**/*.de.mdx (30+ files)
  mddocs/translation-process/config/prompts/de.yaml
```

**⚠️ Verificar que NO estén:**
- `.env.local`
- `node_modules/`
- `.next/`

---

### 9.2 Commit

```bash
git add .

git commit -m "feat: add German (de) translation

- Add German UI/API translations (40 JSON files)
- Add German docs translations (30+ MDX files)
- Update apps/web configs (routing, middleware)
- Update apps/docs configs (i18n, layout)
- Tested: builds pass, smoke test ✓, manual validation ✓"
```

---

### 9.3 Push & Create PR

```bash
git push origin feat/add-german-translation
```

**En GitHub:**

1. Click "Compare & pull request"
2. **Title:** `feat: Add German (de) Translation`
3. **Description:**

```markdown
## Summary
Adds German (de) translation support to ProfeVision.

## Changes
- ✅ 40 JSON files (UI/API translations)
- ✅ 30+ MDX files (Docs translations)
- ✅ 6 config files updated (apps/web + apps/docs)
- ✅ All builds passing
- ✅ Smoke test passing (14/14 checks)

## Testing
- [x] `pnpm build` succeeds for apps/web
- [x] `pnpm build` succeeds for apps/docs
- [x] Smoke test: `./scripts/smoke-test.sh de` ✓
- [x] Manual testing: http://localhost:3000/de ✓
- [x] Manual testing: http://localhost:3001/de/docs ✓

## Screenshots
(Optional: Add screenshots)
```

---

## Troubleshooting

### Script de traducción falla

**Error: API key no configurada**
```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
# O verificar .env.local
cat mddocs/translation-process/.env.local
```

**Error: Rate limit**
```
Solución: Esperar 1-2 mins o reducir concurrency
```

### Build falla

**Error de tipo en routing.ts**
```
Causa: Faltan traducciones de rutas para 'de'
Solución: Agregar 'de' a todas las rutas en pathnames
```

### Language switcher no funciona

```bash
# Verificar middleware.ts incluye 'de'
grep "supportedLocales" apps/web/middleware.ts
# Debe incluir: ["es", "en", "fr", "pt", "de"]
```

### Smoke test falla

```bash
# Ver errores detallados
./scripts/smoke-test.sh de --verbose

# Verificar cada archivo mencionado
```

---

## Recursos

### Terminología por Idioma

**Alemán (DE):**
- Goethe Institut - German educational terms
- DWDS - Dictionary of German language

**Italiano (IT):**
- Accademia della Crusca
- Università di Bologna glossary

**Chino (ZH-CN):**
- 教育部 (Ministry of Education) - Standard terms

### Herramientas

- **DeepL:** Verificación términos técnicos
- **Linguee:** Context examples
- **Google Translate:** Quick reference

---

## 📊 Resumen Final

| Paso | Descripción | Tiempo |
|------|-------------|--------|
| 0 | Git Branch | 2 mins |
| 1 | Configurar Idioma | 15 mins |
| 2 | Traducción | 30 mins |
| 3 | Validar Traducciones | 5 mins |
| 4 | Integración apps/web | 20 mins |
| 5 | Integración apps/docs | 5 mins |
| 6 | Build & Testing | 5 mins |
| 7 | Smoke Test | 2 mins |
| 8 | Validación Manual | 10 mins |
| 9 | Git & PR | 5 mins |
| **TOTAL** | | **~85-90 mins** |

---

*Guía v2.0 - Actualizada Diciembre 29, 2025*
