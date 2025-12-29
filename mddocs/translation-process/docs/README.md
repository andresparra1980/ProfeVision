# Translation Process - ProfeVision

Sistema estandarizado de traducción para cualquier idioma basado en prompts configurables e inyección dinámica.

---

## 🎯 Objetivo

Permitir agregar nuevos idiomas a ProfeVision (UI, API, Docs) en **menos de 1 hora** mediante:
- Scripts genéricos reutilizables
- Prompts configurables por idioma (YAML)
- Validación automática
- Batch processing

---

## 📁 Estructura

```
translation-process/
├── config/
│   ├── languages.yaml              # Config de idiomas disponibles
│   ├── models.yaml                 # Config de modelos IA
│   └── prompts/
│       ├── ui-translations.md      # Template prompt UI/API
│       ├── docs-translations.md    # Template prompt Docs
│       ├── fr.yaml                 # Prompt FR
│       ├── pt.yaml                 # Prompt PT
│       └── {lang}.yaml             # Template nuevo idioma
├── scripts/
│   ├── translate-ui.py             # Traducir UI/API JSON
│   ├── translate-docs.py           # Traducir Docs MDX
│   ├── validate.py                 # Validar traducciones
│   ├── batch-translate.py          # Batch múltiples idiomas
│   └── utils/                      # Utilidades
└── docs/
    ├── README.md                   # Este archivo
    ├── ADDING_LANGUAGE.md          # Guía agregar idioma
    ├── PROMPT_GUIDELINES.md        # Guidelines prompts
    └── TROUBLESHOOTING.md          # FAQ
```

---

## 🚀 Quick Start

### 1. Traducir UI/API para idioma existente

```bash
# Traducir todos los idiomas habilitados
python scripts/translate-ui.py

# Traducir solo Francés
python scripts/translate-ui.py --lang fr

# Traducir Francés y Portugués
python scripts/translate-ui.py --lang fr,pt
```

### 2. Traducir Documentación

```bash
# Traducir docs para todos los idiomas
python scripts/translate-docs.py

# Solo Francés
python scripts/translate-docs.py --lang fr
```

### 3. Validar Traducciones

```bash
# Validar todos los idiomas
python scripts/validate.py

# Validar solo Francés
python scripts/validate.py --lang fr

# Output detallado
python scripts/validate.py --verbose
```

### 4. Batch (UI + Docs + Validación)

```bash
# Traducir todo para un idioma
python scripts/batch-translate.py --lang fr

# Dry run (preview sin escribir)
python scripts/batch-translate.py --lang fr --dry-run
```

---

## 📚 Guías

### Para Usuarios

1. **[Agregar Nuevo Idioma](./ADDING_LANGUAGE.md)**  
   Step-by-step para agregar Alemán, Italiano, etc.

2. **[Guidelines de Prompts](./PROMPT_GUIDELINES.md)**  
   Cómo diseñar prompts efectivos por idioma

3. **[Troubleshooting](./TROUBLESHOOTING.md)**  
   Solución de problemas comunes

### Para Desarrolladores

- Ver código en `scripts/` con docstrings
- Arquitectura en `PLAN.md`
- Config schemas en `config/`

---

## 🔧 Configuración

### Variables de Entorno

```bash
# Requerido
export OPENROUTER_API_KEY="sk-or-v1-..."

# Opcional
export TRANSLATION_MODEL="google/gemini-3-flash-preview"
export TRANSLATION_TEMPERATURE="0.3"
export TRANSLATION_MAX_TOKENS="4096"
```

### Config de Idiomas

Editar `config/languages.yaml`:

```yaml
languages:
  de:  # Nuevo idioma
    name: "Deutsch"
    locale_code: "de"
    enabled: true    # Habilitar para traducción
    priority: 3
```

---

## 📊 Estadísticas

### Idiomas Actuales

| Idioma | Code | Status | Files |
|--------|------|--------|-------|
| Español | es | ✅ Source | - |
| English | en | ✅ Complete | 80 |
| Français | fr | ✅ Complete | 80 |
| Português | pt | ✅ Complete | 80 |

### Performance

- **UI/API:** ~18 archivos × 2 idiomas = 36 archivos en ~15 mins
- **Docs:** ~30 archivos × 2 idiomas = 60 archivos en ~20 mins
- **Validación:** ~80 archivos en <2 mins
- **Total:** Nuevo idioma completo en ~40 mins

### Costos (Estimado)

- UI/API: ~$1.50 por idioma
- Docs: ~$2.00 por idioma
- **Total:** ~$3.50 por idioma completo

---

## 🏗️ Arquitectura

### Flujo de Traducción

```
1. Config Load
   languages.yaml → Idiomas habilitados
   
2. Prompt Building
   Template (MD) + Config (YAML) → Prompt final
   
3. Translation
   Source JSON/MDX → OpenRouter API → Target JSON/MDX
   
4. Validation
   Estructura + Claves + Placeholders → Pass/Fail
   
5. Output
   Guardar en apps/web/i18n/locales/{lang}/
```

### Componentes

**Config Loader**
- Lee YAML configs
- Valida schemas
- Merge defaults

**Prompt Builder**
- Templates en Markdown
- Variable injection
- Lang-specific overrides

**Translator**
- OpenRouter wrapper
- Rate limiting
- Retry logic
- Error handling

**Validator**
- JSON structure
- Key completeness
- Placeholder preservation
- HTML entity preservation

---

## 🎨 Características

### ✅ Implementado

- [x] Scripts genéricos UI/API
- [x] Scripts genéricos Docs
- [x] Config YAML por idioma
- [x] Templates de prompts
- [x] Validación automática
- [x] Batch processing
- [x] CLI con flags

### 🚧 En Progreso

- [ ] Translation memory
- [ ] Incremental updates
- [ ] Cost tracking dashboard
- [ ] GitHub Actions integration

### 🔮 Futuro

- [ ] Community translations
- [ ] A/B testing de prompts
- [ ] Auto-detect missing keys
- [ ] Visual diff tool

---

## 🤝 Contribuir

### Agregar Nuevo Idioma

1. Fork repo
2. Crear `config/prompts/{lang}.yaml`
3. Habilitar en `config/languages.yaml`
4. Ejecutar scripts
5. Validar output
6. Submit PR

### Mejorar Prompts

1. Editar `config/prompts/{lang}.yaml`
2. Re-traducir: `python scripts/translate-ui.py --lang {lang} --force`
3. Validar: `python scripts/validate.py --lang {lang}`
4. Submit PR con ejemplos de mejora

---

## 📞 Soporte

### Issues Comunes

Ver [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### Contacto

- GitHub Issues: [profevision/issues](https://github.com/your-org/profevision/issues)
- Docs: [profevision.com/docs](https://profevision.com/docs)

---

## 📜 Licencia

MIT License - Ver LICENSE file

---

## 📝 Changelog

### v1.0 (Dic 2025)
- Initial release
- Soporte FR/PT
- Scripts genéricos
- Docs completas

---

*Última actualización: Diciembre 29, 2025*
