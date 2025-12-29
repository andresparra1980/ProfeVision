# Plan de Proceso de Traducción Estandarizado

**Fecha:** Diciembre 29, 2025  
**Objetivo:** Estandarizar proceso de traducción para cualquier idioma  
**Basado en:** Experiencia PR/FR completada  
**Arquitectura:** Scripts configurables con prompts por idioma

---

## 📊 Análisis del Proceso Actual

### Scripts Existentes
1. **translate-fr-pt.py** - UI/API translations (apps/web)
   - Traduce JSON files (locales + api/locales)
   - Hardcoded prompts FR/PT
   - OpenRouter + Gemini 3 Flash Preview
   
2. **translate-docs-fr-pt.py** - Docs translations (apps/docs)
   - Traduce MDX files + meta.json
   - Hardcoded prompts FR/PT
   - Preserva frontmatter y code blocks

3. **translate_json_files.py** - Dictionary-based translation
   - Sin IA, usa diccionarios estáticos
   - No escalable

### Limitaciones Actuales
- ❌ Prompts hardcodeados por idioma
- ❌ Target languages fijos en código
- ❌ No reutilizable para nuevos idiomas
- ❌ Config dispersa (API keys, models en código)

---

## 🎯 Objetivos del Proceso Estandarizado

1. **Prompts configurables** - Inyectados por idioma
2. **Scripts genéricos** - Un script para todos los idiomas
3. **Config centralizada** - YAML/JSON para idiomas
4. **Batch processing** - Traducir múltiples idiomas en paralelo
5. **Validación automática** - Estructura + claves + placeholders
6. **Documentación clara** - Para agregar nuevos idiomas

---

## 🏗️ Arquitectura Propuesta

```
mddocs/translation-process/
├── config/
│   ├── languages.yaml           # Config de todos los idiomas
│   ├── prompts/
│   │   ├── ui-translations.md   # Template prompt UI/API
│   │   ├── docs-translations.md # Template prompt docs
│   │   ├── fr.yaml              # Prompt específico FR
│   │   ├── pt.yaml              # Prompt específico PT
│   │   ├── de.yaml              # Prompt específico DE (ejemplo)
│   │   └── it.yaml              # Prompt específico IT (ejemplo)
│   └── models.yaml              # Config de modelos IA
├── scripts/
│   ├── translate-ui.py          # UI/API translations (genérico)
│   ├── translate-docs.py        # Docs translations (genérico)
│   ├── validate.py              # Validación de traducciones
│   ├── batch-translate.py       # Batch processing múltiples idiomas
│   └── utils/
│       ├── config_loader.py     # Carga config YAML
│       ├── prompt_builder.py    # Construye prompts desde templates
│       ├── translator.py        # API wrapper (OpenRouter)
│       └── validator.py         # Validación JSON/MDX
├── docs/
│   ├── README.md                # Overview del proceso
│   ├── ADDING_LANGUAGE.md       # Guía para agregar idioma
│   ├── PROMPT_GUIDELINES.md     # Cómo diseñar prompts
│   └── TROUBLESHOOTING.md       # FAQ y solución de problemas
└── PLAN.md                      # Este archivo
```

---

## 📋 Componentes Clave

### 1. Config de Idiomas (languages.yaml)

```yaml
languages:
  fr:
    name: "Français"
    name_english: "French"
    locale_code: "fr"
    country: "France"
    enabled: true
    priority: 1  # Orden de procesamiento
    
  pt:
    name: "Português (Brasil)"
    name_english: "Brazilian Portuguese"
    locale_code: "pt"
    country: "Brazil"
    enabled: true
    priority: 2
    
  de:
    name: "Deutsch"
    name_english: "German"
    locale_code: "de"
    country: "Germany"
    enabled: false  # Ejemplo futuro
    priority: 3
    
  it:
    name: "Italiano"
    name_english: "Italian"
    locale_code: "it"
    country: "Italy"
    enabled: false  # Ejemplo futuro
    priority: 4

# Source language (no traducir desde aquí)
source_language: "es"  # Español
fallback_language: "en"  # Inglés
```

### 2. Templates de Prompts

**Estructura de Prompt Template (Markdown + Variables):**

```markdown
# ui-translations.md

You are translating ProfeVision UI/API text from {{SOURCE_LANG}} to {{TARGET_LANG}}.

Context: ProfeVision is an exam management platform for teachers.

Guidelines:
1. Use {{FORMALITY}} tone ({{FORMALITY_DETAILS}})
2. Technical term translations:
{{TECH_TERMS}}
3. Preserve JSON structure, placeholders, HTML
4. DO NOT translate: code, component names, paths, URLs
5. Return ONLY valid JSON

{{ADDITIONAL_GUIDELINES}}

Translate this JSON:
```

