# Phase 2: Translation Execution Guide - FR/PT Translation

**Status:** Ready to Execute  
**Created:** December 28, 2025  
**Estimated Duration:** 30-45 minutes (with API key)

---

## 📋 What's Been Done

✅ **Phase 1 Complete:**
- Infrastructure setup (routing, config, middleware)
- FR/PT directories created
- Translation script ready at: `scripts/translate-fr-pt.py`

✅ **Pre-Phase 2 Tasks Completed:**
- Created: `apps/web/i18n/locales/fr/` (empty)
- Created: `apps/web/i18n/locales/pt/` (empty)
- Created: `apps/web/i18n/api/locales/fr/` (empty)
- Created: `apps/web/i18n/api/locales/pt/` (empty)
- Created: `scripts/translate-fr-pt.py` (ready to run)

---

## 🚀 How to Execute Phase 2

### Step 1: Get Your Anthropic API Key

You need an `ANTHROPIC_API_KEY` to run translations.

1. Go to: https://console.anthropic.com/
2. Create/Get your API key
3. Copy it to clipboard

### Step 2: Run the Translation Script

```bash
# From project root directory
cd /home/ucaretaker/Documents/Code/ProfeVision

# Set your API key as environment variable
export ANTHROPIC_API_KEY="sk-ant-xxxxxxxxxxxxxxxxxxxx"

# Run the translation script
python3 scripts/translate-fr-pt.py
```

### Expected Output

```
🌍 ProfeVision Translation Script
⏰ 2025-12-28 12:13:27

Creating target language directories...
  ✅ FR directories ready
  ✅ PT directories ready

============================================================
Processing UI/Dashboard Translation Files
============================================================
Found 25 Spanish files to translate

📄 admin.json
  📝 Translating to FR... ✅
  📝 Translating to PT... ✅
📄 ai_exams_chat.json
  📝 Translating to FR... ✅
  📝 Translating to PT... ✅
... (continues for all 25 files)

============================================================
Processing API Responses Translation Files
============================================================
Found 21 Spanish files to translate

📄 entities.json
  📝 Translating to FR... ✅
  📝 Translating to PT... ✅
... (continues for all 21 files)

============================================================
Translation Summary
============================================================
UI Files:    25/25 successful
API Files:   21/21 successful
Total:       46/46 successful
============================================================

✅ All translations completed successfully!
```

**Time Estimate:** 5-8 minutes (46 files × ~10 seconds per API call)

---

## 📊 Files to be Translated

### UI/Dashboard Files (25 files)
Located in: `apps/web/i18n/locales/es/`

1. admin.json
2. ai_exams_chat.json
3. auth.json
4. blog.json
5. common.json (LARGEST - 54KB)
6. cookie-banner.json
7. dashboard.json (LARGE - 64KB)
8. document-capture.json
9. errors.json
10. exam.json
11. feature-slideshow.json
12. floating-action-button.json
13. forms.json
14. jobs-similar-exam.json
15. mobile-app.json
16. navigation.json
17. not-found.json
18. onboarding.json
19. scan-wizard.json
20. tiers.json
21. wizard-step-confirmation.json
22. wizard-step-image-capture.json
23. wizard-step-instructions.json
24. wizard-step-processing.json
25. wizard-step-results.json

### API Response Files (21 files)
Located in: `apps/web/i18n/api/locales/es/`

1. entities.json
2. exams.base.json
3. exams.check-duplicate.json
4. exams.cleanup-temp.json
5. exams.details.json
6. exams.id.edit-name.json
7. exams.id.json
8. exams.id.manual-grade.json
9. exams.id.questions.json
10. exams.id.update-answer.json
11. exams.id.update-correct-answer.json
12. exams.process-scan.json
13. exams.save-results.json
14. exams.sync-grades.json
15. groups.by-materia.id.json
16. groups.id.grading-scheme.json
17. groups.id.json
18. opciones-respuesta.correct.json
19. qr.translate.json
20. students.id.json
21. uploads.json

---

## ✅ Post-Translation Steps

After running the script successfully, verify:

### 1. File Structure Validation

