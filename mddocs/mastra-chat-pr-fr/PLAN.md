# Plan: Soporte Multiidioma Chat Mastra (fr, pt)

## Contexto

El chat Mastra para generación de exámenes con IA solo soporta español (es) e inglés (en). La plataforma ya soporta francés (fr) y portugués (pt) en la UI pero el chat no fue actualizado.

## Objetivo

Agregar soporte completo para francés y portugués en:
- Selector de idioma del examen
- Detección automática de idioma
- Prompts de generación de preguntas
- Instrucciones del agente orquestador

## Tipo de Idioma Unificado

```typescript
type SupportedLanguage = 'auto' | 'es' | 'en' | 'fr' | 'pt';
```

---

## Fase 1: Tipos y Componentes UI

### Tarea 1.1: Actualizar AIChatContext.tsx

**Archivo**: `apps/web/app/[locale]/dashboard/exams/ai-exams-creation-chat/components/AIChatContext.tsx`

**Cambios**:
1. Línea 18: Cambiar tipo de `languageOverride`
   - ANTES: `languageOverride: 'auto' | 'es' | 'en';`
   - DESPUES: `languageOverride: 'auto' | 'es' | 'en' | 'fr' | 'pt';`

2. Línea 28: Cambiar tipo en props de `AIChatProvider`
   - ANTES: `languageOverride?: 'auto' | 'es' | 'en';`
   - DESPUES: `languageOverride?: 'auto' | 'es' | 'en' | 'fr' | 'pt';`

### Tarea 1.2: Actualizar page.tsx

**Archivo**: `apps/web/app/[locale]/dashboard/exams/ai-exams-creation-chat/page.tsx`

**Cambios**:
1. Línea 32: Actualizar tipo de estado
   - ANTES: `useState<'auto' | 'es' | 'en'>`
   - DESPUES: `useState<'auto' | 'es' | 'en' | 'fr' | 'pt'>`

2. Líneas 36-38: Actualizar validación de localStorage
   - ANTES: `if (stored === 'es' || stored === 'en' || stored === 'auto')`
   - DESPUES: `if (['auto', 'es', 'en', 'fr', 'pt'].includes(stored as string))`

3. Línea 77: El tipo de `onValueChange` se inferirá del componente actualizado

### Tarea 1.3: Actualizar LanguageSelector.tsx

**Archivo**: `apps/web/app/[locale]/dashboard/exams/ai-exams-creation-chat/components/LanguageSelector.tsx`

**Cambios**:
1. Líneas 20-23: Actualizar interface
```typescript
interface LanguageSelectorProps {
  value: 'auto' | 'es' | 'en' | 'fr' | 'pt';
  onValueChange: (_value: 'auto' | 'es' | 'en' | 'fr' | 'pt') => void;
}
```

2. Líneas 25-29: Reemplazar `languageOptions` completo (sin banderas, labels nativos hardcoded)
```typescript
const languageOptions = [
  { value: 'auto', label: 'Auto' },
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'pt', label: 'Português' },
] as const;
```

3. Actualizar el render del dropdown:
   - Línea 45: Cambiar `fullLabel` por `label`
   - Línea 55: Eliminar el span con emoji `<span className="mr-2">{option.label}</span>`
   - Línea 56: Cambiar `{option.fullLabel}` por `{option.label}`

---

## Fase 2: Traducciones UI

> **NOTA**: Los labels de idiomas están hardcoded en LanguageSelector.tsx (cada uno en su idioma nativo).
> Esta fase solo necesita verificar que las keys existentes `language.label` y `language.tooltip` existan.

### Tarea 2.1: Verificar ai_exams_chat.json (es, en, fr, pt)

**Archivos**:
- `apps/web/i18n/locales/es/ai_exams_chat.json`
- `apps/web/i18n/locales/en/ai_exams_chat.json`
- `apps/web/i18n/locales/fr/ai_exams_chat.json`
- `apps/web/i18n/locales/pt/ai_exams_chat.json`

**Verificar que existan** (ya deberían existir):
- `language.label` - Etiqueta del selector
- `language.tooltip` - Tooltip explicativo

**NO se necesitan keys individuales** para cada idioma ya que los labels están hardcoded.

---

