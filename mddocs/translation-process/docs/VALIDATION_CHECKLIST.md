# Validation Checklist - Adding New Language

Use this checklist to verify a new language has been properly integrated.

**Language:** __________ (e.g., de, it, zh)  
**Date:** __________  
**Validator:** __________

---

## ✅ Phase 1: Translation Files

### UI/API Translations (apps/web)
- [ ] Directory exists: `apps/web/i18n/locales/{lang}/`
- [ ] Directory exists: `apps/web/i18n/api/locales/{lang}/`
- [ ] At least 15 JSON files in UI locales
- [ ] At least 15 JSON files in API locales
- [ ] Sample file validation:
  - [ ] `common.json` - Valid JSON, ~200+ keys
  - [ ] `dashboard.json` - Valid JSON, ~150+ keys
  - [ ] `auth.json` - Valid JSON, ~40+ keys

### Docs Translations (apps/docs)
- [ ] At least 20 `.{lang}.mdx` files in `apps/docs/content/docs/`
- [ ] At least 5 `meta.{lang}.json` files
- [ ] Sample file validation:
  - [ ] `index.{lang}.mdx` - Valid frontmatter
  - [ ] Frontmatter has translated `title` and `description`
  - [ ] Code blocks preserved (not translated)

---

## ✅ Phase 2: Config Files Updated

### apps/web (4 files)

**File: `apps/web/i18n/config.ts`**
- [ ] Locale added to array: `locales: [..., '{lang}']`
- [ ] Locale name added: `localeNames: { {lang}: '...' }`

**File: `apps/web/i18n/routing.ts`**
- [ ] Locale in array: `locales: [..., '{lang}']`
- [ ] All pathnames have translation for new locale
- [ ] Count: ____ pathnames updated (should be ~60+)
- [ ] Spot check 5 random pathnames have {lang} key

**File: `apps/web/i18n/route-constants.ts`**
- [ ] All route mappings have {lang} key
- [ ] Count: ____ mappings updated (should be ~28)
- [ ] Synchronized with routing.ts pathnames

**File: `apps/web/middleware.ts`**
- [ ] Line ~26: `supportedLocales` includes '{lang}'
- [ ] Line ~235: Locale in path extraction regex

### apps/docs (2 files)

**File: `apps/docs/lib/i18n.ts`**
- [ ] Locale in array: `languages: [..., '{lang}']`

**File: `apps/docs/app/[lang]/layout.tsx`**
- [ ] `translations` object has {lang} key
- [ ] All fumadocs UI terms translated (9 terms):
  - [ ] search
  - [ ] searchNoResult
  - [ ] toc
  - [ ] tocNoHeadings
  - [ ] lastUpdate
  - [ ] chooseLanguage
  - [ ] nextPage
  - [ ] previousPage
  - [ ] chooseTheme
- [ ] `locales` array has entry: `{ locale: '{lang}', name: '...' }`

---

## ✅ Phase 3: Build Validation

### apps/web
```bash
cd apps/web
pnpm install
pnpm build
```

- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No missing translation warnings
- [ ] Build output shows locale pages generated

### apps/docs
```bash
cd apps/docs
pnpm install
pnpm build
```

- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] MDX files compile successfully
- [ ] Static pages generated for {lang}

---

## ✅ Phase 4: Smoke Test (Automated)

```bash
cd mddocs/translation-process
./scripts/smoke-test.sh {lang} --verbose
```

- [ ] All checks passed
- [ ] Translation files count correct
- [ ] Config files validated
- [ ] JSON syntax valid

---

## ✅ Phase 5: Manual Testing (Local)

### apps/web - Start dev server
```bash
cd apps/web
pnpm dev
# Server at http://localhost:3000
```

**Homepage:**
- [ ] `http://localhost:3000/{lang}` loads correctly
- [ ] Content is in target language
- [ ] No missing translation keys (no {{key}} visible)

**Language Switcher:**
- [ ] Dropdown shows new language
- [ ] Name displays correctly
- [ ] Clicking switches to new language
- [ ] URL changes to `/{lang}/...`

**Dashboard:**
- [ ] `http://localhost:3000/{lang}/dashboard` loads
- [ ] UI elements translated
- [ ] Navigation items translated
- [ ] Forms and buttons translated

**Translated Routes:**
- [ ] Public route works (e.g., `/{lang}/examenes` → translated path)
- [ ] Auth route works (e.g., `/{lang}/auth/login` → translated path)
- [ ] Dashboard route works (e.g., `/{lang}/dashboard/examenes`)

### apps/docs - Start dev server
```bash
cd apps/docs
pnpm dev
# Server at http://localhost:3001
```

**Docs Homepage:**
- [ ] `http://localhost:3001/{lang}/docs` loads
- [ ] Sidebar in target language
- [ ] Search placeholder translated
- [ ] TOC headers translated

**Language Switcher:**
- [ ] Dropdown shows new language
- [ ] Switching works correctly
- [ ] URL updates to `/{lang}/docs/...`

**Content Pages:**
- [ ] At least 3 different doc pages load
- [ ] Content is translated
- [ ] Code blocks preserved
- [ ] Links functional

---

## ✅ Phase 6: Content Quality (Sampling)

### Spot Check Translations

**UI Files (3 random):**
1. File: ____________
   - [ ] Natural phrasing
   - [ ] Technical terms correct
   - [ ] Placeholders preserved
   - [ ] No Spanish/English leakage

2. File: ____________
   - [ ] Natural phrasing
   - [ ] Technical terms correct
   - [ ] Placeholders preserved
   - [ ] No Spanish/English leakage

3. File: ____________
   - [ ] Natural phrasing
   - [ ] Technical terms correct
   - [ ] Placeholders preserved
   - [ ] No Spanish/English leakage

**Docs Files (2 random):**
1. File: ____________
   - [ ] Frontmatter translated
   - [ ] Markdown structure preserved
   - [ ] Code blocks intact
   - [ ] Natural language flow

2. File: ____________
   - [ ] Frontmatter translated
   - [ ] Markdown structure preserved
   - [ ] Code blocks intact
   - [ ] Natural language flow

---

## ✅ Phase 7: Git Validation

```bash
git status
```

**Expected files changed:**
- [ ] Config files (6 files)
- [ ] Translation files (40-80 files)
- [ ] No unexpected changes
- [ ] No `.env.local` in staged files
- [ ] No build artifacts committed

**Commit:**
- [ ] Branch name follows convention: `feat/add-{lang}-translation`
- [ ] Commit message descriptive
- [ ] All changes staged

---

## 📊 Summary

**Total Checks:** _____ / _____  
**Pass Rate:** _____%

**Issues Found:**
1. ___________________________________
2. ___________________________________
3. ___________________________________

**Status:**
- [ ] ✅ Ready for PR
- [ ] ⚠️ Issues to fix (see above)
- [ ] ❌ Major problems - needs rework

**Notes:**
_______________________________________
_______________________________________
_______________________________________

---

**Validated by:** __________  
**Date:** __________  
**Signature:** __________
