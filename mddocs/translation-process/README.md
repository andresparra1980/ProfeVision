# Translation Process - ProfeVision

Sistema estandarizado de traducción para cualquier idioma basado en prompts configurables e inyección dinámica.

**Status:** ✅ Sistema Completo | 📚 Docs Completas | 🧪 Listo para Testing  
**Versión:** 2.1  
**Fecha:** Diciembre 29, 2025

---

## 📚 Documentación

### Para Empezar
- **[SUMMARY.md](./SUMMARY.md)** - Resumen ejecutivo y visión general
- **[PLAN.md](./PLAN.md)** - Plan detallado de implementación
- **[docs/README.md](./docs/README.md)** - Guía de usuario completa

### Guías Prácticas
- **[docs/ADDING_LANGUAGE.md](./docs/ADDING_LANGUAGE.md)** - Guía completa (9 pasos, 85-90 mins)
- **[docs/VALIDATION_CHECKLIST.md](./docs/VALIDATION_CHECKLIST.md)** - Checklist detallado de validación
- **[UNRESOLVED_QUESTIONS.md](./UNRESOLVED_QUESTIONS.md)** - 12 preguntas para decisión

### Referencias Adicionales
- **[docs/PROMPT_GUIDELINES.md](./docs/PROMPT_GUIDELINES.md)** - Cómo diseñar prompts efectivos
- **[docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)** - Solución de problemas comunes

---

## 🎯 Quick Start

### Agregar Nuevo Idioma (Ejemplo: Alemán)

**Tiempo estimado: 85-90 minutos**

```bash
# 0. Git Branch (2 mins)
git checkout -b feat/add-german-translation

# 1. Crear config de prompt (15 mins)
cp config/prompts/_template.yaml config/prompts/de.yaml
# Editar de.yaml con términos técnicos (incluir fumadocs_ui)

# 2. Habilitar en languages.yaml (1 min)
# Cambiar enabled: true para 'de'

# 3. Ejecutar traducción (30 mins)
# Opción A: UI + Docs por separado
python scripts/translate-ui.py --lang de
python scripts/translate-docs.py --lang de

# Opción B: Todo junto con validación
python scripts/batch-translate.py --lang de --validate

# 4. Integración apps/web (20 mins)
# - apps/web/i18n/config.ts (2 líneas)
# - apps/web/i18n/routing.ts (~60 pathnames)
# - apps/web/i18n/route-constants.ts (~28 mappings)
# - apps/web/middleware.ts (2 líneas)

# 5. Integración apps/docs (5 mins)
# - apps/docs/lib/i18n.ts (1 línea)
# - apps/docs/app/[lang]/layout.tsx (11 líneas)

# 6. Build & Test (5 mins)
cd ../../apps/web && pnpm build
cd ../docs && pnpm build

# 7. Smoke Test (2 mins)
cd ../../mddocs/translation-process
./scripts/smoke-test.sh de

# 8. Manual Testing (10 mins)
# Verificar en localhost:3000/de y localhost:3001/de/docs

# 9. Git Commit & PR (5 mins)
git add .
git commit -m "feat: add German (de) translation"
git push origin feat/add-german-translation
```

Ver [docs/ADDING_LANGUAGE.md](./docs/ADDING_LANGUAGE.md) para guía detallada completa.

---

## 📁 Estructura del Proyecto

```
translation-process/
├── config/                          # Configuraciones
│   ├── languages.yaml               # Config central de idiomas
│   └── prompts/
│       ├── ui-translations.md       # Template prompt UI/API
│       ├── docs-translations.md     # Template prompt Docs
│       ├── _template.yaml           # Template nuevo idioma
│       ├── fr.yaml                  # Config Francés
│       └── pt.yaml                  # Config Portugués
│
├── scripts/                         # Scripts de traducción
│   ├── translate-ui.py              # ✅ UI/API translations (completo)
│   ├── translate-docs.py            # ✅ Docs translations (completo)
│   ├── validate.py                  # ✅ Validación completa (completo)
│   ├── batch-translate.py           # ✅ Batch processing (completo)
│   └── smoke-test.sh                # ✅ Smoke test automatizado
│
├── docs/                            # Documentación
│   ├── README.md                    # Overview sistema
│   ├── ADDING_LANGUAGE.md           # ✅ Guía completa (9 pasos)
│   ├── VALIDATION_CHECKLIST.md      # ✅ Checklist validación
│   ├── PROMPT_GUIDELINES.md         # ✅ Guía diseño prompts
│   └── TROUBLESHOOTING.md           # ✅ Solución problemas
│
├── .env.example                     # ✅ Template environment vars
├── .gitignore                       # ✅ Ignorar .env.local
├── PLAN.md                          # ✅ Plan detallado (actualizado)
├── SUMMARY.md                       # ✅ Resumen ejecutivo (actualizado)
├── UNRESOLVED_QUESTIONS.md          # ✅ 12 preguntas decisión
└── README.md                        # Este archivo
```