### 3. Config de Prompt por Idioma (fr.yaml)

```yaml
language: "fr"
formality: "formal"  # formal | informal
formality_details: "vous, not tu"

# Términos técnicos específicos
tech_terms:
  dashboard: "tableau de bord"
  exam: "examen"
  grade: "notation"
  grading: "noter"
  scan: "numériser"
  student: "étudiant"
  teacher: "enseignant"
  subject: "matière"
  group: "groupe"

# Guidelines adicionales
additional_guidelines: |
  - Use French standard (France, not Canadian)
  - Preserve gender-neutral language when possible
  - Academic terminology should be formal

# Ejemplos de traducción
examples:
  - source: "Crear Examen"
    target: "Créer un Examen"
  - source: "¿Olvidaste tu contraseña?"
    target: "Mot de passe oublié ?"
```

### 4. Script Genérico (translate-ui.py)

**Flujo:**
1. Cargar config (`languages.yaml`)
2. Filtrar idiomas enabled
3. Para cada idioma:
   - Cargar prompt config (`config/prompts/{lang}.yaml`)
   - Construir prompt desde template + config
   - Procesar archivos JSON
   - Validar output
   - Guardar

**Uso:**
```bash
# Traducir UI/API para todos los idiomas habilitados
python scripts/translate-ui.py

# Traducir solo FR
python scripts/translate-ui.py --lang fr

# Traducir FR y PT
python scripts/translate-ui.py --lang fr,pt

# Dry run (preview sin escribir)
python scripts/translate-ui.py --dry-run

# Forzar re-traducción (sobrescribir existentes)
python scripts/translate-ui.py --force
```

### 5. Validador (validate.py)

**Validaciones:**
- ✅ JSON válido
- ✅ Mismas claves que source
- ✅ Placeholders preservados (`{{var}}`, `{count}`, etc.)
- ✅ No valores vacíos
- ✅ HTML entities preservadas
- ✅ No code blocks traducidos

**Uso:**
```bash
# Validar todas las traducciones
python scripts/validate.py

# Validar solo FR
python scripts/validate.py --lang fr

# Output detallado
python scripts/validate.py --verbose
```

---

## 🚀 Fases de Implementación

### **Fase 1: Infraestructura Base** (4-6 horas)

#### 1.1 Estructura de Directorios
- [ ] Crear `mddocs/translation-process/`
- [ ] Crear subdirectorios (config, scripts, docs)
- [ ] Copiar scripts existentes como referencia

#### 1.2 Config System
- [ ] Diseñar schema `languages.yaml`
- [ ] Crear `config_loader.py`
- [ ] Diseñar templates de prompts (Markdown)
- [ ] Crear `prompt_builder.py`

#### 1.3 API Wrapper
- [ ] Extraer lógica OpenRouter a `translator.py`
- [ ] Soportar múltiples modelos (config)
- [ ] Rate limiting configurable
- [ ] Retry logic con exponential backoff

#### 1.4 Validation System
- [ ] Implementar `validator.py`
- [ ] JSON structure validation
- [ ] Placeholder validation
- [ ] Key completeness validation

---

### **Fase 1.5: Environment Variables Setup** (0.5 horas) ⭐ NUEVO

#### 1.5.1 Crear .env.example
- [x] Crear `.env.example` en `mddocs/translation-process/`
- [x] Documentar OPENROUTER_API_KEY
- [x] Documentar variables opcionales (MODEL, TEMPERATURE, etc.)
- [x] Crear `.gitignore` para `.env.local`

#### 1.5.2 Documentación
- [x] Guía de setup en README
- [x] Security best practices (no commit .env.local)
- [x] Instrucciones obtener API key

---

### **Fase 1.6: Apps Integration Documentation** (2-3 horas) ⭐ NUEVO

#### 1.6.1 Documentar Integración apps/web
- [x] Proceso actualización `i18n/config.ts`
- [x] Proceso actualización `i18n/routing.ts` (60+ pathnames)
- [x] Proceso actualización `i18n/route-constants.ts` (28 mappings)
- [x] Proceso actualización `middleware.ts` (supportedLocales)
- [x] Notas sobre sincronización routing.ts ↔ route-constants.ts

