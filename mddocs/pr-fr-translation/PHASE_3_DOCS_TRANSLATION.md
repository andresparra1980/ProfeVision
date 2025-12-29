# Phase 3: Docs Translation Plan (FR/PT)

## Overview
Translate ProfeVision documentation from ES/EN to FR/PT using automated script + manual review.

**Scope**: `apps/docs/content/docs/`
- 52 ES MDX files (base)
- 52 EN MDX files (already translated)
- 10 meta.json files (ES)
- 10 meta.en.json files (EN)
- Total: ~4,710 lines of content

**Goal**: Create 52 FR + 52 PT MDX files + 20 meta JSON files

---

## File Structure Analysis

### Current State
```
apps/docs/content/docs/
├── index.mdx (ES)
├── index.en.mdx (EN)
├── meta.json (ES)
├── meta.en.json (EN)
├── exam-creation/
│   ├── index.mdx (ES)
│   ├── index.en.mdx (EN)
│   ├── ai-chat-creation.mdx (ES)
│   ├── ai-chat-creation.en.mdx (EN)
│   ├── ... (6 more files per locale)
│   ├── meta.json (ES)
│   └── meta.en.json (EN)
├── getting-started/ (7 files × 2 locales)
├── grading/ (6 files × 2 locales)
├── organization-setup/ (5 files × 2 locales)
├── printing/ (4 files × 2 locales)
├── results/ (7 files × 2 locales)
├── settings/ (5 files × 2 locales)
├── subscription/ (5 files × 2 locales)
└── faq/ (6 files × 2 locales)
```

### Target State
```
apps/docs/content/docs/
├── index.mdx (ES)
├── index.en.mdx (EN)
├── index.fr.mdx (FR) ← NEW
├── index.pt.mdx (PT) ← NEW
├── meta.json (ES)
├── meta.en.json (EN)
├── meta.fr.json (FR) ← NEW
├── meta.pt.json (PT) ← NEW
├── exam-creation/
│   ├── index.mdx (ES)
│   ├── index.en.mdx (EN)
│   ├── index.fr.mdx (FR) ← NEW
│   ├── index.pt.mdx (PT) ← NEW
│   └── ... (all files × 4 locales)
└── ... (all sections)
```

---

## Translation Strategy

### Option A: Use EN as source (RECOMMENDED)
**Rationale**: EN translations are already reviewed and high-quality
- Translate EN → FR
- Translate EN → PT
- Faster, cleaner results

### Option B: Use ES as source
**Rationale**: Original language, most accurate
- Translate ES → FR
- Translate ES → PT
- May have better context

**Decision**: Use Option A (EN as source) because:
1. EN docs already exist and are complete
2. Technical terms already translated properly
3. Less chance of errors from AI translation

---

## Implementation Plan

### Step 1: Create Translation Script
**File**: `scripts/translate-docs-fr-pt.py`

**Features**:
- Read all `.en.mdx` files
- Preserve frontmatter (title, description)
- Translate markdown content (headings, paragraphs, lists)
- Preserve code blocks unchanged
- Preserve MDX components (`<Card>`, `<Cards>`, etc.)
- Generate `.fr.mdx` and `.pt.mdx` files
- Translate meta.json files

**API**: Use OpenRouter with `google/gemini-2.0-flash-exp` (fast, cheap, good quality)

**Chunking**: Process by file (most are <500 lines)

### Step 2: Batch Translation Execution

#### 2.1 Translate meta.json files (10 files × 2 locales = 20 files)
Priority: HIGH (needed for navigation)
```bash
python scripts/translate-docs-fr-pt.py --target meta
```

Expected output:
- `meta.fr.json` (10 files)
- `meta.pt.json` (10 files)

#### 2.2 Translate index pages (1 root + 9 sections × 2 locales = 20 files)
Priority: HIGH (landing pages)
```bash
python scripts/translate-docs-fr-pt.py --target index
```

Expected output:
- `index.fr.mdx` (10 files)
- `index.pt.mdx` (10 files)

#### 2.3 Translate remaining content pages (42 files × 2 locales = 84 files)
Priority: MEDIUM (detailed guides)
```bash
python scripts/translate-docs-fr-pt.py --target content
```

Expected output:
- 42 `.fr.mdx` files
- 42 `.pt.mdx` files

### Step 3: Manual Review

#### Priority Review (20 files):
- `index.fr.mdx` (root)
- `index.pt.mdx` (root)
- `getting-started/index.fr.mdx`
- `getting-started/index.pt.mdx`
- All meta.json files (verify navigation labels)

#### Spot Check (10% sample):
- Random 10 FR files
- Random 10 PT files
- Check for:
  - Proper accents (é, à, ç for FR; ã, õ, ç for PT)
  - Technical terms consistency
  - MDX components preserved
  - Code blocks unchanged

### Step 4: Testing