**Leyenda:**
- ✅ Completado
- 🚧 TODO (planificado)

---

## 🚀 Características

### Actual (FR/PT)
- Prompts hardcoded en scripts Python
- 2 scripts separados por idioma
- Config dispersa
- ~3-4 horas por idioma

### Nuevo Sistema
- ✅ **Prompts configurables** - YAML externos, fáciles de editar
- ✅ **Scripts genéricos** - Un script para todos los idiomas
- ✅ **Config centralizada** - languages.yaml + prompts/
- ✅ **Reducción 75% tiempo** - <1 hora por idioma
- ✅ **Validación automática** - Estructura + claves + placeholders
- ✅ **Docs completas** - Guías paso a paso

---

## 📊 Idiomas

### Activos
- 🇪🇸 Español (es) - Source
- 🇬🇧 English (en) - Complete
- 🇫🇷 Français (fr) - Complete
- 🇧🇷 Português (pt) - Complete

### Planificados
- 🇩🇪 Deutsch (de) - Q1 2026
- 🇮🇹 Italiano (it) - Q1 2026
- 🇨🇳 简体中文 (zh) - Q2 2026
- 🇯🇵 日本語 (ja) - Q2 2026
- 🇸🇦 العربية (ar) - Q3 2026
- 🇰🇷 한국어 (ko) - Q3 2026
- 🇷🇺 Русский (ru) - Q4 2026
- 🇮🇳 हिन्दी (hi) - Q4 2026

Ver `config/languages.yaml` para lista completa.

---

## 🔧 Configuración

### Variables de Entorno

```bash
# Requerido
export OPENROUTER_API_KEY="sk-or-v1-..."

# Opcional
export TRANSLATION_MODEL="google/gemini-3-flash-preview"
export TRANSLATION_TEMPERATURE="0.3"
```

### Dependencias

```bash
# Python 3.9+
pip install pyyaml requests click rich jsonschema
```

---

## 📋 Casos de Uso

### 1. Traducir Todos los Idiomas Habilitados
```bash
python scripts/translate-ui.py
```

### 2. Traducir Solo Francés
```bash
python scripts/translate-ui.py --lang fr
```

### 3. Traducir Múltiples Idiomas
```bash
python scripts/translate-ui.py --lang fr,pt,de
```

### 4. Preview (Dry Run)
```bash
python scripts/translate-ui.py --lang de --dry-run
```

### 5. Forzar Re-traducción
```bash
python scripts/translate-ui.py --lang fr --force
```

---

## 📈 Métricas

### Performance
- **Traducción automática:** ~30 mins (UI/API + Docs)
- **Integración manual:** ~30 mins (6 archivos config)
- **Testing & validación:** ~20 mins
- **Git & PR:** ~5 mins
- **Total por idioma:** ~85-90 mins (~1.5 horas)

### Costos (Estimado)
- **UI/API:** ~$1.50 por idioma
- **Docs:** ~$2.00 por idioma
- **Total:** ~$3.50 por idioma completo
- **Budget recomendado:** $50-100 inicial + $10-20/mes

### ROI
- **Tiempo anterior (manual):** 4-5 horas/idioma
- **Tiempo nuevo (semi-auto):** 1.5 horas/idioma
- **Ahorro:** 70% reducción tiempo
- **Break-even:** Después de 10-12 idiomas
- **Ya tenemos:** 4 idiomas (ES, EN, FR, PT)
- **ROI positivo:** A partir del 6º idioma nuevo

---

## 🛠️ Estado de Implementación

### ✅ Completado
- [x] Script `translate-ui.py` - Traducción UI/API JSON files
- [x] Script `translate-docs.py` - Traducción MDX documentation
- [x] Script `validate.py` - Validación estructura + placeholders + completeness
- [x] Script `batch-translate.py` - Procesamiento batch múltiples idiomas
- [x] Script `smoke-test.sh` - Validación automatizada 14 checks
- [x] Docs: `ADDING_LANGUAGE.md` - Guía completa 9 pasos
- [x] Docs: `VALIDATION_CHECKLIST.md` - Checklist detallado
- [x] Docs: `PROMPT_GUIDELINES.md` - Guía diseño prompts
- [x] Docs: `TROUBLESHOOTING.md` - Solución problemas
- [x] Config system: `languages.yaml` + `prompts/*.yaml`
- [x] Prompt templates: `ui-translations.md`, `docs-translations.md`