#### 1.6.2 Documentar Integración apps/docs
- [x] Proceso actualización `lib/i18n.ts`
- [x] Proceso actualización `app/[lang]/layout.tsx`
- [x] Sección fumadocs_ui en prompt YAML
- [x] Ejemplos de traducciones fumadocs

#### 1.6.3 Git Workflow
- [x] Branch naming convention
- [x] Commit message template
- [x] PR description template

#### 1.6.4 Testing & Validation
- [x] Crear smoke-test.sh script
- [x] Crear VALIDATION_CHECKLIST.md
- [x] Documentar build validation
- [x] Documentar manual testing

---

### **Fase 2: Scripts Genéricos UI/API** (6-8 horas)

#### 2.1 Refactorizar translate-fr-pt.py
- [ ] Extraer lógica a funciones genéricas
- [ ] Reemplazar hardcoded prompts con templates
- [ ] Cargar config desde YAML
- [ ] Soportar múltiples target languages

#### 2.2 Implementar translate-ui.py
- [ ] CLI con argparse (--lang, --force, --dry-run)
- [ ] Progress tracking
- [ ] Error handling robusto
- [ ] Logging detallado

#### 2.3 Testing
- [ ] Test con FR (ya existe)
- [ ] Test con idioma nuevo (DE simulado)
- [ ] Validar output

---

### **Fase 3: Scripts Genéricos Docs** (4-6 horas)

#### 3.1 Refactorizar translate-docs-fr-pt.py
- [ ] Extraer lógica MDX parsing
- [ ] Templates de prompts para docs
- [ ] Soportar múltiples idiomas

#### 3.2 Implementar translate-docs.py
- [ ] CLI similar a translate-ui.py
- [ ] Preservar frontmatter
- [ ] Preservar code blocks
- [ ] Skip archivos ya traducidos

---

### **Fase 4: Batch Processing** (3-4 horas)

#### 4.1 Implementar batch-translate.py
- [ ] Orquestar UI + Docs translations
- [ ] Parallel processing (múltiples idiomas)
- [ ] Progress reporting
- [ ] Summary de resultados

#### 4.2 CI/CD Integration (Opcional)
- [ ] GitHub Action para validación
- [ ] Auto-detect missing translations
- [ ] PR checks

---

### **Fase 5: Documentación** (4-5 horas)

#### 5.1 Guías de Usuario
- [ ] README.md (overview)
- [ ] ADDING_LANGUAGE.md (step-by-step)
- [ ] PROMPT_GUIDELINES.md (best practices)
- [ ] TROUBLESHOOTING.md (FAQ)

#### 5.2 Configuración de Idiomas Existentes
- [ ] Crear `fr.yaml` desde script actual
- [ ] Crear `pt.yaml` desde script actual
- [ ] Ejemplos para DE, IT (templates)

#### 5.3 Ejemplos y Templates
- [ ] Template completo nuevo idioma
- [ ] Checklist de traducción
- [ ] Scripts de validación pre-commit

---

### **Fase 6: Testing y Refinamiento** (3-4 horas)

#### 6.1 Testing End-to-End
- [ ] Agregar idioma ficticio (test)
- [ ] Validar pipeline completo
- [ ] Benchmark performance

#### 6.2 Optimizaciones
- [ ] Caching de traducciones
- [ ] Incremental translations
- [ ] Cost tracking (API calls)

---

## 📈 Comparación: Antes vs Después

| Aspecto | Antes (FR/PT) | Después (Genérico) |
|---------|---------------|-------------------|
| **Scripts** | 2 scripts hardcoded | 1 script configurable |
| **Prompts** | En código Python | YAML externos |
| **Agregar idioma** | Modificar código | Crear 1 YAML |
| **Batch** | Manual | Automático |
| **Validación** | Manual | Automática |
| **Tiempo setup** | ~2-3 horas | ~30 mins |
| **Documentación** | Dispersa | Centralizada |

---

## 🎯 Ejemplo: Agregar Alemán (DE)

### Proceso Actual (hipotético)
1. Duplicar `translate-fr-pt.py` → `translate-de.py`
2. Modificar prompts hardcoded
3. Modificar target languages
4. Testing manual
**Tiempo:** ~3-4 horas

