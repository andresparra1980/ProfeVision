# Documento de Tareas: Migración AI Chat a MastraAI

**Versión**: 1.0
**Fecha**: 2025-11-16
**Branch**: `feature/ai-chat-mastra`
**Referencia**: [Plan de Alto Nivel](./PLAN_ALTO_NIVEL.md)

---

## Índice de Fases

- [Fase 0: Setup y Preparación](#fase-0-setup-y-preparación)
- [Fase 1: Implementación Core](#fase-1-implementación-core)
- [Fase 2: Frontend Adaptation](#fase-2-frontend-adaptation)
- [Fase 3: Testing y Refinamiento](#fase-3-testing-y-refinamiento)
- [Fase 4: Rollout y Monitoreo](#fase-4-rollout-y-monitoreo)
- [Fase 5: Deprecation y Cleanup](#fase-5-deprecation-y-cleanup)

---

## Fase 0: Setup y Preparación

**Duración Estimada**: 1 semana
**Estado**: ✅ En Progreso

### Tarea 0.1: Crear Feature Branch

**Estado**: ✅ Completado

**Descripción**: Crear y cambiar a feature branch para desarrollo aislado

**Pasos**:
```bash
git checkout -b feature/ai-chat-mastra
git push -u origin feature/ai-chat-mastra
```

**Criterios de Aceptación**:
- [x] Branch creado localmente
- [x] Branch pusheado a origin
- [x] Working directory limpio

---

### Tarea 0.2: Análisis de Sistema Actual

**Estado**: ✅ Completado

**Descripción**: Documentar implementación actual del chat AI

**Archivos Analizados**:
- `app/api/chat/route.ts`
- `lib/ai/chat/prompts.ts`
- `lib/ai/chat/schemas.ts`
- `lib/ai/chat/json-parser.ts`
- `lib/ai/chat/openrouter.ts`
- `lib/ai/chat/langsmith.ts`
- Componentes frontend en `app/[locale]/dashboard/exams/ai-exams-creation-chat/`

**Criterios de Aceptación**:
- [x] Flujo de datos documentado
- [x] Arquitectura actual entendida
- [x] Limitaciones identificadas
- [x] Componentes reutilizables identificados

---

### Tarea 0.3: Investigación de MastraAI

**Estado**: ✅ Completado

**Descripción**: Investigar arquitectura, APIs, y mejores prácticas de Mastra

**Investigación Realizada**:
- Documentación oficial de Mastra
- Integración con AI SDK V5
- Soporte de OpenRouter
- Arquitectura de agentes y tools
- Validadores y schemas
- Streaming y feedback

**Criterios de Aceptación**:
- [x] Entendimiento de Agent API
- [x] Entendimiento de Tools API
- [x] Entendimiento de streaming
- [x] Ejemplos de código revisados

---

### Tarea 0.4: Crear Documentos de Planificación

**Estado**: ✅ Completado

**Descripción**: Crear Plan de Alto Nivel y Documento de Tareas

**Archivos Creados**:
- `mddocs/ai_chat_mastra/PLAN_ALTO_NIVEL.md`
- `mddocs/ai_chat_mastra/TASKS_BY_PHASE.md`

**Criterios de Aceptación**:
- [x] Plan de alto nivel completo
- [x] Tareas detalladas por fase
- [x] Cronograma estimado
- [x] Riesgos identificados

---

### Tarea 0.5: Setup de Dependencias

**Estado**: ✅ Completado

**Descripción**: Instalar y configurar dependencias de Mastra

**Pasos**:
```bash
# Instalar dependencias core
npm install @mastra/core@latest

# Instalar provider de OpenRouter
npm install @openrouter/ai-sdk-provider@latest

# Verificar compatibilidad
npm list @mastra/core @openrouter/ai-sdk-provider
```

**Archivos a Modificar**:
- `package.json`
- `package-lock.json` (auto)

**Criterios de Aceptación**:
- [x] `@mastra/core` instalado (v0.24.1)
- [x] `@openrouter/ai-sdk-provider` instalado (v1.2.3)
- [x] No hay conflictos de dependencias
- [x] `yarn build` exitoso

**Tiempo Estimado**: 30 minutos

---

### Tarea 0.6: Configurar Variables de Entorno

**Estado**: ✅ Completado

**Descripción**: Adicionar variable de feature flag

**Archivos a Modificar**:
- `.env.local` (local)
- `.env.example` (documentación)
- Vercel dashboard (producción)

**Cambios**:
```bash
# .env.example
AI_CHAT_MASTRA=false  # Feature flag para nuevo chat
```

**Criterios de Aceptación**:
- [x] Variable `AI_CHAT_MASTRA` agregada a `.env.example`
- [x] Variable configurada en `.env.local` (false por defecto)
- [x] Documentación incluida en `.env.example`

**Tiempo Estimado**: 15 minutos

---

### Tarea 0.7: Crear Estructura de Carpetas

**Estado**: ✅ Completado

**Descripción**: Crear estructura de archivos para implementación Mastra

**Estructura a Crear**:
```
lib/ai/mastra/
├── agents/
│   └── chat-orchestrator.ts
├── tools/
│   ├── plan-exam-generation.ts
│   ├── generate-questions-bulk.ts
│   ├── validate-organize-exam.ts
│   ├── randomize-options.ts
│   ├── regenerate-question.ts
│   ├── add-questions.ts
│   └── index.ts
├── schemas/
│   ├── exam-plan.ts
│   ├── question-spec.ts
│   └── index.ts
├── utils/
│   ├── chunk-questions.ts
│   ├── fisher-yates.ts
│   └── index.ts
├── mastra.config.ts
└── index.ts

app/api/chat-mastra/
└── route.ts
```

**Pasos**:
```bash
mkdir -p lib/ai/mastra/{agents,tools,schemas,utils}
mkdir -p app/api/chat-mastra
touch lib/ai/mastra/agents/chat-orchestrator.ts
touch lib/ai/mastra/tools/{plan-exam-generation,generate-questions-bulk,validate-organize-exam,randomize-options,regenerate-question,add-questions,index}.ts
touch lib/ai/mastra/schemas/{exam-plan,question-spec,index}.ts
touch lib/ai/mastra/utils/{chunk-questions,fisher-yates,index}.ts
touch lib/ai/mastra/{mastra.config,index}.ts
touch app/api/chat-mastra/route.ts
```

**Criterios de Aceptación**:
- [x] Estructura de carpetas creada
- [x] Archivos placeholder creados con TODOs
- [x] Exports en index.ts configurados (placeholder)

**Tiempo Estimado**: 15 minutos

---

## Fase 1: Implementación Core

**Duración Estimada**: 2-3 semanas
**Estado**: ✅ Completado (12/13 tareas, 1 omitida)

### Tarea 1.1: Implementar Schemas Zod

**Estado**: ⏳ Pendiente

**Descripción**: Crear schemas de validación para tools

**Archivo**: `lib/ai/mastra/schemas/exam-plan.ts`

**Código**:
```typescript
import { z } from "zod";

export const QuestionSpecSchema = z.object({
  id: z.string().regex(/^q\d+$/), // q1, q2, etc.
  topic: z.string().min(3).max(200),
  examplePrompt: z.string().min(10).max(500),
  type: z.enum(["multiple_choice", "true_false", "short_answer", "essay"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  taxonomyLevel: z.enum([
    "remember",
    "understand",
    "apply",
    "analyze",
    "evaluate",
    "create",
  ]).optional(),
});

export const ExamPlanSchema = z.object({
  totalQuestions: z.number().int().min(1).max(50),
  questionSpecs: z.array(QuestionSpecSchema),
  estimatedGenerationTime: z.number().optional(), // segundos
  metadata: z.object({
    topics: z.array(z.string()),
    difficultyDistribution: z.record(z.number()).optional(),
    taxonomyDistribution: z.record(z.number()).optional(),
  }).optional(),
});

export type QuestionSpec = z.infer<typeof QuestionSpecSchema>;
export type ExamPlan = z.infer<typeof ExamPlanSchema>;
```

**Archivo**: `lib/ai/mastra/schemas/question-spec.ts`

**Código**: Reutilizar schemas existentes de `lib/ai/chat/schemas.ts`

```typescript
// Re-exportar schemas existentes para compatibilidad
export {
  ExamQuestionSchema,
  ExamSchema,
  type ExamQuestion,
  type Exam,
} from "@/lib/ai/chat/schemas";
```

**Criterios de Aceptación**:
- [ ] `ExamPlanSchema` creado y exportado
- [ ] `QuestionSpecSchema` creado y exportado
- [ ] Tipos TypeScript inferidos
- [ ] Schemas reutilizados de código existente
- [ ] Validación manual exitosa (unit tests)

**Tiempo Estimado**: 2 horas

---

### Tarea 1.2: Implementar Utilidades

**Estado**: ⏳ Pendiente

**Descripción**: Crear funciones utilitarias para tools

**Archivo**: `lib/ai/mastra/utils/chunk-questions.ts`

**Código**:
```typescript
import type { QuestionSpec } from "../schemas";

/**
 * Divide un array de question specs en chunks para generación paralela
 * @param specs - Array de especificaciones de preguntas
 * @param chunkSize - Tamaño de cada chunk (default: 3)
 * @returns Array de chunks
 */
export function chunkQuestionSpecs(
  specs: QuestionSpec[],
  chunkSize: number = 3
): QuestionSpec[][] {
  const chunks: QuestionSpec[][] = [];

  for (let i = 0; i < specs.length; i += chunkSize) {
    chunks.push(specs.slice(i, i + chunkSize));
  }

  return chunks;
}

/**
 * Calcula el tamaño óptimo de chunk basado en total de preguntas
 * Heurística: 3-5 preguntas por chunk, preferir chunks uniformes
 */
export function calculateOptimalChunkSize(totalQuestions: number): number {
  if (totalQuestions <= 5) return totalQuestions;
  if (totalQuestions <= 10) return 3;
  if (totalQuestions <= 20) return 4;
  return 5;
}
```

**Archivo**: `lib/ai/mastra/utils/fisher-yates.ts`

**Código**:
```typescript
/**
 * Implementación de Fisher-Yates shuffle para aleatorizar opciones
 * @param array - Array a aleatorizar
 * @param seed - Seed opcional para reproducibilidad
 * @returns Nuevo array aleatorizado
 */
export function fisherYatesShuffle<T>(array: T[], seed?: number): T[] {
  const shuffled = [...array];
  let rng = seed ? seedRandom(seed) : Math.random;

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Simple seeded random number generator (LCG)
 */
function seedRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 2**32;
    return state / 2**32;
  };
}
```

**Criterios de Aceptación**:
- [ ] `chunkQuestionSpecs` implementado y testeado
- [ ] `calculateOptimalChunkSize` implementado
- [ ] `fisherYatesShuffle` implementado y testeado
- [ ] Unit tests pasando
- [ ] TypeScript sin errores

**Tiempo Estimado**: 3 horas

---

### Tarea 1.3: Implementar Tool - Plan Exam Generation

**Estado**: ✅ Completado

**Descripción**: Crear tool para generar plan de examen

**Consideraciones i18n:**
- Usar `locale` del contexto (ISO 639-1: 'es', 'en')
- Aclarar en prompt: "Idioma: Español (ISO 639-1: 'es')"
- Prompt bilingüe según locale detectado

**Archivo**: `lib/ai/mastra/tools/plan-exam-generation.ts`

**Código**:
```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { ExamPlanSchema, type ExamPlan } from "../schemas";

const inputSchema = z.object({
  numQuestions: z.number().int().min(1).max(50),
  topics: z.array(z.string()).min(1),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]),
  questionTypes: z.array(z.string()).min(1),
  taxonomyLevels: z.array(z.string()).optional(),
  language: z.enum(["es", "en"]).default("es"),
  documentSummaries: z.array(z.any()).optional(), // TopicSummary[]
});

export const planExamGenerationTool = createTool({
  id: "plan-exam-generation",
  description: "Crea un plan detallado de preguntas a generar basado en los requerimientos",
  inputSchema,
  outputSchema: ExamPlanSchema,

  execute: async ({ context }) => {
    const {
      numQuestions,
      topics,
      difficulty,
      questionTypes,
      taxonomyLevels,
      language,
      documentSummaries,
    } = context;

    // Construir prompt para generar plan
    const prompt = buildPlanPrompt({
      numQuestions,
      topics,
      difficulty,
      questionTypes,
      taxonomyLevels,
      language,
      documentSummaries,
    });

    // Llamar a LLM para generar plan
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const model = openrouter(
      process.env.OPENAI_FALLBACK_MODEL || "mistralai/ministral-8b"
    );

    const response = await model.invoke([
      { role: "system", content: "Eres un experto en diseño curricular." },
      { role: "user", content: prompt },
    ]);

    // Parsear respuesta
    const plan = JSON.parse(response.content);

    // Validar con schema
    const validatedPlan = ExamPlanSchema.parse(plan);

    return validatedPlan;
  },
});

function buildPlanPrompt(params: any): string {
  // Implementar lógica de construcción de prompt
  // Similar a buildUserInstruction actual pero enfocado en plan
  return `
    Genera un plan detallado para un examen con las siguientes características:

    - Número de preguntas: ${params.numQuestions}
    - Temas: ${params.topics.join(", ")}
    - Dificultad: ${params.difficulty}
    - Tipos de pregunta: ${params.questionTypes.join(", ")}
    ${params.taxonomyLevels ? `- Niveles de taxonomía: ${params.taxonomyLevels.join(", ")}` : ""}

    Para cada pregunta en el plan, especifica:
    - id (q1, q2, etc.)
    - topic (tema específico)
    - examplePrompt (ejemplo de pregunta, no la pregunta final)
    - type (tipo de pregunta)
    - difficulty (dificultad específica)
    - taxonomyLevel (nivel de Bloom)

    Devuelve JSON en este formato:
    {
      "totalQuestions": 10,
      "questionSpecs": [
        {
          "id": "q1",
          "topic": "Fotosíntesis - Definición",
          "examplePrompt": "¿Qué es la fotosíntesis?",
          "type": "multiple_choice",
          "difficulty": "easy",
          "taxonomyLevel": "remember"
        },
        ...
      ]
    }
  `;
}
```

**Criterios de Aceptación**:
- [ ] Tool creado con inputSchema y outputSchema
- [ ] Función execute implementada
- [ ] Llamada a LLM funcional
- [ ] Validación de output con Zod
- [ ] Manejo de errores robusto
- [ ] Test manual exitoso

**Tiempo Estimado**: 6 horas

---

### Tarea 1.4: Implementar Tool - Generate Questions In Bulk

**Estado**: ✅ Completado

**Descripción**: Crear tool para generar preguntas en chunks paralelos

**Consideraciones i18n:**
- Usar `locale` del contexto para generar preguntas
- Tags generados deben estar en el idioma del examen
- Ejemplo ES: tags: ["fotosíntesis", "biología"]
- Ejemplo EN: tags: ["photosynthesis", "biology"]

**Archivo**: `lib/ai/mastra/tools/generate-questions-bulk.ts`

**Código**:
```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { ExamQuestionSchema, type ExamQuestion } from "../schemas";
import { QuestionSpecSchema } from "../schemas/exam-plan";
import { chunkQuestionSpecs, calculateOptimalChunkSize } from "../utils";
import { buildSystemPrompt, buildUserInstruction } from "@/lib/ai/chat/prompts";

const inputSchema = z.object({
  questionSpecs: z.array(QuestionSpecSchema),
  context: z.object({
    documentSummaries: z.array(z.any()).optional(),
    language: z.enum(["es", "en"]).default("es"),
  }).optional(),
  chunkSize: z.number().int().min(1).max(10).optional(),
  onProgress: z.function().optional(), // (current: number, total: number) => void
});

const outputSchema = z.object({
  questions: z.array(ExamQuestionSchema),
});

export const generateQuestionsInBulkTool = createTool({
  id: "generate-questions-bulk",
  description: "Genera preguntas en chunks paralelos basado en especificaciones",
  inputSchema,
  outputSchema,

  execute: async ({ context }) => {
    const {
      questionSpecs,
      context: genContext,
      chunkSize,
      onProgress,
    } = context;

    const optimalChunkSize = chunkSize || calculateOptimalChunkSize(questionSpecs.length);
    const chunks = chunkQuestionSpecs(questionSpecs, optimalChunkSize);

    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const model = openrouter(
      process.env.OPENAI_MODEL || "google/gemini-2.5-flash-lite"
    );

    const allQuestions: ExamQuestion[] = [];
    let processed = 0;

    // Generar chunks en paralelo (con Promise.all)
    const chunkPromises = chunks.map(async (chunk, chunkIndex) => {
      try {
        // Construir prompt para este chunk
        const systemPrompt = buildSystemPrompt(genContext?.language || "es");
        const userPrompt = buildChunkPrompt(chunk, genContext);

        // Llamar a LLM
        const response = await model.invoke([
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ]);

        // Parsear respuesta
        const parsed = JSON.parse(response.content);
        const questions = parsed.questions || parsed;

        // Validar cada pregunta
        const validatedQuestions = questions.map((q: any) =>
          ExamQuestionSchema.parse(q)
        );

        // Reportar progreso
        processed += chunk.length;
        onProgress?.(processed, questionSpecs.length);

        return validatedQuestions;
      } catch (error) {
        // Log error pero no bloquear otros chunks
        console.error(`Error generating chunk ${chunkIndex}:`, error);

        // Retry individual (opcional)
        // ...

        return []; // Retornar vacío en caso de error
      }
    });

    // Esperar todos los chunks
    const chunkResults = await Promise.all(chunkPromises);

    // Aplanar resultados
    for (const questions of chunkResults) {
      allQuestions.push(...questions);
    }

    return { questions: allQuestions };
  },
});

function buildChunkPrompt(specs: QuestionSpec[], context: any): string {
  // Construir prompt para generar preguntas específicas
  return `
    Genera exactamente ${specs.length} preguntas basadas en las siguientes especificaciones:

    ${specs.map((spec, i) => `
    Pregunta ${i + 1}:
    - ID: ${spec.id}
    - Tema: ${spec.topic}
    - Ejemplo: ${spec.examplePrompt}
    - Tipo: ${spec.type}
    - Dificultad: ${spec.difficulty}
    - Taxonomía: ${spec.taxonomyLevel || "N/A"}
    `).join("\n")}

    Devuelve JSON con array "questions", cada pregunta con estructura:
    {
      "id": "${specs[0].id}",
      "type": "${specs[0].type}",
      "prompt": "Pregunta completa aquí",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "answer": "Opción correcta (texto completo)",
      "rationale": "Explicación",
      "difficulty": "${specs[0].difficulty}",
      "taxonomy": "${specs[0].taxonomyLevel}",
      "tags": []
    }
  `;
}
```

**Criterios de Aceptación**:
- [ ] Tool creado con schemas
- [ ] Generación en chunks paralela (Promise.all)
- [ ] Callback de progreso funcional
- [ ] Validación por pregunta
- [ ] Manejo de errores por chunk (no bloquear todos)
- [ ] Retry individual implementado (opcional)
- [ ] Test manual con 10 preguntas exitoso

**Tiempo Estimado**: 8 horas

---

### Tarea 1.5: Implementar Tool - Validate And Organize Exam

**Estado**: ⏳ Pendiente

**Descripción**: Crear tool para validar y corregir esquema de examen

**Archivo**: `lib/ai/mastra/tools/validate-organize-exam.ts`

**Código**:
```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { ExamSchema, type Exam } from "../schemas";
import { sanitizeAIExamPayload } from "@/lib/ai/chat/json-parser";

const inputSchema = z.object({
  questions: z.array(z.any()), // Permitir cualquier estructura
});

const outputSchema = z.object({
  exam: ExamSchema,
  corrections: z.array(z.object({
    questionId: z.string(),
    issue: z.string(),
    correction: z.string(),
  })),
});

export const validateAndOrganizeExamTool = createTool({
  id: "validate-organize-exam",
  description: "Valida el esquema del examen y corrige errores comunes",
  inputSchema,
  outputSchema,

  execute: async ({ context }) => {
    const { questions } = context;
    const corrections: Array<{
      questionId: string;
      issue: string;
      correction: string;
    }> = [];

    // Construir objeto exam
    const examPayload = {
      exam: {
        title: "",
        subject: "",
        level: "",
        language: "es",
        questions,
      },
    };

    // Aplicar sanitización (reutilizar código existente)
    const sanitized = sanitizeAIExamPayload(examPayload);

    // Normalizar IDs (q1, q2, q3...)
    sanitized.exam.questions.forEach((q: any, index: number) => {
      const oldId = q.id;
      const newId = `q${index + 1}`;

      if (oldId !== newId) {
        q.id = newId;
        corrections.push({
          questionId: newId,
          issue: "ID no secuencial",
          correction: `Renombrado de ${oldId} a ${newId}`,
        });
      }
    });

    // Validar con schema
    try {
      const validatedExam = ExamSchema.parse(sanitized);

      return {
        exam: validatedExam.exam,
        corrections,
      };
    } catch (error) {
      // Si falla validación, intentar reparar
      console.error("Validation failed:", error);

      // Aplicar reparaciones adicionales
      // ...

      // Re-intentar validación
      const repairedExam = ExamSchema.parse(sanitized);

      return {
        exam: repairedExam.exam,
        corrections,
      };
    }
  },
});
```

**Criterios de Aceptación**:
- [ ] Tool creado con schemas
- [ ] Reutiliza `sanitizeAIExamPayload`
- [ ] Normaliza IDs secuencialmente
- [ ] Reporta correcciones aplicadas
- [ ] Manejo de errores robusto
- [ ] Test manual exitoso

**Tiempo Estimado**: 4 horas

---

### Tarea 1.6: Implementar Tool - Randomize Options

**Estado**: ⏳ Pendiente

**Descripción**: Crear tool para aleatorizar opciones de respuesta

**Archivo**: `lib/ai/mastra/tools/randomize-options.ts`

**Código**:
```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { ExamSchema, type Exam } from "../schemas";
import { fisherYatesShuffle } from "../utils";

const inputSchema = z.object({
  exam: ExamSchema,
  seed: z.number().optional(), // Para reproducibilidad
});

const outputSchema = z.object({
  exam: ExamSchema,
});

export const randomizeOptionsTool = createTool({
  id: "randomize-options",
  description: "Aleatoriza las opciones de respuesta usando Fisher-Yates shuffle",
  inputSchema,
  outputSchema,

  execute: async ({ context }) => {
    const { exam, seed } = context;

    const randomizedExam = {
      ...exam.exam,
      questions: exam.exam.questions.map((question) => {
        // Solo aleatorizar multiple_choice
        if (question.type !== "multiple_choice") {
          return question;
        }

        const { options, answer } = question;

        // Encontrar índice de respuesta correcta
        const correctIndex = options.indexOf(answer);

        if (correctIndex === -1) {
          console.warn(`Answer not found in options for question ${question.id}`);
          return question;
        }

        // Aleatorizar opciones
        const shuffledOptions = fisherYatesShuffle(options, seed);

        // Actualizar answer a nueva posición
        const newAnswer = shuffledOptions[shuffledOptions.indexOf(answer)];

        return {
          ...question,
          options: shuffledOptions,
          answer: newAnswer,
        };
      }),
    };

    return { exam: { exam: randomizedExam } };
  },
});
```

**Criterios de Aceptación**:
- [ ] Tool creado con schemas
- [ ] Aleatorización solo para multiple_choice
- [ ] Answer actualizado correctamente
- [ ] Soporte de seed para reproducibilidad
- [ ] Test manual exitoso
- [ ] Unit tests pasando

**Tiempo Estimado**: 3 horas

---

### Tarea 1.7: Implementar Tool - Regenerate Question

**Estado**: ✅ Completado

**Descripción**: Crear tool para regenerar pregunta específica

**Archivo**: `lib/ai/mastra/tools/regenerate-question.ts`

**Código**: Similar a generateQuestionsInBulk pero para una sola pregunta

**Criterios de Aceptación**:
- [ ] Tool creado
- [ ] Regeneración individual funcional
- [ ] Mantiene ID original
- [ ] Test manual exitoso

**Tiempo Estimado**: 4 horas

---

### Tarea 1.8: Implementar Tool - Add Questions

**Estado**: ✅ Completado

**Descripción**: Crear tool para adicionar preguntas a examen existente

**Archivo**: `lib/ai/mastra/tools/add-questions.ts`

**Código**: Combina planExamGeneration + generateQuestionsInBulk con IDs continuos

**Criterios de Aceptación**:
- [ ] Tool creado
- [ ] Adición de preguntas funcional
- [ ] IDs continuos (q11, q12...)
- [ ] Test manual exitoso

**Tiempo Estimado**: 4 horas

---

### Tarea 1.9: Exportar Tools

**Estado**: ✅ Completado

**Descripción**: Exportar todos los tools desde index

**Archivo**: `lib/ai/mastra/tools/index.ts`

**Código**:
```typescript
export { planExamGenerationTool } from "./plan-exam-generation";
export { generateQuestionsInBulkTool } from "./generate-questions-bulk";
export { validateAndOrganizeExamTool } from "./validate-organize-exam";
export { randomizeOptionsTool } from "./randomize-options";
export { regenerateQuestionTool } from "./regenerate-question";
export { addQuestionsTool } from "./add-questions";
```

**Criterios de Aceptación**:
- [x] Todos los tools exportados
- [x] Imports funcionan correctamente

**Tiempo Estimado**: 15 minutos

---

### Tarea 1.10: Implementar Agente Orquestador

**Estado**: ✅ Completado

**Descripción**: Crear agente principal con todos los tools

**Archivo**: `lib/ai/mastra/agents/chat-orchestrator.ts`

**Código**: Ver ejemplo en Plan de Alto Nivel, sección 3.1

**Criterios de Aceptación**:
- [x] Agente creado con Agent API
- [x] Todos los tools registrados
- [x] Instructions claras y completas (bilingües)
- [x] Modelo configurado (OpenRouter)
- [x] maxSteps documentado (se configura en runtime)
- [ ] Test manual con prompt simple exitoso (pendiente para Fase 3)

**Tiempo Estimado**: 4 horas

---

### Tarea 1.11: Configurar Mastra Instance

**Estado**: ✅ Completado

**Descripción**: Crear instancia de Mastra con agentes registrados

**Archivo**: `lib/ai/mastra/mastra.config.ts`

**Código**:
```typescript
import { Mastra } from "@mastra/core";
import { chatOrchestratorAgent } from "./agents/chat-orchestrator";

export const mastra = new Mastra({
  agents: {
    chatOrchestrator: chatOrchestratorAgent,
  },
});
```

**Archivo**: `lib/ai/mastra/index.ts`

**Código**:
```typescript
export { mastra } from "./mastra.config";
export { chatOrchestratorAgent } from "./agents/chat-orchestrator";
export * from "./tools";
export * from "./schemas";
```

**Criterios de Aceptación**:
- [x] Instancia de Mastra creada
- [x] Agente registrado
- [x] Exports configurados
- [x] `mastra.getAgent('chatOrchestrator')` funcional

**Tiempo Estimado**: 1 hora

---

### Tarea 1.12: Implementar API Route con Streaming

**Estado**: ✅ Completado

**Descripción**: Crear endpoint con soporte de SSE

**Consideraciones i18n:**
- Detectar `locale` del usuario autenticado (de sesión/headers)
- Pasar locale al agente orquestador en runtimeContext
- Los mensajes de progreso (SSE) deben enviar claves i18n, NO texto hardcodeado
- Ejemplo correcto:
  ```typescript
  {
    type: "progress",
    messageKey: "chat.progress.generatingChunk",
    params: { current: 3, total: 10 }
  }
  ```
- El frontend resolverá la clave según el locale del usuario

**Archivo**: `app/api/chat-mastra/route.ts`

**Código**:
```typescript
import { NextRequest } from "next/server";
import { verifyTeacherAuth } from "@/lib/auth/verify-teacher-auth";
import { TierService } from "@/lib/services/tier-service";
import { ChatRequestSchema } from "@/lib/ai/chat/schemas";
import { mastra } from "@/lib/ai/mastra";

export const runtime = "nodejs"; // SSE requires Node runtime

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const { userId } = await verifyTeacherAuth(req);

    // 2. Feature flag check
    if (process.env.AI_CHAT_MASTRA !== "true") {
      return Response.json(
        { error: "Mastra chat not enabled" },
        { status: 503 }
      );
    }

    // 3. Tier limits
    const { hasAccess, limit, usage } = await TierService.checkFeatureAccess(
      userId,
      "ai_generation"
    );

    if (!hasAccess) {
      return Response.json(
        {
          error: "Límite de generaciones alcanzado",
          limit,
          usage,
        },
        { status: 403 }
      );
    }

    // 4. Validación
    const body = await req.json();
    const { messages, context } = ChatRequestSchema.parse(body);

    // 5. Get agent
    const agent = mastra.getAgent("chatOrchestrator");

    // 6. Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream agent responses
          const response = await agent.stream(messages, {
            runtimeContext: new Map([
              ["userId", userId],
              ["context", context],
            ]),
            onStepFinish: ({ text, toolCalls, toolResults }) => {
              // Enviar progreso
              const data = JSON.stringify({
                type: "progress",
                text,
                toolCalls: toolCalls?.map((tc) => tc.toolName),
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            },
            onFinish: ({ steps, text, finishReason }) => {
              // Enviar resultado final
              const data = JSON.stringify({
                type: "done",
                result: text,
                finishReason,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              controller.close();
            },
          });
        } catch (error) {
          const data = JSON.stringify({
            type: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          controller.close();
        }
      },
    });

    // 7. Increment usage (async, non-blocking)
    TierService.incrementUsage(userId, "ai_generation").catch((err) =>
      console.error("Failed to increment usage:", err)
    );

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat-mastra error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Criterios de Aceptación**:
- [x] Endpoint creado en `/api/chat-mastra`
- [x] Auth y tier limits integrados
- [x] Feature flag verificado
- [x] SSE streaming funcional
- [x] Progress events enviados con i18n keys
- [x] Manejo de errores robusto
- [ ] Test manual con curl o Postman exitoso (Fase 3)

**Tiempo Estimado**: 6 horas

---

### Tarea 1.13: Testing Unitario de Tools

**Estado**: ⏭️ Omitida (por decisión del proyecto)

**Descripción**: Crear tests unitarios para cada tool

**Archivos**: `lib/ai/mastra/tools/__tests__/`

**Estructura**:
```
lib/ai/mastra/tools/__tests__/
├── plan-exam-generation.test.ts
├── generate-questions-bulk.test.ts
├── validate-organize-exam.test.ts
├── randomize-options.test.ts
├── regenerate-question.test.ts
└── add-questions.test.ts
```

**Ejemplo de Test** (`randomize-options.test.ts`):
```typescript
import { randomizeOptionsTool } from "../randomize-options";

describe("randomizeOptionsTool", () => {
  it("should randomize options and update answer", async () => {
    const input = {
      exam: {
        exam: {
          title: "Test",
          questions: [
            {
              id: "q1",
              type: "multiple_choice",
              prompt: "Test?",
              options: ["A", "B", "C", "D"],
              answer: "B",
              rationale: "",
              difficulty: "medium",
            },
          ],
        },
      },
      seed: 12345, // Deterministic
    };

    const result = await randomizeOptionsTool.execute({ context: input });

    expect(result.exam.exam.questions[0].options).not.toEqual(["A", "B", "C", "D"]);
    expect(result.exam.exam.questions[0].answer).toBe("B");
    expect(result.exam.exam.questions[0].options).toContain("B");
  });
});
```

**Criterios de Aceptación**:
- [ ] Tests para cada tool
- [ ] Mocks de LLM (evitar llamadas reales)
- [ ] Coverage > 80% en tools
- [ ] Todos los tests pasando

**Tiempo Estimado**: 8 horas

---

## Fase 2: Frontend Adaptation

**Duración Estimada**: 1-2 semanas
**Estado**: ✅ Completado (5/6 completadas, 1 omitida)

### Tarea 2.1: Crear Hook para SSE Streaming

**Estado**: ✅ Completado

**Descripción**: Hook para manejar EventSource y SSE

**Archivo**: `app/[locale]/dashboard/exams/ai-exams-creation-chat/hooks/useSSEStream.ts`

**Código**:
```typescript
import { useState, useCallback, useRef } from "react";

interface SSEMessage {
  type: "progress" | "done" | "error";
  text?: string;
  toolCalls?: string[];
  result?: any;
  error?: string;
}

export function useSSEStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startStream = useCallback(async (endpoint: string, payload: any) => {
    setIsStreaming(true);
    setMessages([]);

    // Nota: EventSource no soporta POST directamente
    // Solución: usar fetch con ReadableStream

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error("No reader available");

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            setMessages((prev) => [...prev, data]);

            if (data.type === "done" || data.type === "error") {
              setIsStreaming(false);
            }
          }
        }
      }
    } catch (error) {
      console.error("Stream error:", error);
      setIsStreaming(false);
    }
  }, []);

  const stopStream = useCallback(() => {
    eventSourceRef.current?.close();
    setIsStreaming(false);
  }, []);

  return {
    isStreaming,
    messages,
    startStream,
    stopStream,
  };
}
```

**Criterios de Aceptación**:
- [x] Hook creado y exportado
- [x] Manejo de SSE con fetch + ReadableStream
- [x] Estados (isStreaming, messages) correctos
- [x] Cleanup en unmount
- [x] Test manual exitoso

**Tiempo Estimado**: 4 horas
**Tiempo Real**: 3 horas

---

### Tarea 2.2: Adaptar useChatMessages para Mastra

**Estado**: ✅ Completado

**Descripción**: Modificar hook para usar endpoint correcto según feature flag

**Consideraciones i18n:**
- Detectar locale desde next-intl: `useLocale()` hook
- Pasar locale en payload al API route
- Procesar mensajes SSE que contienen claves i18n:
  ```typescript
  // Mensaje SSE del backend
  { type: "progress", messageKey: "chat.progress.generatingChunk", params: { current: 3, total: 10 } }

  // Resolución con next-intl
  const t = useTranslations('ai_exams_chat');
  const message = t(data.messageKey, data.params);
  // → "Generando preguntas 1-3 de 10..." (ES)
  // → "Generating questions 1-3 of 10..." (EN)
  ```
- Mantener retrocompatibilidad con mensajes de texto directo (legacy)

**Archivo**: `app/[locale]/dashboard/exams/ai-exams-creation-chat/hooks/useChatMessages.ts`

**Cambios**:
```typescript
import { useSSEStream } from "./useSSEStream";

export function useChatMessages() {
  const { isStreaming, messages: sseMessages, startStream } = useSSEStream();

  // Determinar endpoint según feature flag
  const useMastra = process.env.NEXT_PUBLIC_AI_CHAT_MASTRA === "true";
  const endpoint = useMastra ? "/api/chat-mastra" : "/api/chat";

  const sendMessage = async (input: string) => {
    if (useMastra) {
      // Usar streaming
      await startStream(endpoint, { messages, context });

      // Procesar mensajes SSE
      // ...
    } else {
      // Usar legacy (fetch normal)
      const response = await fetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ messages, context }),
      });
      // ...
    }
  };

  return { messages, isSending: isStreaming, sendMessage };
}
```

**Criterios de Aceptación**:
- [x] Feature flag integrado
- [x] Streaming para Mastra
- [x] Legacy para chat normal
- [x] Backward compatible
- [x] Test manual exitoso

**Tiempo Estimado**: 3 horas
**Tiempo Real**: 4 horas

---

### Tarea 2.3: Crear Componente Progress Messages

**Estado**: ✅ Completado

**Descripción**: Componente para mostrar mensajes de progreso en tiempo real

**Archivo**: `app/[locale]/dashboard/exams/ai-exams-creation-chat/components/ProgressMessages.tsx`

**Código**:
```typescript
import { motion, AnimatePresence } from "framer-motion";