#### 4.1 Build Test
```bash
cd apps/docs
pnpm build
```
Expected: No errors, all routes generated

#### 4.2 Visual Test
```bash
cd apps/docs
pnpm dev
```
Test:
- `/fr` homepage loads
- `/pt` homepage loads
- Language switcher shows all 4 languages
- Navigation menu translated
- Content displays correctly

#### 4.3 Link Verification
- All internal links work (`/docs/getting-started` → `/fr/docs/getting-started`)
- All anchors work (`#section-name`)

---

## Script Specification

### Input Processing
```python
# For each .en.mdx file:
1. Extract frontmatter (---...---)
2. Extract content (markdown + MDX components)
3. Split into translatable chunks:
   - Frontmatter values (title, description)
   - Markdown headings
   - Paragraphs
   - List items
   - Table content
4. Preserve non-translatable:
   - Code blocks (```...```)
   - MDX component syntax (<Card>, <Cards>)
   - URLs and paths
   - Technical IDs
```

### Translation Prompt Template
```
You are translating ProfeVision documentation from English to {target_language}.

Context: ProfeVision is an exam management platform for teachers.

Guidelines:
1. Keep technical terms consistent (e.g., "dashboard" → "tableau de bord" in FR)
2. Preserve markdown formatting (**, -, #, etc.)
3. DO NOT translate:
   - Code blocks
   - Component names (<Card>, <Cards>)
   - File paths (/docs/getting-started)
   - URLs
4. Use formal tone (vous in French, você in Portuguese)
5. Keep the same structure and length

Translate this text to {target_language}:
{content}
```

### Output Format
```mdx
---
title: {translated_title}
description: {translated_description}
---

{translated_content}
```

---

## File Priority Matrix

| Priority | Files | Count | Why |
|----------|-------|-------|-----|
| **P0** | meta.json (root + sections) | 20 | Navigation labels (critical UX) |
| **P1** | index.mdx (root) | 2 | Homepage (first impression) |
| **P2** | index.mdx (sections) | 18 | Section landing pages |
| **P3** | getting-started/*.mdx | 12 | Onboarding (high traffic) |
| **P4** | exam-creation/*.mdx | 10 | Core feature |
| **P5** | grading/*.mdx | 10 | Core feature |
| **P6** | Other sections | 52 | Secondary content |

**Total**: 124 files to create

---

## Cost Estimation

### API Usage (OpenRouter - Gemini 2.0 Flash)
- **Input**: ~4,710 lines × 50 chars/line × 2 locales = ~470K characters = ~120K tokens
- **Output**: ~120K tokens (similar length)
- **Total**: ~240K tokens
- **Cost**: $0.10 per 1M input + $0.40 per 1M output = ~$0.10 total

### Time Estimation
- Script development: 2 hours
- Batch translation: 30 minutes (automated)
- Manual review (P0-P2): 2 hours
- Testing: 1 hour
- **Total**: ~5-6 hours

---

## Success Criteria

### Must Have ✅
- [ ] All 124 files created (52 FR + 52 PT + 20 meta)
- [ ] All meta.json files translated (navigation works)
- [ ] Root index pages translated (homepage loads)
- [ ] Build passes without errors
- [ ] Language switcher shows FR/PT options

### Should Have 🎯
- [ ] All P0-P3 files manually reviewed
- [ ] No placeholder text (e.g., "TODO", "[INSERT]")
- [ ] Consistent technical terms across docs
- [ ] All links work in FR/PT versions

### Nice to Have 💡
- [ ] Human review by native speakers
- [ ] Screenshots localized (future)
- [ ] Video content localized (future)

---

## Rollback Plan

If issues found after deployment:
1. Revert `apps/docs/lib/i18n.ts` to hide FR/PT temporarily:
   ```ts
   languages: ['es', 'en'], // Hide fr, pt
   ```
2. Fix translation issues
3. Re-enable locales

---

## Next Steps

1. **Create script**: `scripts/translate-docs-fr-pt.py`
2. **Dry run**: Test on 1 section first (getting-started)
3. **Review**: Check output quality
4. **Full run**: Process all files
5. **Commit**: Single commit per locale (2 commits total)
6. **Test**: Build + manual QA
7. **Merge**: Merge to main with Phase 3 complete

---

## Questions to Resolve

- [ ] Should we translate code comments in examples? → **No** (keep in English)
- [ ] Should we translate screenshot alt text? → **Yes** (accessibility)
- [ ] Should we translate file paths in examples? → **No** (keep original)
- [ ] Should we localize dates/times in examples? → **Yes** (use locale format)

---

## Notes

- Fumadocs automatically detects `.fr.mdx` and `.pt.mdx` files based on suffix
- No routing changes needed (already configured in `lib/i18n.ts`)
- Language switcher will auto-populate once files exist
- Consider adding `lang="fr"` and `lang="pt"` to HTML tags (SEO)
