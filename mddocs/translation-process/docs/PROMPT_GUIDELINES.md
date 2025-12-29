# Prompt Configuration Guidelines

How to create high-quality language prompt configurations for ProfeVision translations.

---

## Overview

Language prompt configs (`config/prompts/{lang}.yaml`) are the foundation of translation quality. They provide:
- Technical terminology mappings
- Formality guidelines
- Cultural context
- Quality examples
- Common mistake patterns

**Time investment:** 15-20 minutes per language  
**Impact:** Directly affects translation accuracy, consistency, and naturalness

---

## Table of Contents

- [Structure](#structure)
- [Required Sections](#required-sections)
- [Optional Sections](#optional-sections)
- [Best Practices](#best-practices)
- [Language-Specific Tips](#language-specific-tips)
- [Quality Examples](#quality-examples)
- [Testing Your Config](#testing-your-config)

---

## Structure

### Template Location

```bash
config/prompts/_template.yaml  # Base template
config/prompts/de.yaml          # German example
config/prompts/fr.yaml          # French example
```

### File Format

```yaml
# Basic metadata
language: "de"
language_english: "German"
locale_code: "de"

# Translation settings
formality: "formal"
formality_details: "Sie (formal), not du (informal)"

# Terminology
tech_terms: { ... }
ui_terms: { ... }
fumadocs_ui: { ... }

# Guidelines
additional_guidelines: |
  Multi-line text...

# Quality assurance
examples: [ ... ]
quality_checks: [ ... ]
common_mistakes: [ ... ]
```

---

## Required Sections

### 1. Basic Metadata

```yaml
language: "de"              # ISO 639-1 code (2-letter)
language_english: "German"  # English name of language
locale_code: "de"           # Locale code (usually same as language)
```

**Tips:**
- Use standard ISO codes: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
- `locale_code` may differ for regional variants (e.g., `pt-BR` for Brazilian Portuguese)

---

### 2. Formality Settings

```yaml
formality: "formal"  # formal | informal | mixed
formality_details: "Sie (formal), not du (informal)"
```

**Options:**
- **`formal`**: Professional, respectful (e.g., German "Sie", Spanish "usted")
- **`informal`**: Casual, friendly (e.g., German "du", Spanish "tú")
- **`mixed`**: Context-dependent (rare, use with clear guidelines)

**How to decide:**
1. Research target market's educational context
2. Check competitors' tone
3. Consider cultural norms (e.g., German business = formal, English tech = informal)

**Examples:**
```yaml
# German (formal default in business)
formality: "formal"
formality_details: "Always use Sie (formal), never du (informal). Capitalize Sie and related pronouns."

# Spanish (Latin America - varies)
formality: "formal"
formality_details: "Use usted (formal) for teachers addressing system, but tú for casual UI elements"

# English (typically informal in tech)
formality: "informal"
formality_details: "Natural, conversational tone. Use 'you' directly."
```

---

### 3. Technical Terms (`tech_terms`)

**Purpose:** Map educational/platform terminology to target language.

```yaml
tech_terms:
  dashboard: "Dashboard"     # Sometimes kept in English
  exam: "Prüfung"           # German translation
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
  # Add 15-20 core terms
```

**Research sources:**
1. **Academic dictionaries:** University glossaries in target language
2. **Educational software:** Check Google Classroom, Moodle, Canvas in that language
3. **Government sites:** Ministry of Education terminology
4. **Native educators:** Ask teachers in target country

**Common decisions:**
- **English loanwords:** Some terms stay English (e.g., "dashboard", "scan" in many languages)
- **Regional variants:** Brazilian Portuguese ≠ European Portuguese
- **False friends:** "Nota" = "note" (EN) but "grade" (ES)

---

### 4. UI Terms (`ui_terms`)

**Purpose:** Standard UI actions and messages.

```yaml
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
  # Add 15-20 common actions
```

**Tips:**
- Check platform conventions (iOS Human Interface Guidelines, Material Design)
- Consistency with OS: "Save" = "Guardar" (ES) across all Spanish apps
- Verb forms: Infinitive vs imperative varies by language/platform

---

### 5. Fumadocs UI (`fumadocs_ui`)

**Purpose:** Documentation site UI components (apps/docs).

```yaml
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
```

**⚠️ CRITICAL:** These 9 terms are hardcoded in `apps/docs/app/[lang]/layout.tsx`. Must provide exact translations.

---

### 6. Additional Guidelines

```yaml
additional_guidelines: |
  - Use German standard (Hochdeutsch), not regional dialects
  - Capitalize all nouns (German grammar rule)
  - Use compound words appropriately (e.g., Prüfungsergebnis)
  - Academic terminology should be formal
  - Date format: DD.MM.YYYY
  - Number format: 1.234,56 (period for thousands, comma for decimal)
  - Avoid anglicisms where good German alternatives exist
  - Use gender-neutral forms where possible (Student/Studentin → Studierende)
```

**Include:**
- Dialect/standard (e.g., Hochdeutsch, Castilian Spanish, Mandarin)
- Grammar specifics (capitalization, gender, articles)
- Date/number formats
- Cultural considerations
- Character encoding (e.g., Chinese simplified vs traditional)

---

### 7. Examples

**Purpose:** Show AI what high-quality translation looks like.

```yaml
examples:
  - source: "Crear Examen"
    target: "Prüfung erstellen"
    notes: "Use infinitive verb form (German convention)"
    
  - source: "¿Olvidaste tu contraseña?"
    target: "Passwort vergessen?"
    notes: "Question format - keep concise"
    
  - source: "Gestiona y crea exámenes para tus estudiantes"
    target: "Verwalten und erstellen Sie Prüfungen für Ihre Studenten"
    notes: "Formal Sie form, imperative verbs"
    
  - source: "Tienes {count} exámenes pendientes"
    target: "Sie haben {count} ausstehende Prüfungen"
    notes: "Placeholder {count} unchanged, formal address"
    
  - source: "Subir archivo PDF"
    target: "PDF-Datei hochladen"
    notes: "Infinitive, compound word with hyphen"
```

**Guidelines:**
- Provide 5-10 examples
- Cover different text types: actions, questions, descriptions, placeholders
- Show edge cases: plurals, gender, formality
- Explain the "why" in notes

**Where to source:**
- Existing ES → EN translations (if accurate)
- Professional translation samples
- Native speaker review

---

## Optional Sections

### Quality Checks

```yaml
quality_checks:
  - check: "formality"
    description: "Ensure Sie (formal) is used consistently, never du"
    
  - check: "capitalization"
    description: "Verify all nouns are capitalized (German rule)"
    
  - check: "compound_words"
    description: "Check proper compound word formation (Prüfungsergebnis)"
    
  - check: "placeholders"
    description: "Verify {variable} names unchanged"
```

### Common Mistakes

```yaml
common_mistakes:
  - mistake: "Using informal du instead of formal Sie"
    correct: "Always use Sie for addressing teachers"
    
  - mistake: "Translating placeholder variable names ({count} → {anzahl})"
    correct: "Keep ALL placeholder names in English: {count}, {name}, {id}"
    
  - mistake: "Breaking compound words (Prüfung Ergebnis)"
    correct: "Use compound: Prüfungsergebnis"
    
  - mistake: "Lowercase nouns (prüfung)"
    correct: "Capitalize: Prüfung"
```

### Resources

```yaml
resources:
  dictionaries:
    - "https://dict.leo.org (German-English)"
    - "https://www.wordreference.com"
  terminology_databases:
    - "IATE (EU terminology)"
    - "Microsoft Language Portal"
  style_guides:
    - "Duden Rechtschreibung"
    - "Deutsche Sprache - Universität guides"
```

---

## Best Practices

### 1. Research Before Writing

**Minimum research (15 mins):**
- [ ] Check 3 major educational platforms in target language
- [ ] Review government education terminology
- [ ] Find 1-2 university glossaries
- [ ] Identify formal vs informal norms

**Sources:**
- Google Classroom, Moodle in target language
- Ministry of Education websites
- University department pages
- Professional translation databases (IATE, Microsoft)

---

### 2. Be Specific in Guidelines

❌ **Vague:**
```yaml
additional_guidelines: |
  - Use proper German
  - Be formal
```

✅ **Specific:**
```yaml
additional_guidelines: |
  - Use Hochdeutsch (standard German), avoiding Austrian/Swiss variants
  - Use Sie (formal) consistently, capitalize Sie and related pronouns (Ihnen, Ihr)
  - Capitalize all nouns per German orthography: Prüfung, Student, Ergebnis
  - Form compounds: Prüfungsergebnis (not Prüfung Ergebnis)
  - Date: DD.MM.YYYY (e.g., 15.03.2025)
  - Numbers: 1.234,56 (period thousands, comma decimal)
```

---

### 3. Include Context in Examples

❌ **Weak example:**
```yaml
examples:
  - source: "Save"
    target: "Speichern"
```

✅ **Strong example:**
```yaml
examples:
  - source: "Guardar cambios"
    target: "Änderungen speichern"
    notes: "Button label - infinitive form. Object (Änderungen) precedes verb (German word order)"
    context: "Button on exam edit form"
```

---

### 4. Address Ambiguity

For terms with multiple meanings, specify context:

```yaml
tech_terms:
  grade: "Note"  # Academic grade (A, B, C)
  # NOT "Klasse" (grade level/year)
  # NOT "Stufe" (grade/level/tier)
  
  subject: "Fach"  # Academic subject (Math, History)
  # NOT "Thema" (topic/theme)
  # NOT "Gegenstand" (object/subject matter)
```

---

### 5. Consider Regional Variants

**Example: Portuguese**

```yaml
# Brazilian Portuguese (pt-BR)
tech_terms:
  grade: "nota"           # BR: nota
  cell_phone: "celular"   # BR: celular
  
# European Portuguese (pt-PT) would use:
# grade: "nota" (same)
# cell_phone: "telemóvel" (different!)
```

**Decision:** Pick one variant, document it:
```yaml
additional_guidelines: |
  - Use Brazilian Portuguese (pt-BR) standard
  - Preferred over European Portuguese for Latin American market
  - Use "você" (BR informal) not "tu" (PT informal)
```

---

## Language-Specific Tips

### German (de)

**Key considerations:**
- **Noun capitalization:** All nouns uppercase (Prüfung, Student)
- **Compound words:** Prüfungsergebnis (not Prüfung Ergebnis)
- **Formality:** Sie (formal) vs du (informal) - big cultural difference
- **Word order:** Verb-second in main clauses, verb-final in subordinate
- **Gender:** 3 genders affect articles (der/die/das)

**Special attention:**
- Long compound words → ensure readability
- Formal pronouns capitalized: Sie, Ihnen, Ihr

---

### French (fr)

**Key considerations:**
- **Formality:** Vous (formal) vs tu (informal)
- **Gender agreement:** Adjectives match noun gender
- **Accents:** é, è, ê, à, ù, ç (critical for meaning)
- **Elision:** l'examen (not le examen)
- **Canadian vs European:** Decide on variant

**Special attention:**
- False friends: "Actuellement" = currently (not "actually")
- Plurals: -s, -x endings

---

### Spanish (es)

**Key considerations:**
- **Regional variants:** Spain vs Latin America (large differences)
- **Formality:** Tú (informal) vs usted (formal) - varies by region
- **Voseo:** Some LA countries use "vos" (Argentina, Uruguay)
- **Gender agreement:** Masculine/feminine affects articles, adjectives

**Special attention:**
- ProfeVision source = Spain Spanish (Castilian)
- Consider market: Spain, Mexico, Argentina have vocabulary differences

---

### Chinese (zh)

**Key considerations:**
- **Simplified (zh-CN) vs Traditional (zh-TW):** Different markets
- **Formality markers:** 您 (formal you) vs 你 (informal)
- **Measure words:** Required for counting (个, 名, etc.)
- **Character encoding:** UTF-8 required

**Special attention:**
- Text length: Chinese typically 30-50% shorter than English
- No spaces between words
- Punctuation differs (。vs .)

---

### Japanese (ja)

**Key considerations:**
- **Politeness levels:** です/ます (polite) vs だ (casual)
- **Honorifics:** さん, 様 suffixes
- **3 scripts:** Hiragana, Katakana, Kanji
- **Particle system:** が, を, に, で, etc.

**Special attention:**
- Use Katakana for foreign loanwords
- Formal business language for educational context

---

### Arabic (ar)

**Key considerations:**
- **RTL (right-to-left) layout:** Special handling needed
- **Regional dialects:** MSA (Modern Standard Arabic) vs dialects
- **Gender:** Masculine/feminine verb forms
- **Dual number:** Separate from singular/plural

**Special attention:**
- Use MSA for formal educational content
- RTL affects UI layout (separate implementation concern)

---

## Quality Examples

### Example 1: German (High Quality)

```yaml
language: "de"
language_english: "German"
locale_code: "de"

formality: "formal"
formality_details: "Use Sie (formal) consistently. Capitalize Sie, Ihnen, Ihr. Never use du (informal)."

tech_terms:
  dashboard: "Dashboard"  # Keep English (standard in German tech)
  exam: "Prüfung"
  grade: "Note"          # NOT "Klasse" (grade level)
  grading: "Bewertung"
  scan: "Scannen"        # Anglicism accepted
  student: "Student"     # Or "Studierende" (gender-neutral)
  teacher: "Lehrer"      # Or "Lehrkraft" (gender-neutral)
  subject: "Fach"        # NOT "Thema" (topic)
  group: "Gruppe"
  assignment: "Aufgabe"
  result: "Ergebnis"
  score: "Punktzahl"
  question: "Frage"
  answer: "Antwort"
  create: "erstellen"
  edit: "bearbeiten"
  delete: "löschen"

ui_terms:
  login: "Anmelden"
  logout: "Abmelden"
  save: "Speichern"
  cancel: "Abbrechen"
  submit: "Absenden"
  back: "Zurück"
  next: "Weiter"
  finish: "Fertigstellen"

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

additional_guidelines: |
  - Use Hochdeutsch (standard German)
  - Capitalize ALL nouns: Prüfung, Student, Ergebnis
  - Form compound words: Prüfungsergebnis (not Prüfung Ergebnis)
  - Use formal Sie (capitalize Sie, Ihnen, Ihr)
  - Date format: DD.MM.YYYY (15.03.2025)
  - Number format: 1.234,56 (period for thousands, comma for decimal)
  - Gender-neutral preferred: Studierende (not Student/Studentin)
  - Infinitive for buttons: "Speichern" (not "Speichert")

examples:
  - source: "Crear Examen"
    target: "Prüfung erstellen"
    notes: "Infinitive form, object before verb"
    
  - source: "¿Olvidaste tu contraseña?"
    target: "Haben Sie Ihr Passwort vergessen?"
    notes: "Formal Sie, perfect tense question"
    
  - source: "Tienes {count} exámenes pendientes"
    target: "Sie haben {count} ausstehende Prüfungen"
    notes: "Placeholder unchanged, formal Sie, adjective ending -e"
    
  - source: "Gestionar estudiantes"
    target: "Studierende verwalten"
    notes: "Gender-neutral Studierende, infinitive verb"
    
  - source: "Calificación promedio: {average}"
    target: "Durchschnittliche Bewertung: {average}"
    notes: "Compound adjective, placeholder preserved"

common_mistakes:
  - mistake: "Using du (informal)"
    correct: "Always use Sie (formal)"
  - mistake: "Lowercase nouns (prüfung)"
    correct: "Capitalize: Prüfung"
  - mistake: "Translating placeholders ({count} → {anzahl})"
    correct: "Keep placeholders: {count}"
  - mistake: "Spaces in compounds (Prüfung Ergebnis)"
    correct: "No spaces: Prüfungsergebnis"
```

---

## Testing Your Config

### 1. Dry Run Translation

```bash
# Test with one file
python scripts/translate-ui.py --lang de --dry-run

# Check output for quality
```

### 2. Translate Sample File

```bash
# Translate just common.json
python scripts/translate-ui.py --lang de

# Review output
cat apps/web/i18n/locales/de/common.json
```

### 3. Validate

```bash
# Check structure
python scripts/validate.py --lang de --verbose

# Look for:
# - Missing placeholders
# - Untranslated strings
# - Structure mismatches
```

### 4. Manual Review Checklist

- [ ] Formality consistent?
- [ ] Technical terms translated correctly?
- [ ] Placeholders preserved ({{count}}, {name})?
- [ ] Natural phrasing (not literal translation)?
- [ ] Grammar correct (gender, articles, conjugation)?
- [ ] Cultural appropriateness?

### 5. Iterate

```bash
# Update prompt config based on issues
vim config/prompts/de.yaml

# Re-translate
python scripts/translate-ui.py --lang de --force

# Validate again
python scripts/validate.py --lang de --verbose
```

---

## Checklist for New Language

Before running translations:

- [ ] Research completed (educational terminology, formality norms)
- [ ] `tech_terms` has 15-20 core terms
- [ ] `ui_terms` has 15-20 common actions
- [ ] `fumadocs_ui` has all 9 required terms
- [ ] `formality` and `formality_details` specified
- [ ] `additional_guidelines` covers grammar, formatting, cultural context
- [ ] 5-10 `examples` with notes explaining choices
- [ ] `common_mistakes` addresses likely errors
- [ ] Reviewed by native speaker (if possible)

---

## Summary

**Time investment:** 15-20 mins to create config  
**ROI:** Dramatically improves translation quality, reduces manual fixes

**Key principles:**
1. **Be specific:** Vague guidelines = inconsistent translations
2. **Show examples:** AI learns better from examples than rules
3. **Address ambiguity:** One term, multiple meanings → specify context
4. **Cultural sensitivity:** Formality, gender, regional variants matter
5. **Test iteratively:** Translate → validate → fix config → repeat

**Result:** High-quality, consistent translations that require minimal manual review.

---

*Last updated: December 29, 2025*