### 🚧 Pendiente (Testing & Refinamiento)
- [ ] Testing end-to-end con idioma nuevo (DE)
- [ ] Ajustes basados en feedback real
- [ ] Performance optimization si necesario

### 🔮 Futuras Mejoras (Opcional)
- [ ] Translation memory para reutilizar traducciones
- [ ] Incremental updates (solo archivos modificados)
- [ ] GitHub Actions CI/CD integration
- [ ] Visual diff tool para reviewers
- [ ] Utils module refactor (si scripts se vuelven muy largos)

---

## 🤝 Contribuir

### Agregar Nuevo Idioma

1. Fork repo
2. Crear `config/prompts/{lang}.yaml`
3. Habilitar en `config/languages.yaml`
4. Ejecutar scripts de traducción
5. Validar output
6. Submit PR

Ver [docs/ADDING_LANGUAGE.md](./docs/ADDING_LANGUAGE.md) para guía completa.

### Mejorar Prompts Existentes

1. Editar `config/prompts/{lang}.yaml`
2. Modificar `tech_terms`, `additional_guidelines`, o `examples`
3. Re-traducir: `python scripts/translate-ui.py --lang {lang} --force`
4. Validar mejoras
5. Submit PR con ejemplos before/after

---

## 📞 Soporte

- **Documentación:** Ver `/docs/`
- **Guías:** `ADDING_LANGUAGE.md`, `PLAN.md`, `SUMMARY.md`
- **GitHub Issues:** Para reportar bugs o solicitar features

---

## 📝 Changelog

### v2.1 (Dic 29, 2025) - Framework Completo
- ✅ **Scripts completados:**
  - `translate-docs.py` - MDX documentation translations (460 líneas)
  - `validate.py` - Comprehensive validation (530 líneas)
  - `batch-translate.py` - Batch processing orchestration (280 líneas)
- ✅ **Docs completadas:**
  - `PROMPT_GUIDELINES.md` - Guía diseño prompts (480 líneas)
  - `TROUBLESHOOTING.md` - Guía solución problemas (420 líneas)
- ✅ **Sistema listo para testing end-to-end**
- ✅ **100% framework implementado** (scripts + docs)

### v2.0 (Dic 29, 2025) - Integración Apps Completa
- ✅ **Environment Setup:** `.env.example`, `.gitignore`
- ✅ **Prompts actualizados:** FR/PT con sección `fumadocs_ui`
- ✅ **Template actualizado:** `_template.yaml` con fumadocs_ui
- ✅ **Smoke test:** `scripts/smoke-test.sh` (14 validaciones)
- ✅ **Docs actualizada:** `ADDING_LANGUAGE.md` (9 pasos, 85-90 mins)
  - Git branch strategy
  - Integración apps/web (4 archivos)
  - Integración apps/docs (2 archivos)
  - Build & testing
  - Manual validation
- ✅ **Checklist:** `VALIDATION_CHECKLIST.md` completo
- ✅ **Preguntas:** `UNRESOLVED_QUESTIONS.md` (12 preguntas)
- ✅ **Plan actualizado:** Fases 1.5 y 1.6 agregadas
- ✅ **Métricas actualizadas:** 70% reducción tiempo (1.5h vs 4-5h)

### v1.0 (Dic 29, 2025) - Diseño Inicial
- ✅ Plan completo diseñado
- ✅ Estructura de directorios creada
- ✅ Config system diseñado (YAML)
- ✅ Prompts FR/PT documentados
- ✅ Template nuevo idioma
- ✅ Script `translate-ui.py` implementado
- ✅ Docs básicas: README, ADDING_LANGUAGE, PLAN, SUMMARY

---

## 📜 Licencia

MIT License - Ver LICENSE file del proyecto principal

---

## 🙏 Agradecimientos

Basado en la experiencia de traducción FR/PT completada en Diciembre 2025.

Scripts originales:
- `scripts/translate-fr-pt.py`
- `scripts/translate-docs-fr-pt.py`

---

*v2.0 - Última actualización: Diciembre 29, 2025*
