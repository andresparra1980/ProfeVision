# Documentation Translation Prompt Template

You are translating ProfeVision documentation from **{{SOURCE_LANG}}** to **{{TARGET_LANG}}** ({{TARGET_LANG_NAME}}).

## Context
ProfeVision is an exam management platform for teachers. The documentation helps teachers:
- Learn how to use the platform
- Understand features and workflows
- Troubleshoot common issues
- Follow best practices

## Task
Translate the following documentation content while preserving technical accuracy and clarity.

## Translation Guidelines

### 1. Tone and Style
- Use **{{FORMALITY}}** tone: {{FORMALITY_DETAILS}}
- Maintain clear, instructional language
- Be concise but thorough
- Write for non-technical educators

### 2. Technical Terminology
Use these standardized translations:
{{TECH_TERMS}}

### 3. Preserve Markdown Structure
- Keep all markdown formatting:
  - Headers: `#`, `##`, `###`
  - Bold: `**text**`
  - Italic: `*text*`
  - Lists: `-`, `*`, `1.`
  - Links: `[text](url)`
  - Images: `![alt](url)`
  - Code: `` `code` ``
  - Tables: `| col | col |`

### 4. DO NOT Translate
- **Code blocks:** Everything between ``` markers
- **Component names:** `<Card>`, `<Steps>`, `<Callout>`, etc.
- **File paths:** `/docs/getting-started`, `src/components/`
- **URLs:** `https://...`, `/dashboard/...`
- **HTML attributes:** `className`, `href`, `src`, etc.
- **Function names:** `createExam()`, `getResults()`
- **Variable names:** `examId`, `student_name`
- **API endpoints:** `/api/exams`, `/api/grades`
- **Environment variables:** `NEXT_PUBLIC_API_URL`
- **Command-line commands:** `npm install`, `pnpm dev`
- **Brand names:** ProfeVision, Supabase, Next.js

### 5. Frontmatter (YAML)
Translate only these fields in the YAML frontmatter:
- `title:` - Main page title
- `description:` - Page description

DO NOT translate:
- `icon:` - Icon names
- `---` - Frontmatter delimiters

Example:
```yaml
---
title: Getting Started      # TRANSLATE THIS
description: Quick guide    # TRANSLATE THIS
icon: rocket               # DO NOT TRANSLATE
---
```

### 6. Special Elements

**Callouts/Admonitions:**
Translate the content, but keep the component structure:
```
<Callout type="info">
  Translated content here
</Callout>
```

**Code blocks with language:**
Do not translate code or language identifier:
```typescript
// Code stays in English
const exam = createExam()
```

**Inline code:**
Keep variable names, but translate explanatory text around them:
- Original: "Use `examId` para identificar el examen"
- Target: "Use `examId` to identify the exam"

### 7. Links
- Keep relative links unchanged: `/docs/exam-creation`
- Translate link text: `[Crear Examen](/docs/exam-creation)` → `[Create Exam](/docs/exam-creation)`

### 8. Language-Specific Formatting
{{ADDITIONAL_GUIDELINES}}

## Quality Checks
- [ ] All headings translated
- [ ] All paragraphs translated
- [ ] Code blocks unchanged
- [ ] Component syntax unchanged
- [ ] Links functional
- [ ] Frontmatter partially translated (title/description only)
- [ ] Natural, fluent language

## Examples
{{EXAMPLES}}

## Content to Translate

{{CONTENT}}

---

**Important:** Return the complete translated document with all markdown formatting intact. Do not add comments or explanations outside the document content.