```bash
# Check that all directories have files
ls apps/web/i18n/locales/fr/ | wc -l      # Should be 25
ls apps/web/i18n/locales/pt/ | wc -l      # Should be 25
ls apps/web/i18n/api/locales/fr/ | wc -l  # Should be 21
ls apps/web/i18n/api/locales/pt/ | wc -l  # Should be 21
```

### 2. JSON Validation

```bash
# Verify all JSON files are valid
for file in apps/web/i18n/locales/fr/*.json; do
  if ! jq . "$file" > /dev/null 2>&1; then
    echo "❌ Invalid JSON: $file"
  fi
done

for file in apps/web/i18n/locales/pt/*.json; do
  if ! jq . "$file" > /dev/null 2>&1; then
    echo "❌ Invalid JSON: $file"
  fi
done

for file in apps/web/i18n/api/locales/fr/*.json; do
  if ! jq . "$file" > /dev/null 2>&1; then
    echo "❌ Invalid JSON: $file"
  fi
done

for file in apps/web/i18n/api/locales/pt/*.json; do
  if ! jq . "$file" > /dev/null 2>&1; then
    echo "❌ Invalid JSON: $file"
  fi
done

echo "✅ All JSON files are valid"
```

### 3. Type Checking

```bash
# Verify TypeScript compilation
pnpm typecheck

# You should see no errors
```

### 4. Local Testing

```bash
# Start dev server
pnpm dev

# In browser, visit:
# - http://localhost:3000/fr/dashboard (French)
# - http://localhost:3000/pt/dashboard (Portuguese)
# - Check language switcher shows 4 options (ES, EN, FR, PT)
# - Click FR/PT to test navigation works
```

---

## 🔧 Troubleshooting

### Issue: "ANTHROPIC_API_KEY not set"

**Solution:**
```bash
# Make sure you export it before running
export ANTHROPIC_API_KEY="your-key-here"
python3 scripts/translate-fr-pt.py
```

### Issue: "Rate limit exceeded"

**Cause:** API making too many requests too fast  
**Solution:** Script includes delays, but if you hit limits:
- Wait 60 seconds
- Run script again (it will skip already-translated files)

### Issue: "JSON validation failed"

**Cause:** Claude returned invalid JSON  
**Solution:**
- Check the translation output manually in that file
- Edit the JSON to be valid
- The script will validate structure on next run

### Issue: Some files failed

**Solution:**
- Run the script again with same API key
- It will skip successfully translated files
- Only retry failed ones

---

## 📝 What the Script Does

The `scripts/translate-fr-pt.py` script:

1. **Discovers** all Spanish JSON files in:
   - `apps/web/i18n/locales/es/`
   - `apps/web/i18n/api/locales/es/`

2. **For each file:**
   - Reads Spanish JSON content
   - Calls Claude API with translation prompt
   - Validates JSON structure is preserved
   - Saves translated file to:
     - `apps/web/i18n/locales/fr/` (French UI)
     - `apps/web/i18n/locales/pt/` (Portuguese UI)
     - `apps/web/i18n/api/locales/fr/` (French API)
     - `apps/web/i18n/api/locales/pt/` (Portuguese API)

3. **Validates:**
   - Each translated JSON parses correctly
   - Structure matches Spanish original (no missing keys)
   - All placeholder variables preserved

4. **Reports:**
   - Success/failure for each file
   - Summary of total successes
   - Clear error messages if issues

---

## 🎯 Next Steps After Phase 2

### Phase 3: Documentation Translation
- Translate `/apps/docs/content/docs/` MDX files
- Separate task: needs manual review

### Phase 4: Validation
- Test all FR/PT routes
- Verify language switching works
- Check all translations display correctly

### Phase 5: Deployment
- Create pull request with all changes
- Deploy to production

---

## ⏱️ Timeline

- **Phase 2 Execution:** 5-8 minutes (script run)
- **Phase 2 Validation:** 5-10 minutes (verification)
- **Phase 3-5:** Remaining work TBD

---

## 📞 Questions?

If the script fails:
1. Check error message in output
2. Verify API key is correct
3. Ensure network connection is stable
4. Check JSON syntax of source files

**Key Points:**
- Script is idempotent (safe to run multiple times)
- Creates backup of nothing (modifies nothing until success)
- Validates everything before saving
- Clear error reporting

---

*Ready to translate ProfeVision to French & Portuguese!* 🚀
