# Translation Process - Troubleshooting Guide

Common issues and solutions for ProfeVision translation system.

---

## Table of Contents

- [Script Errors](#script-errors)
- [API Issues](#api-issues)
- [Translation Quality Issues](#translation-quality-issues)
- [Build Errors](#build-errors)
- [Validation Errors](#validation-errors)
- [File System Issues](#file-system-issues)
- [Configuration Issues](#configuration-issues)

---

## Script Errors

### Error: `OPENROUTER_API_KEY not set`

**Symptom:**
```
❌ Error: OPENROUTER_API_KEY not set. Export it or pass to constructor.
```

**Cause:** API key not configured in environment.

**Solution:**
```bash
# Option 1: Environment variable
export OPENROUTER_API_KEY="sk-or-v1-..."

# Option 2: .env.local file (recommended)
cd mddocs/translation-process
echo "OPENROUTER_API_KEY=sk-or-v1-..." > .env.local

# Verify it's set
python -c "import os; print(os.environ.get('OPENROUTER_API_KEY', 'NOT SET'))"
```

**Prevention:** Always use `.env.local` file and add to `.gitignore`.

---

### Error: `PyYAML not installed`

**Symptom:**
```
❌ Error: PyYAML not installed. Run: pip install pyyaml
```

**Cause:** Missing Python dependency.

**Solution:**
```bash
# Install PyYAML
pip install pyyaml

# Or install all dependencies (if requirements.txt exists)
pip install -r requirements.txt
```

---

### Error: `Prompt config not found for {lang}`

**Symptom:**
```
❌ Prompt config not found for de: .../config/prompts/de.yaml
Create it using config/prompts/_template.yaml as reference.
```

**Cause:** Language prompt configuration file missing.

**Solution:**
```bash
# Copy template
cd mddocs/translation-process/config/prompts
cp _template.yaml de.yaml

# Edit de.yaml with German-specific terms
# See: docs/ADDING_LANGUAGE.md Step 1
```

---

### Error: `Languages config not found`

**Symptom:**
```
❌ Languages config not found: .../config/languages.yaml
```

**Cause:** Running script from wrong directory or config file moved.

**Solution:**
```bash
# Always run scripts from mddocs/translation-process/
cd mddocs/translation-process

# Verify config exists
ls -la config/languages.yaml

# Run script
python scripts/translate-ui.py --lang de
```

---

## API Issues

### Error: `API error: Rate limit exceeded`

**Symptom:**
```
❌ API error: Rate limit exceeded
```

**Cause:** Too many requests to OpenRouter API in short time.

**Solution:**
```bash
# Wait 1-2 minutes, then retry
sleep 120
python scripts/translate-ui.py --lang de

# Or reduce concurrency (manual throttling)
# Edit script rate_limit_delay from 0.5 to 1.0 seconds
```

**Prevention:** 
- Built-in rate limiting: 0.5s delay between requests
- Translate one language at a time
- Don't run multiple scripts simultaneously

---

### Error: `API error: Invalid API key`

**Symptom:**
```
❌ API error: Invalid API key
```

**Cause:** API key is expired, revoked, or incorrect.

**Solution:**
```bash
# 1. Get new API key from https://openrouter.ai/keys
# 2. Update .env.local
echo "OPENROUTER_API_KEY=sk-or-v1-NEW_KEY_HERE" > .env.local

# 3. Verify
cat .env.local
```

---

### Error: `Curl error` or `Timeout`

**Symptom:**
```
❌ Curl error: timeout after 120s
```

**Cause:** Network issues or API server slow.

**Solution:**
```bash
# Check internet connection
ping -c 3 openrouter.ai

# Retry with increased timeout (if needed, edit script)
# Default timeout: 120s in translate-ui.py line ~176

# If persistent, check OpenRouter status:
# https://status.openrouter.ai
```

---

## Translation Quality Issues

### Issue: Translations are identical to source

**Symptom:**
Translated file has same text as Spanish source.

**Cause:**
1. API returned source text unchanged
2. Prompt not clear enough
3. Model misunderstood task

**Solution:**
```bash
# 1. Check prompt config has proper terms
cat config/prompts/de.yaml | grep "tech_terms"

# 2. Re-translate with --force flag
python scripts/translate-ui.py --lang de --force

# 3. Validate
python scripts/validate.py --lang de --verbose
```

**Prevention:**
- Add quality examples in prompt config
- Review `additional_guidelines` section
- Use specific formality settings

---

### Issue: Placeholders broken (e.g., `{{count}}` → `{{anzahl}}`)

**Symptom:**
```
❌ Missing placeholders at path: {count}
  Source: "You have {count} exams"
  Translation: "Sie haben {anzahl} Prüfungen"
```

**Cause:** AI translated placeholder variable names.

**Solution:**
```bash
# 1. Check validation output
python scripts/validate.py --lang de --verbose

# 2. Manual fix in JSON file
# Find and replace: {anzahl} → {count}

# 3. Re-translate with better prompt
# Edit config/prompts/de.yaml:
additional_guidelines: |
  - NEVER translate placeholder variable names like {count}, {{name}}
  - Keep ALL text inside curly braces unchanged
  - Example: {count} stays as {count}, NOT {anzahl}

# 4. Re-translate
python scripts/translate-ui.py --lang de --force
```

**Prevention:**
- Emphasize placeholder preservation in prompt config
- Add examples showing unchanged placeholders
- Run validation immediately after translation

---

### Issue: HTML entities converted (e.g., `&nbsp;` → space)

**Symptom:**
```
⚠️  Missing HTML entities at path: &nbsp;
  Source: "Text&nbsp;with&nbsp;non-breaking&nbsp;spaces"
```

**Cause:** AI converted HTML entities to characters.

**Solution:**
```bash
# Run validation
python scripts/validate.py --lang de --verbose

# Manual fix: Replace spaces with &nbsp; where needed

# Or re-translate with stricter prompt
```

---

## Build Errors

### Error: TypeScript error in `routing.ts`

**Symptom:**
```
Type error: Type '"de"' is not assignable to type '"es" | "en" | "fr" | "pt"'
```

**Cause:** Added language to some files but not others.

**Solution:**
```bash
# Check all 4 files updated:
grep -n "de" apps/web/i18n/config.ts          # Should appear
grep -n "de" apps/web/i18n/routing.ts         # Should appear in ALL routes
grep -n "de" apps/web/i18n/route-constants.ts # Should appear
grep -n "de" apps/web/middleware.ts           # Should appear (line ~26, ~235)

# Count routes per language (should be equal)
grep -c "es:" apps/web/i18n/routing.ts
grep -c "de:" apps/web/i18n/routing.ts  # Must match

# Fix missing entries
# See: docs/ADDING_LANGUAGE.md Step 4
```

---

### Error: Build fails with "Missing translations"

**Symptom:**
```
Error: Missing translation file: apps/web/i18n/locales/de/common.json
```

**Cause:** Translation files not created or wrong location.

**Solution:**
```bash
# Check files exist
ls -la apps/web/i18n/locales/de/
ls -la apps/web/i18n/api/locales/de/

# Re-run translation
cd mddocs/translation-process
python scripts/translate-ui.py --lang de

# Verify files created
ls -la ../../apps/web/i18n/locales/de/*.json | wc -l
# Should show ~18 files
```

---

### Error: Next.js build fails on docs site

**Symptom:**
```
Error: Missing locale in i18n config
```

**Cause:** Forgot to update `apps/docs/lib/i18n.ts`.

**Solution:**
```bash
# Check apps/docs configs
grep "de" apps/docs/lib/i18n.ts              # Should appear
grep "de" apps/docs/app/[lang]/layout.tsx    # Should appear

# Fix according to:
# docs/ADDING_LANGUAGE.md Step 5
```

---

## Validation Errors

### Error: `Missing keys at path`

**Symptom:**
```
❌ Missing keys at path: exams.create.title
```

**Cause:** Translation has incomplete structure.

**Solution:**
```bash
# 1. Identify missing keys
python scripts/validate.py --lang de --verbose

# 2. Compare source vs translation
cat apps/web/i18n/locales/es/exams.json | jq '.create'
cat apps/web/i18n/locales/de/exams.json | jq '.create'

# 3. Re-translate the file
python scripts/translate-ui.py --lang de --force

# Or manually add missing keys
```

---

### Warning: `Possibly untranslated`

**Symptom:**
```
⚠️  Possibly untranslated at path: "Crear Examen"
```

**Cause:** Translation is identical to source (suspicious).

**Action:**
```bash
# Check if it's a brand name (OK to be identical)
# If not, re-translate with --force

# Review in verbose mode
python scripts/validate.py --lang de --verbose | grep "untranslated"

# Decide: False positive or real issue?
```

---

## File System Issues

### Error: `Permission denied` when writing files

**Symptom:**
```
❌ Permission denied: apps/web/i18n/locales/de/common.json
```

**Cause:** Insufficient file permissions.

**Solution:**
```bash
# Check permissions
ls -la apps/web/i18n/locales/de/

# Fix permissions
chmod 644 apps/web/i18n/locales/de/*.json

# Or recreate directory
rm -rf apps/web/i18n/locales/de/
mkdir -p apps/web/i18n/locales/de/
python scripts/translate-ui.py --lang de
```

---

### Error: `File not found` even though it exists

**Symptom:**
```
❌ File not found: apps/web/i18n/locales/de/common.json
```
But `ls` shows it exists.

**Cause:** Running script from wrong directory.

**Solution:**
```bash
# Always run from mddocs/translation-process/
pwd
# Should show: .../ProfeVision/mddocs/translation-process

# If not:
cd /path/to/ProfeVision/mddocs/translation-process

# Then run script
python scripts/translate-ui.py --lang de
```

---

## Configuration Issues

### Error: Language not being processed

**Symptom:**
Script runs but skips language silently.

**Cause:** Language not enabled in `config/languages.yaml`.

**Solution:**
```bash
# Check language config
cat config/languages.yaml | grep -A 7 "de:"

# Ensure enabled: true
# Edit config/languages.yaml:
de:
  enabled: true  # ← Must be true
  ...
```

---

### Error: Formality issues in translation

**Symptom:**
Translations use informal tone when formal expected (or vice versa).

**Cause:** Wrong formality setting in prompt config.

**Solution:**
```bash
# Edit config/prompts/de.yaml
formality: "formal"  # formal | informal | mixed
formality_details: "Sie (formal), not du (informal)"

# Re-translate
python scripts/translate-ui.py --lang de --force
```

---

## Debugging Tips

### Enable Verbose Output

```bash
# For validation
python scripts/validate.py --lang de --verbose

# For dry-run preview
python scripts/translate-ui.py --lang de --dry-run
```

### Check API Response

```bash
# Test API manually
export OPENROUTER_API_KEY="sk-or-v1-..."

curl -X POST https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "google/gemini-3-flash-preview",
    "messages": [{"role": "user", "content": "Translate 'Hello' to German"}]
  }'
```

### Inspect Generated Files

```bash
# View first 20 lines of translated file
head -20 apps/web/i18n/locales/de/common.json

# Compare source and translation side-by-side
diff <(jq -S . apps/web/i18n/locales/es/common.json) \
     <(jq -S . apps/web/i18n/locales/de/common.json)

# Validate JSON syntax
python -m json.tool apps/web/i18n/locales/de/common.json > /dev/null
echo $?  # Should be 0 if valid
```

### Check Smoke Test

```bash
# Run comprehensive smoke test
cd mddocs/translation-process
./scripts/smoke-test.sh de --verbose

# Check specific file
./scripts/smoke-test.sh de --verbose | grep "common.json"
```

---

## Getting Help

### Before Reporting an Issue

1. ✅ Run validation: `python scripts/validate.py --lang {lang} --verbose`
2. ✅ Check smoke test: `./scripts/smoke-test.sh {lang} --verbose`
3. ✅ Review logs for error messages
4. ✅ Verify configs: `config/languages.yaml` and `config/prompts/{lang}.yaml`
5. ✅ Check this troubleshooting guide

### What to Include in Bug Report

```
Language: de
Script: translate-ui.py
Command: python scripts/translate-ui.py --lang de
Error message: [paste full error]
Config: [attach config/prompts/de.yaml]
Environment:
  - Python version: 3.11
  - OS: Ubuntu 22.04
  - OpenRouter model: gemini-3-flash-preview
```

### Common Issues Checklist

- [ ] API key configured correctly
- [ ] Running from correct directory (`mddocs/translation-process/`)
- [ ] Language enabled in `config/languages.yaml`
- [ ] Prompt config exists: `config/prompts/{lang}.yaml`
- [ ] PyYAML installed
- [ ] Internet connection working
- [ ] Target directories exist: `apps/web/i18n/locales/{lang}/`

---

## Emergency Recovery

### Start Fresh (Nuclear Option)

```bash
# Delete all generated files for a language
rm -rf apps/web/i18n/locales/de/
rm -rf apps/web/i18n/api/locales/de/
rm -f apps/docs/content/docs/**/*.de.mdx
rm -f config/prompts/de.yaml

# Recreate from scratch
# Follow: docs/ADDING_LANGUAGE.md from Step 1
```

### Restore from Backup

```bash
# If you have git commits
git checkout HEAD -- apps/web/i18n/locales/de/

# If you have manual backups
cp -r backups/de-2025-12-29/ apps/web/i18n/locales/de/
```

---

*Last updated: December 29, 2025*