### Proceso Nuevo (estandarizado)
1. Crear branch: `git checkout -b feat/add-german-translation` (2 mins)
2. Crear `config/prompts/de.yaml` (15 mins)
3. Habilitar en `languages.yaml` (1 min)
4. Ejecutar: `python scripts/translate-ui.py --lang de` (30 mins)
5. Ejecutar: `python scripts/translate-docs.py --lang de` (si disponible)
6. Actualizar apps/web configs (4 archivos, 20 mins)
7. Actualizar apps/docs configs (2 archivos, 5 mins)
8. Build & test: `pnpm build` en ambas apps (5 mins)
9. Smoke test: `./scripts/smoke-test.sh de` (2 mins)
10. Validación manual (10 mins)
11. Git commit & PR (5 mins)
**Tiempo:** ~85-90 mins

---

## 🔧 Herramientas y Dependencias

### Python Dependencies
```txt
# requirements.txt
pyyaml>=6.0        # Config loading
requests>=2.31     # HTTP client
click>=8.1         # CLI framework
rich>=13.0         # Pretty console output
jsonschema>=4.0    # JSON validation
```

### API Services
- OpenRouter (actual)
- Alternativas: OpenAI, Anthropic direct, Google Gemini

### Optional Tools
- pre-commit hooks (validación automática)
- GitHub Actions (CI/CD)
- Cost tracking dashboard

---

## ✅ Criterios de Éxito

### Funcionales
- [ ] Agregar nuevo idioma en <1 hora
- [ ] Scripts funcionan sin modificación de código
- [ ] Validación automática 100% cobertura
- [ ] Docs claras para no-técnicos

### No-Funcionales
- [ ] Performance: 100 archivos en <30 mins
- [ ] Cost: <$5 por idioma completo
- [ ] Reliability: 99% success rate
- [ ] Maintainability: Self-documented config

---

## 📊 Estimaciones Totales

| Fase | Descripción | Horas | Status |
|------|-------------|-------|--------|
| 1. Infraestructura | Config system, utils | 4-6h | ⏳ Pendiente |
| 1.5. Environment Vars | .env setup, .gitignore | 0.5h | ✅ Completo |
| 1.6. Apps Integration Docs | Docs integración apps/web + apps/docs | 2-3h | ✅ Completo |
| 2. Scripts UI/API | translate-ui.py genérico | 6-8h | 🔄 Parcial (CLI completo) |
| 3. Scripts Docs | translate-docs.py genérico | 4-6h | ⏳ Pendiente |
| 4. Batch Processing | batch-translate.py + validate.py | 3-4h | ⏳ Pendiente |
| 5. Documentación | Guías completas | 4-5h | ✅ Completo |
| 6. Testing | End-to-end testing | 3-4h | ⏳ Pendiente |
| **TOTAL** | | **27-37h** | **~40% Completo** |

**Retorno de inversión:**
- Actual (manual completo): ~4-5h por idioma
- Con sistema (semi-automatizado): ~1.5h por idioma
- **Ahorro: 70% tiempo por idioma**
- Break-even: Después de 10-12 idiomas
- Ya tenemos 4 (ES, EN, FR, PT) → 6+ idiomas más = ROI positivo

**Tiempo por idioma (con sistema):**
- Traducción automática (scripts): ~30 mins
- Integración manual (configs): ~30 mins
- Testing & validación: ~20 mins
- Git & PR: ~5 mins
- **Total: 85-90 mins por idioma**

---

## 🔮 Roadmap Futuro

### Short-term (3 meses)
- Alemán (DE)
- Italiano (IT)
- Chino simplificado (ZH-CN)

### Mid-term (6 meses)
- Árabe (AR)
- Japonés (JA)
- Coreano (KO)

### Long-term (12 meses)
- 20+ idiomas
- Community translations
- Translation memory
- A/B testing de prompts

---

## 📝 Notas Técnicas

### Consideraciones de Prompts
- **Consistencia:** Usar misma estructura para todos
- **Contexto:** Incluir dominio (educación, exámenes)
- **Ejemplos:** 2-3 ejemplos por idioma
- **Tono:** Formal vs informal según cultura

### Optimizaciones
- Cache traducciones comunes (common.json)
- Incremental updates (solo cambios)
- Parallel processing (asyncio)
- Cost monitoring (track tokens)

### Mantenimiento
- Review prompts cada 6 meses
- Update tech terms según features
- Monitor quality con sampling
- Community feedback loop

---

## 🤔 Preguntas Sin Resolver

1. **¿Usar translation memory?** (Reutilizar traducciones previas)
2. **¿Fallback a EN o ES?** (Si idioma no disponible)
3. **¿Review humano?** (QA process para produccción)
4. **¿Versionado de traducciones?** (Git tags por idioma)
5. **¿Community contributions?** (Pull requests de traducciones)

---

*Plan v1.0 - Diciembre 29, 2025*