## Fase 3: Detección de Idioma

### Tarea 3.1: Extender language-detection.ts

**Archivo**: `apps/web/lib/ai/utils/language-detection.ts`

**Cambios**:

1. Actualizar tipo de retorno de funciones (líneas 37, 93):
   - ANTES: `'es' | 'en' | null`
   - DESPUES: `'es' | 'en' | 'fr' | 'pt' | null`

2. Agregar keywords de exámenes franceses y portugueses a `EXAM_HINTS` (líneas 14-31):
```typescript
const EXAM_HINTS = {
  en: [...existente...],
  es: [...existente...],
  fr: [
    'baccalauréat', 'bac', 'brevet', 'concours', 'épreuve',
    'devoir surveillé', 'contrôle', 'delf', 'dalf', 'tcf',
    'examen français', 'test de français'
  ],
  pt: [
    'enem', 'vestibular', 'concurso', 'prova', 'simulado',
    'celpe-bras', 'avaliação', 'exame português', 'teste'
  ]
} as const;
```

3. Agregar indicadores de caracteres franceses (después de línea 67):
```typescript
const FRENCH_INDICATORS = ['ç', 'œ', 'æ', 'ê', 'î', 'ô', 'û', 'ë', 'ï', 'ù'] as const;
```

4. Agregar indicadores de caracteres portugueses (después de FRENCH_INDICATORS):
```typescript
const PORTUGUESE_INDICATORS = ['ã', 'õ'] as const;
```

5. Agregar palabras comunes francesas (después de ENGLISH_WORDS):
```typescript
const FRENCH_WORDS = [
  'quoi', 'comment', 'combien', 'générer', 'créer', 'sur',
  'questions', 'examen', 'faire', 'produire',
] as const;
```

6. Agregar palabras comunes portuguesas (después de FRENCH_WORDS):
```typescript
const PORTUGUESE_WORDS = [
  'como', 'quantas', 'gerar', 'criar', 'sobre',
  'questões', 'prova', 'fazer', 'produzir',
] as const;
```

7. Actualizar `detectLanguageFromMessage()` (líneas 44-62):
   - Agregar loops para `EXAM_HINTS.fr` y `EXAM_HINTS.pt`

8. Actualizar `detectMessageLanguage()` (líneas 100-124):
   - Agregar detección de FRENCH_INDICATORS → return 'fr'
   - Agregar detección de PORTUGUESE_INDICATORS → return 'pt'
   - Agregar conteo de FRENCH_WORDS y PORTUGUESE_WORDS
   - Actualizar lógica de comparación para 4 idiomas

---

## Fase 4: Prompts de Generación

### Tarea 4.1: Actualizar buildSystemPrompt en generate-questions-bulk.ts

**Archivo**: `apps/web/lib/ai/mastra/tools/generate-questions-bulk.ts`

**Cambios en función `buildSystemPrompt()` (líneas 230-298)**:

1. Reemplazar la lógica de selección de idioma (líneas 231-240) con un mapa:

```typescript
function buildSystemPrompt(language: string): string {
  const languageConfig: Record<string, {
    name: string;
    examplePrompt: string;
    exampleOptions: string;
    exampleAnswer: string;
    exampleRationale: string;
    exampleTags: string;
  }> = {
    es: {
      name: 'Spanish',
      examplePrompt: '¿Qué es la fotosíntesis?',
      exampleOptions: '["Proceso de respiración", "Proceso de nutrición autótrofa", "Proceso de reproducción", "Proceso de excreción"]',
      exampleAnswer: 'Proceso de nutrición autótrofa',
      exampleRationale: 'La fotosíntesis es el proceso por el cual las plantas producen su propio alimento usando luz solar.',
      exampleTags: '["biología", "plantas", "fotosíntesis"]'
    },
    en: {
      name: 'English',
      examplePrompt: 'What is photosynthesis?',
      exampleOptions: '["Respiration process", "Autotrophic nutrition process", "Reproduction process", "Excretion process"]',
      exampleAnswer: 'Autotrophic nutrition process',
      exampleRationale: 'Photosynthesis is the process by which plants produce their own food using sunlight.',
      exampleTags: '["biology", "plants", "photosynthesis"]'
    },
    fr: {
      name: 'French',
      examplePrompt: "Qu'est-ce que la photosynthèse ?",
      exampleOptions: '["Processus de respiration", "Processus de nutrition autotrophe", "Processus de reproduction", "Processus d\'excrétion"]',
      exampleAnswer: 'Processus de nutrition autotrophe',
      exampleRationale: 'La photosynthèse est le processus par lequel les plantes produisent leur propre nourriture en utilisant la lumière du soleil.',
      exampleTags: '["biologie", "plantes", "photosynthèse"]'
    },
    pt: {
      name: 'Portuguese',
      examplePrompt: 'O que é a fotossíntese?',
      exampleOptions: '["Processo de respiração", "Processo de nutrição autotrófica", "Processo de reprodução", "Processo de excreção"]',
      exampleAnswer: 'Processo de nutrição autotrófica',
      exampleRationale: 'A fotossíntese é o processo pelo qual as plantas produzem seu próprio alimento usando a luz solar.',
      exampleTags: '["biologia", "plantas", "fotossíntese"]'
    }
  };

  const config = languageConfig[language] || languageConfig.en;
  const languageName = config.name;
  // ... resto del prompt usando config.examplePrompt, etc.
}
```

2. Actualizar también `buildChunkPrompt()` (línea 314) para usar el mismo mapa si aplica.

---

## Fase 5: Instrucciones del Agente

### Tarea 5.1: Actualizar chat-orchestrator.ts

**Archivo**: `apps/web/lib/ai/mastra/agents/chat-orchestrator.ts`

**Cambios en `instructions` (líneas 99-456)**:

1. Línea 106 (DEFAULT SETTINGS):
   - ANTES: `- Language: Detected from user's locale (Spanish or English)`
   - DESPUES: `- Language: Detected from user's locale (Spanish, English, French, or Portuguese)`

2. Líneas 386-411 (LANGUAGE AND LOCALE):
   - Línea 395: Actualizar prioridad 2:
     - ANTES: `Keywords like "TOEFL", "IELTS", "SAT" → English; "Selectividad", "EBAU" → Spanish`
     - DESPUES: `Keywords like "TOEFL", "SAT" → English; "Selectividad" → Spanish; "Baccalauréat" → French; "ENEM" → Portuguese`
   
   - Línea 398: Actualizar default:
     - ANTES: `5. **Default** - Spanish (es)`
     - DESPUES: `5. **Default** - UI locale or English (en)`

3. Línea 410:
   - ANTES: `- ALL tools accept \`language\` parameter (ISO 639-1: "es" or "en")`
   - DESPUES: `- ALL tools accept \`language\` parameter (ISO 639-1: "es", "en", "fr", or "pt")`

---

## Fase 6: Validación

### Tarea 6.1: Verificar TypeScript

Ejecutar:
```bash
cd apps/web && pnpm tsc --noEmit
```

Corregir cualquier error de tipos.

### Tarea 6.2: Verificar Build

Ejecutar:
```bash
cd apps/web && pnpm build
```

Corregir cualquier error de build.

---

## Checklist Final

- [ ] Fase 1: Tipos actualizados en 3 archivos
- [ ] Fase 2: Traducciones agregadas en 4 archivos JSON
- [ ] Fase 3: Detección de idioma extendida
- [ ] Fase 4: Prompts de generación actualizados
- [ ] Fase 5: Instrucciones del agente actualizadas
- [ ] Fase 6: Build sin errores

---

## Archivos Modificados (Resumen)

| Archivo | Fase |
|---------|------|
| `components/AIChatContext.tsx` | 1 |
| `page.tsx` | 1 |
| `components/LanguageSelector.tsx` | 1 |
| `i18n/locales/es/ai_exams_chat.json` | 2 |
| `i18n/locales/en/ai_exams_chat.json` | 2 |
| `i18n/locales/fr/ai_exams_chat.json` | 2 |
| `i18n/locales/pt/ai_exams_chat.json` | 2 |
| `lib/ai/utils/language-detection.ts` | 3 |
| `lib/ai/mastra/tools/generate-questions-bulk.ts` | 4 |
| `lib/ai/mastra/agents/chat-orchestrator.ts` | 5 |