interface ProgressMessage {
  id: string;
  text: string;
  emoji?: string;
  timestamp: number;
}

export function ProgressMessages({
  messages,
}: {
  messages: ProgressMessage[];
}) {
  return (
    <div className="space-y-2 py-4">
      <AnimatePresence>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            {msg.emoji && <span>{msg.emoji}</span>}
            <span>{msg.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

**Criterios de Aceptación**:
- [x] Componente creado
- [x] Animaciones (CSS transitions en lugar de Framer Motion)
- [x] Soporte de emojis
- [x] Scroll automático a último mensaje
- [x] Test visual exitoso

**Tiempo Estimado**: 3 horas
**Tiempo Real**: 2 horas
**Nota**: Se usaron CSS transitions en lugar de Framer Motion (no instalado)

---

### Tarea 2.4: Integrar Progress Messages en ChatPanel

**Estado**: ✅ Completado

**Descripción**: Mostrar progreso durante generación

**Archivo**: `app/[locale]/dashboard/exams/ai-exams-creation-chat/components/ChatPanel.tsx`

**Cambios**:
```typescript
import { ProgressMessages } from "./ProgressMessages";

export function ChatPanel() {
  const { messages, isSending, progressMessages } = useChatMessages();

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      {messages.map((msg) => (
        <Message key={msg.id} message={msg} />
      ))}

      {/* Progress (solo si está enviando) */}
      {isSending && <ProgressMessages messages={progressMessages} />}

      {/* Input */}
      <PromptInput onSend={handleSend} disabled={isSending} />
    </div>
  );
}
```

**Criterios de Aceptación**:
- [x] Progress messages visible durante generación
- [x] Oculto cuando no está generando
- [x] No interfiere con mensajes normales
- [x] Test visual exitoso

**Tiempo Estimado**: 2 horas
**Tiempo Real**: 1 hora

---

### Tarea 2.5: Adaptar ResultsView para Resultados Parciales

**Estado**: ✅ Completado

**Descripción**: Mostrar preguntas a medida que se generan

**Archivo**: `app/[locale]/dashboard/exams/ai-exams-creation-chat/components/ResultsView.tsx`

**Cambios**:
- Suscribirse a updates de resultado parcial
- Mostrar preguntas generadas hasta el momento
- Loading state por pregunta

**Implementación**:
- ✅ Prop `isSending` agregado a ResultsView
- ✅ Loading state cuando no hay preguntas y se está generando
- ✅ Skeletons (3 placeholders) para preguntas en proceso de generación
- ✅ Contador de preguntas generadas hasta el momento
- ✅ Botones deshabilitados durante generación (randomize y edit)
- ✅ Animaciones con pulse para loading states

**Criterios de Aceptación**:
- [x] Resultados parciales visibles
- [x] Loading per-question (skeletons)
- [x] Actualización en tiempo real
- [x] Test visual exitoso

**Tiempo Estimado**: 4 horas
**Tiempo Real**: 2 horas

---

### Tarea 2.6: Testing E2E de UI

**Estado**: ⏭️ Omitida

**Descripción**: Tests end-to-end del flujo completo

**Herramienta**: Playwright (o Cypress)

**Casos de Prueba**:
1. Generación completa de examen (10 preguntas)
2. Modificación de pregunta específica
3. Adición de preguntas
4. Feedback de progreso visible
5. Manejo de errores

**Criterios de Aceptación**:
- [ ] 5+ tests E2E pasando
- [ ] Screenshots en caso de falla
- [ ] CI/CD integrado (opcional)

**Tiempo Estimado**: 8 horas

---

## Fase 3: Testing y Refinamiento

**Duración Estimada**: 1-2 semanas
**Estado**: ⏳ Pendiente

### Tarea 3.1: QA Manual Exhaustivo

**Estado**: ⏳ Pendiente

**Descripción**: Testing manual de todos los flujos

**Checklist**:
- [ ] Generación de 5 preguntas
- [ ] Generación de 10 preguntas
- [ ] Generación de 20 preguntas
- [ ] Generación de 50 preguntas (límite)
- [ ] Modificación de pregunta individual
- [ ] Adición de 3 preguntas
- [ ] Eliminación de pregunta (via chat)
- [ ] Cambio de dificultad
- [ ] Upload de documento + generación
- [ ] Upload de múltiples documentos
- [ ] Generación con summaries
- [ ] Tier limits enforcement
- [ ] Feature flag on/off
- [ ] Errores de LLM manejados
- [ ] Errores de red manejados

**Criterios de Aceptación**:
- [ ] Todos los casos pasando
- [ ] Bugs documentados y priorizados
- [ ] UX refinada basada en testing

**Tiempo Estimado**: 10 horas

---

### Tarea 3.2: Optimización de Prompts

**Estado**: ⏳ Pendiente

**Descripción**: Refinar prompts para mejor calidad

**Foco**:
- Instrucciones de agente orquestador
- Prompts de tools individuales
- Mensajes de feedback al usuario

**Metodología**:
- A/B testing de variaciones
- Evaluación con LangSmith
- Feedback de usuarios beta

**Criterios de Aceptación**:
- [ ] Calidad de preguntas comparable o mejor que legacy
- [ ] Feedback claro y útil
- [ ] Sin confusiones de usuario

**Tiempo Estimado**: 6 horas

---

### Tarea 3.3: Performance Benchmarking

**Estado**: ⏳ Pendiente

**Descripción**: Comparar performance Mastra vs Legacy

**Métricas a Medir**:
- Latencia total (p50, p95, p99)
- Tiempo por pregunta
- Tokens consumidos
- Costo por generación
- Error rate
- User satisfaction (encuesta)

**Herramienta**: Script de benchmarking + LangSmith

**Criterios de Aceptación**:
- [ ] Latencia p95 < 25s para 10 preguntas
- [ ] Costo < $0.06 por generación
- [ ] Error rate < 2%
- [ ] Resultados documentados

**Tiempo Estimado**: 4 horas

---

### Tarea 3.4: Optimización de Costos

**Estado**: ⏳ Pendiente

**Descripción**: Reducir costos de LLM sin sacrificar calidad

**Estrategias**:
- Usar modelos baratos para plan (ministral-8b)
- Validación determinística (sin LLM)
- Cache de planes comunes
- Reducir tokens en prompts

**Criterios de Aceptación**:
- [ ] Costo reducido en 10-20% vs baseline
- [ ] Calidad mantenida (evaluación manual)

**Tiempo Estimado**: 6 horas

---

### Tarea 3.5: Documentación de API

**Estado**: ⏳ Pendiente

**Descripción**: Documentar endpoint `/api/chat-mastra`

**Archivo**: `mddocs/ai_chat_mastra/API.md`

**Contenido**:
- Request schema
- Response format (SSE)
- Ejemplos de uso
- Manejo de errores
- Rate limits

**Criterios de Aceptación**:
- [ ] Documentación completa
- [ ] Ejemplos funcionales
- [ ] README actualizado

**Tiempo Estimado**: 3 horas

---

## Fase 4: Rollout y Monitoreo

**Duración Estimada**: 2-4 semanas
**Estado**: ⏳ Pendiente

### Tarea 4.1: Deploy a Staging con Flag Off

**Estado**: ⏳ Pendiente

**Descripción**: Deploy a ambiente de staging

**Pasos**:
```bash
git push origin feature/ai-chat-mastra
# Crear PR a staging branch
# Deploy automático via Vercel
# Verificar env var: AI_CHAT_MASTRA=false
```

**Criterios de Aceptación**:
- [ ] Deploy exitoso
- [ ] Feature flag off
- [ ] App funcional (legacy mode)
- [ ] No errores en logs

**Tiempo Estimado**: 1 hora

---

### Tarea 4.2: Internal Testing (Admin Only)

**Estado**: ⏳ Pendiente

**Descripción**: Activar flag para usuarios admin

**Pasos**:
1. Cambiar flag a `true` en Vercel
2. Notificar a admins/beta testers
3. Recopilar feedback durante 1 semana
4. Monitorear errores y performance

**Métricas**:
- Error rate
- Latencia
- Satisfacción (NPS)
- Bugs reportados

**Criterios de Aceptación**:
- [ ] 5+ admins testeando
- [ ] Feedback recopilado
- [ ] Bugs críticos corregidos
- [ ] Performance aceptable

**Tiempo Estimado**: 1 semana (tiempo calendario)

---

### Tarea 4.3: Beta Rollout (Tier Plus)

**Estado**: ⏳ Pendiente

**Descripción**: Activar para usuarios Plus

**Implementación**:
```typescript
// middleware.ts o API route
const useMastra =
  process.env.AI_CHAT_MASTRA === "true" &&
  (userTier === "plus" || userTier === "admin");
```

**Pasos**:
1. Deploy con lógica de tier
2. Notificar a usuarios Plus
3. Monitorear durante 1 semana
4. Comparar con users Free (control group)

**Criterios de Aceptación**:
- [ ] Plus users usando Mastra
- [ ] Free users usando legacy
- [ ] Métricas comparativas positivas
- [ ] Feedback positivo

**Tiempo Estimado**: 1 semana (tiempo calendario)

---

### Tarea 4.4: General Availability

**Estado**: ⏳ Pendiente

**Descripción**: Activar para todos los usuarios

**Pasos**:
1. Cambiar flag a `true` global
2. Anuncio a usuarios (email, in-app)
3. Monitoreo intensivo 72h
4. Preparar rollback si necesario

**Criterios de Aceptación**:
- [ ] 100% de usuarios usando Mastra
- [ ] Error rate < 3%
- [ ] No quejas masivas
- [ ] Performance estable

**Tiempo Estimado**: 1 semana (tiempo calendario)

---

### Tarea 4.5: Configurar Monitoreo y Alerts

**Estado**: ⏳ Pendiente

**Descripción**: Setup de monitoreo en producción

**Herramientas**:
- Vercel Analytics (performance)
- LangSmith (AI observability)
- Sentry (errores) - opcional
- Custom dashboard (Grafana/Datadog) - opcional

**Alerts**:
- Error rate > 5%
- Latencia p95 > 30s
- Costos diarios > threshold
- Usage anomalies

**Criterios de Aceptación**:
- [ ] Dashboards configurados
- [ ] Alerts funcionando
- [ ] On-call rotación definida (si aplica)

**Tiempo Estimado**: 4 horas

---

### Tarea 4.6: Post-Release Monitoring (1 mes)

**Estado**: ⏳ Pendiente

**Descripción**: Monitoreo continuo post-release

**Actividades**:
- Review de métricas semanales
- Atención a bugs reportados
- Ajustes de prompts si necesario
- Optimizaciones incrementales

**Criterios de Aceptación**:
- [ ] 1 mes de operación estable
- [ ] Métricas dentro de targets
- [ ] Usuarios satisfechos

**Tiempo Estimado**: 1 mes (tiempo calendario)

---

## Fase 5: Deprecation y Cleanup

**Duración Estimada**: 1 semana
**Estado**: ⏳ Pendiente

### Tarea 5.1: Remover Código Legacy

**Estado**: ⏳ Pendiente

**Descripción**: Eliminar implementación legacy de chat

**Archivos a Remover/Modificar**:
- `app/api/chat/route.ts` (eliminar o dejar solo redirect)
- Feature flag logic (simplificar)
- Referencias a endpoint legacy en frontend

**Pasos**:
```bash
# Backup antes de eliminar
git checkout -b backup/legacy-chat main

# Eliminar archivos
git rm app/api/chat/route.ts

# Commit
git commit -m "chore: remove legacy AI chat implementation"
```

**Criterios de Aceptación**:
- [ ] Código legacy eliminado
- [ ] Referencias actualizadas
- [ ] Build exitoso
- [ ] Tests pasando

**Tiempo Estimado**: 3 horas

---

### Tarea 5.2: Cleanup de Dependencias

**Estado**: ⏳ Pendiente

**Descripción**: Remover dependencias no usadas

**Dependencias a Evaluar**:
- `langchain` - Puede mantenerse para otros features
- `@langchain/openai` - Evaluar si se usa en otro lugar

**Pasos**:
```bash
# Verificar uso
npx depcheck

# Remover si no se usa
npm uninstall langchain @langchain/openai

# Rebuild
npm run build
```

**Criterios de Aceptación**:
- [ ] Solo dependencias necesarias
- [ ] Bundle size reducido
- [ ] Build exitoso

**Tiempo Estimado**: 2 horas

---

### Tarea 5.3: Actualizar Documentación

**Estado**: ⏳ Pendiente

**Descripción**: Documentar arquitectura final

**Archivos**:
- `README.md` - Actualizar descripción de AI chat
- `.claude/CLAUDE.md` - Actualizar arquitectura
- `mddocs/ai_chat_mastra/FINAL.md` - Documento de cierre

**Contenido**:
- Arquitectura final
- Decisiones técnicas
- Lecciones aprendidas
- Métricas finales
- Próximos pasos

**Criterios de Aceptación**:
- [ ] Documentación actualizada
- [ ] Ejemplos funcionales
- [ ] Referencias correctas

**Tiempo Estimado**: 4 horas

---

### Tarea 5.4: Retrospectiva del Proyecto

**Estado**: ⏳ Pendiente

**Descripción**: Sesión de retrospectiva con equipo

**Agenda**:
1. ¿Qué salió bien?
2. ¿Qué salió mal?
3. ¿Qué aprendimos?
4. ¿Qué mejoraríamos para próxima vez?

**Salida**: Documento de lecciones aprendidas

**Criterios de Aceptación**:
- [ ] Retrospectiva realizada
- [ ] Documento de lecciones creado
- [ ] Acción items definidos

**Tiempo Estimado**: 2 horas

---

## Resumen de Tiempo Estimado por Fase

| Fase | Duración Estimada | Tareas |
|------|-------------------|--------|
| Fase 0: Setup | 1 semana | 7 tareas |
| Fase 1: Implementación Core | 2-3 semanas | 13 tareas |
| Fase 2: Frontend Adaptation | 1-2 semanas | 6 tareas |
| Fase 3: Testing y Refinamiento | 1-2 semanas | 5 tareas |
| Fase 4: Rollout y Monitoreo | 2-4 semanas | 6 tareas |
| Fase 5: Deprecation | 1 semana | 4 tareas |
| **TOTAL** | **8-13 semanas** | **41 tareas** |

---

## Criterios de Éxito Global

### Técnicos
- [ ] Todos los tests pasando (unit + integration + E2E)
- [ ] Feature flag funcional
- [ ] Rollout exitoso sin rollback
- [ ] Performance dentro de targets
- [ ] Costos dentro de presupuesto

### Negocio
- [ ] Usuarios satisfechos (NPS > 70)
- [ ] Incremento en uso de feature AI
- [ ] Reducción de tickets de soporte
- [ ] ROI positivo (considerando desarrollo + costos)

### Calidad
- [ ] Calidad de preguntas igual o mejor que legacy
- [ ] UX mejorada (feedback en tiempo real)
- [ ] Funcionalidad de modificación parcial usada

---

## Próximos Pasos Inmediatos

1. ✅ Tarea 0.1: Crear feature branch - **Completado**
2. ✅ Tarea 0.2: Análisis de sistema actual - **Completado**
3. ✅ Tarea 0.3: Investigación de MastraAI - **Completado**
4. ✅ Tarea 0.4: Crear documentos de planificación - **Completado**
5. ✅ Tarea 0.5: Setup de dependencias - **Completado**
6. ✅ Tarea 0.6: Configurar variables de entorno - **Completado**
7. ✅ Tarea 0.7: Crear estructura de carpetas - **Completado**

**Fase 0 completada al 100%** 🎉

**Siguiente**: Comenzar Fase 1 - Implementación Core
- ⏳ Tarea 1.1: Implementar Schemas Zod

---

**Fin del Documento de Tareas**
