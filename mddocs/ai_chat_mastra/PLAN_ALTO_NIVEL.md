# Plan de Alto Nivel: Migración AI Chat Legacy a MastraAI

**Versión**: 1.0
**Fecha**: 2025-11-16
**Estado**: En Planificación
**Branch**: `feature/ai-chat-mastra`

---

## 1. Visión General

### 1.1 Objetivo Estratégico

Modernizar el sistema de generación de exámenes con IA reemplazando la implementación actual basada en LangChain directa por una arquitectura agéntica robusta usando **MastraAI**, con el objetivo de:

- **Mejorar la experiencia del usuario** con feedback en tiempo real durante la generación
- **Aumentar la eficiencia** mediante generación paralela de preguntas
- **Incrementar la confiabilidad** con validadores y manejo de errores robusto
- **Facilitar la evolución** con arquitectura modular de tools y agentes
- **Mantener la observabilidad** con LangSmith integrado
- **Asegurar migración gradual** mediante feature flag `AI_CHAT_MASTRA`

### 1.2 Contexto

**Sistema Actual:**
- API Route: `/api/chat` con LangChain directo
- Generación monolítica de todo el examen en una sola llamada
- Feedback limitado (solo loading/success/error)
- Sin capacidad de regeneración parcial
- Observabilidad con LangSmith manual

**Sistema Objetivo:**
- API Route: `/api/chat-mastra` (nuevo) con agente orquestador
- Generación en fases: planeación → generación paralela → organización → aleatorización
- Feedback granular en cada paso del proceso
- Capacidad de modificación/adición parcial de preguntas
- Observabilidad nativa de MastraAI + LangSmith

---

## 2. Arquitectura Objetivo

### 2.1 Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Chat UI)                          │
│  - ChatPanel con streaming real-time                            │
│  - Feedback granular por fase                                   │
│  - Resultados parciales visualizables                           │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              API ROUTE: /api/chat-mastra                        │
│  - Autenticación y tier limits                                 │
│  - Validación de entrada (Zod)                                 │
│  - Streaming SSE de progreso                                   │
│  - Feature flag: AI_CHAT_MASTRA                                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│           MASTRA AGENT: Chat Orchestrator                       │
│                                                                  │
│  Instructions: Orquesta la generación de exámenes              │
│  Model: OpenRouter (google/gemini-2.5-flash-lite)             │
│                                                                  │
│  Tools disponibles:                                             │
│  ├─ planExamGeneration                                         │
│  ├─ generateQuestionsInBulk                                    │
│  ├─ validateAndOrganizeExam                                    │
│  ├─ randomizeOptions                                           │
│  ├─ regenerateQuestion                                         │
│  └─ addQuestions                                               │
│                                                                  │
│  Validators:                                                    │
│  ├─ ExamPlanSchema (Zod)                                       │
│  ├─ QuestionSchema (Zod)                                       │
│  └─ FinalExamSchema (Zod)                                      │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬─────────────┐
        ▼            ▼            ▼             ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐  ┌─────────────┐
   │ OpenAI  │ │LangSmith│ │Supabase │  │  IndexedDB  │
   │(OpenRtr)│ │(Tracing)│ │  (DB)   │  │ (Documents) │
   └─────────┘ └─────────┘ └─────────┘  └─────────────┘
```

### 2.2 Flujo de Generación de Examen (Nuevo)

#### Fase 1: Planeación
```
Usuario: "Genera 10 preguntas de fotosíntesis, nivel medio"
        ↓
Orquestador ejecuta: planExamGeneration
        ↓
Resultado: Plan de examen
{
  totalQuestions: 10,
  questionSpecs: [
    {
      id: "q1",
      topic: "Fotosíntesis - Definición",
      examplePrompt: "¿Qué es la fotosíntesis?",
      type: "multiple_choice",
      difficulty: "medium",
      taxonomyLevel: "remember"
    },
    // ... q2-q10
  ]
}
        ↓
Feedback al usuario: "📋 Plan creado: 10 preguntas sobre fotosíntesis"
```

#### Fase 2: Generación Paralela/Bulk
```
Orquestador ejecuta: generateQuestionsInBulk(questionSpecs)
        ↓
Generación pseudo-paralela (chunks de 3-5 preguntas)
        ↓
Feedback al usuario:
  - "⚙️ Generando preguntas 1-3 de 10..."
  - "⚙️ Generando preguntas 4-6 de 10..."
  - "⚙️ Generando preguntas 7-9 de 10..."
  - "⚙️ Generando pregunta 10 de 10..."
        ↓
Resultado: Array de preguntas generadas
[
  { id: "q1", prompt: "...", options: [...], answer: "...", ... },
  // ... q2-q10
]
```

#### Fase 3: Validación y Organización
```
Orquestador ejecuta: validateAndOrganizeExam(questions)
        ↓
Validación de esquema (Zod)
Corrección de errores de formato
Normalización de IDs
        ↓
Feedback al usuario: "✅ Validando formato de preguntas..."
        ↓
Resultado: Examen validado y organizado
```

#### Fase 4: Aleatorización de Opciones
```
Orquestador ejecuta: randomizeOptions(exam)
        ↓
Fisher-Yates shuffle de opciones por pregunta
Actualización de campo answer a nueva posición
        ↓
Feedback al usuario: "🔀 Aleatorizando opciones..."
        ↓
Resultado: Examen final con opciones aleatorizadas
```

#### Fase 5: Finalización
```
Feedback al usuario:
"✅ Generación finalizada. 10 preguntas creadas.
   👉 Haz clic en 'Resultados' para ver las preguntas generadas."
        ↓
Persistencia en LocalStorage + IndexedDB
Usuario navega a ResultsView
```

### 2.3 Flujo de Modificación Parcial

```
Usuario: "Cambia la pregunta 3 para que sea más difícil"
        ↓
Orquestador analiza: existingExam + request
        ↓
Orquestador ejecuta: regenerateQuestion(questionId: "q3", instruction: "más difícil")
        ↓
Generación de nueva pregunta q3
        ↓
Feedback: "⚙️ Regenerando pregunta 3..."
        ↓
Reemplazo de q3 en exam
        ↓
Orquestador ejecuta: randomizeOptions (solo q3)
        ↓
Feedback: "✅ Pregunta 3 actualizada."
```

```
Usuario: "Adiciona 2 preguntas más sobre clorofila"
        ↓
Orquestador ejecuta: planExamGeneration (2 preguntas, tema: clorofila)
        ↓
Orquestador ejecuta: generateQuestionsInBulk (nuevas 2 preguntas)
        ↓
Feedback: "⚙️ Generando 2 preguntas adicionales sobre clorofila..."
        ↓
Orquestador ejecuta: validateAndOrganizeExam (merge con existente)
        ↓
Orquestador ejecuta: randomizeOptions (todas las preguntas)
        ↓
Feedback: "✅ 2 preguntas adicionadas. Total: 12 preguntas."
```

---

## 2.4 Internacionalización (i18n)

### Consideraciones de Idioma

**Locale ISO 639-1:**
- El proyecto usa códigos ISO 639 Set 1 para locales: `es` (Español), `en` (English)
- **IMPORTANTE**: Al instruir al LLM, SIEMPRE aclarar que el código es ISO 639-1
- Ejemplo: "Genera el examen en idioma Español (código ISO 639-1: 'es')"
- **NO** decir solo "genera en 'en'" → el LLM no entiende que 'en' = inglés sin contexto

**Detección de Locale:**
- Por defecto, usar el `locale` del usuario autenticado (de la sesión)
- Fallback: `es` (español) si no está disponible
- El usuario puede especificar explícitamente el idioma en el prompt

**Prompts del LLM:**
- Los prompts deben ser bilingües (español/inglés) según el locale
- Incluir aclaración explícita: `"Idioma: Español (ISO 639-1: 'es')"`
- Ejemplo en prompt:
  ```
  **Requisitos:**
  - Idioma del examen: Español (código ISO 639-1: "es")
  ```

**Mensajes de Feedback (Frontend):**
- Los mensajes de progreso mostrados al usuario deben usar el sistema i18n del proyecto
- Esquema: `i18n/locales/{locale}/ai_exams_chat.json`
- **NO** enviar texto hardcodeado desde el LLM para mostrar al usuario
- **SÍ** enviar claves i18n que el frontend resuelva

**Ejemplo de Feedback Internacionalizado:**
```typescript
// ❌ MAL - Texto hardcodeado del LLM
{
  type: "progress",
  message: "Generando preguntas 1-3 de 10..."
}

// ✅ BIEN - Clave i18n + parámetros
{
  type: "progress",
  messageKey: "chat.progress.generatingChunk",
  params: { current: 3, total: 10 }
}

// En i18n/locales/es/ai_exams_chat.json:
{
  "chat": {
    "progress": {
      "generatingChunk": "Generando preguntas 1-{current} de {total}..."
    }
  }
}

// En i18n/locales/en/ai_exams_chat.json:
{
  "chat": {
    "progress": {
      "generatingChunk": "Generating questions 1-{current} of {total}..."
    }
  }
}
```

**Tags de Preguntas:**
- Los tags generados por el LLM pueden estar en cualquier idioma (según el examen)
- Ejemplo: Examen en español → tags: ["fotosíntesis", "biología", "nivel medio"]
- Ejemplo: Examen en inglés → tags: ["photosynthesis", "biology", "intermediate level"]

---

## 3. Componentes Principales

### 3.1 Agente Orquestador

**Archivo**: `lib/ai/mastra/agents/chat-orchestrator.ts`

```typescript
import { Agent } from "@mastra/core/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  planExamGenerationTool,
  generateQuestionsInBulkTool,
  validateAndOrganizeExamTool,
  randomizeOptionsTool,
  regenerateQuestionTool,
  addQuestionsTool
} from "./tools";

const openrouter = createOpenRouter({
  headers: {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/",
    "X-Title": "ProfeVision Chat - Mastra",
  },
});

export const chatOrchestratorAgent = new Agent({
  name: 'ProfeVision Chat Orchestrator',
  instructions: `
    Eres un experto en generar exámenes educativos de alta calidad.

    TU FLUJO DE TRABAJO:
    1. SIEMPRE empieza con planExamGeneration para crear un plan detallado
    2. Ejecuta generateQuestionsInBulk con el plan (en chunks para eficiencia)
    3. Valida con validateAndOrganizeExam
    4. Aleatoriza con randomizeOptions
    5. Entrega el resultado final al usuario

    PARA MODIFICACIONES:
    - Si el usuario pide cambiar pregunta X, usa regenerateQuestion
    - Si el usuario pide adicionar preguntas, usa addQuestions
    - SIEMPRE re-aleatoriza después de modificaciones

    FEEDBACK AL USUARIO:
    - Mantén informado al usuario de cada paso
    - Usa emojis para claridad (📋 🔄 ✅ ⚙️)
    - Sé conciso pero informativo
  `,
  model: openrouter(process.env.OPENAI_MODEL || 'google/gemini-2.5-flash-lite'),
  tools: {
    planExamGeneration: planExamGenerationTool,
    generateQuestionsInBulk: generateQuestionsInBulkTool,
    validateAndOrganizeExam: validateAndOrganizeExamTool,
    randomizeOptions: randomizeOptionsTool,
    regenerateQuestion: regenerateQuestionTool,
    addQuestions: addQuestionsTool,
  },
  maxSteps: 10, // Prevenir loops infinitos
});
```

### 3.2 Tools

#### Tool 1: Plan Exam Generation

**Archivo**: `lib/ai/mastra/tools/plan-exam-generation.ts`

**Propósito**: Crear un plan detallado de las preguntas a generar

**Input Schema**:
```typescript
{
  numQuestions: number,
  topics: string[],
  difficulty: "easy" | "medium" | "hard" | "mixed",
  questionTypes: string[],
  taxonomyLevels?: string[]
}
```

**Output Schema**:
```typescript
{
  totalQuestions: number,
  questionSpecs: Array<{
    id: string,
    topic: string,
    examplePrompt: string,
    type: string,
    difficulty: string,
    taxonomyLevel: string
  }>
}
```

**Lógica**:
- Llama a un modelo LLM para generar el plan
- Distribuye preguntas por temas
- Balancea dificultad y taxonomía
- Devuelve especificaciones sin generar preguntas completas

#### Tool 2: Generate Questions In Bulk

**Archivo**: `lib/ai/mastra/tools/generate-questions-bulk.ts`

**Propósito**: Generar preguntas en chunks paralelos

**Input Schema**:
```typescript
{
  questionSpecs: Array<QuestionSpec>,
  context?: {
    documentSummaries?: Array<TopicSummary>,
    language: string
  },
  chunkSize?: number // Default: 3
}
```

**Output Schema**:
```typescript
{
  questions: Array<ExamQuestion>
}
```

**Lógica**:
- Divide questionSpecs en chunks de N preguntas
- Para cada chunk, genera preguntas en paralelo (Promise.all)
- Usa el mismo prompt base del sistema actual
- Valida cada pregunta con schema
- Reporta progreso mediante callbacks
- Maneja errores gracefully (retry individual)

#### Tool 3: Validate And Organize Exam

**Archivo**: `lib/ai/mastra/tools/validate-organize-exam.ts`

**Propósito**: Validar esquema y corregir errores comunes

**Input Schema**:
```typescript
{
  questions: Array<any>
}
```

**Output Schema**:
```typescript
{
  exam: ExamSchema,
  corrections: Array<{
    questionId: string,
    issue: string,
    correction: string
  }>
}
```

**Lógica**:
- Valida con Zod schema (reutiliza ExamSchema actual)
- Aplica sanitización (reutiliza sanitizeAIExamPayload)
- Normaliza IDs (q1, q2, q3...)
- Reporta correcciones aplicadas

#### Tool 4: Randomize Options

**Archivo**: `lib/ai/mastra/tools/randomize-options.ts`

**Propósito**: Aleatorizar opciones de respuesta (Fisher-Yates)

**Input Schema**:
```typescript
{
  exam: ExamSchema
}
```

**Output Schema**:
```typescript
{
  exam: ExamSchema
}
```

**Lógica**:
- Para cada pregunta multiple_choice:
  - Obtiene answer actual
  - Aleatoriza options con Fisher-Yates
  - Actualiza answer a nueva posición
- Determinístico (usa seed si se proporciona)

#### Tool 5: Regenerate Question

**Archivo**: `lib/ai/mastra/tools/regenerate-question.ts`

**Propósito**: Regenerar una pregunta específica

**Input Schema**:
```typescript
{
  questionId: string,
  instruction: string,
  currentQuestion: ExamQuestion,
  context?: GenerationContext
}
```

**Output Schema**:
```typescript
{
  question: ExamQuestion
}
```

**Lógica**:
- Llama a LLM con prompt específico para modificar pregunta
- Mantiene el mismo ID
- Valida con schema

#### Tool 6: Add Questions

**Archivo**: `lib/ai/mastra/tools/add-questions.ts`

**Propósito**: Adicionar preguntas a examen existente

**Input Schema**:
```typescript
{
  numQuestions: number,
  topics: string[],
  existingExam: ExamSchema,
  context?: GenerationContext
}
```

**Output Schema**:
```typescript
{
  newQuestions: Array<ExamQuestion>
}
```

**Lógica**:
- Crea plan para nuevas preguntas (reutiliza planExamGeneration)
- Genera preguntas (reutiliza generateQuestionsInBulk)
- Asigna IDs continuos (q11, q12, etc.)
- NO modifica exam existente (eso lo hace el orquestador)

### 3.3 API Route

**Archivo**: `app/api/chat-mastra/route.ts`

**Responsabilidades**:
1. Autenticación (reutiliza verifyTeacherAuth)
2. Tier limits (reutiliza TierService)
3. Validación de entrada (Zod)
4. Streaming SSE de progreso
5. Invocación de agente Mastra
6. Manejo de errores
7. Tracking de uso

**Endpoint**: `POST /api/chat-mastra`

**Flujo**:
```typescript
export async function POST(req: Request) {
  try {
    // 1. Auth
    const { userId } = await verifyTeacherAuth();

    // 2. Tier check
    const { hasAccess, limit } = await TierService.checkFeatureAccess(userId, 'ai_generation');
    if (!hasAccess) return Response.json({ error: '...' }, { status: 403 });

    // 3. Validación
    const { messages, context } = ChatRequestSchema.parse(await req.json());

    // 4. Inicializar Mastra
    const agent = mastra.getAgent('chatOrchestrator');

    // 5. Streaming
    const stream = await agent.stream(messages, {
      context: runtimeContext,
      onStepFinish: ({ text, toolCalls, toolResults }) => {
        // Enviar progreso via SSE
        writeSSE({ type: 'progress', text, toolCalls });
      },
      onFinish: ({ steps, text, finishReason }) => {
        // Finalizar stream
        writeSSE({ type: 'done', result: text });
      },
    });

    // 6. Retornar streaming response
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream' }
    });

  } catch (error) {
    // Manejo de errores
    return Response.json({ error: '...' }, { status: 500 });
  }
}
```

### 3.4 Frontend Adaptations

#### Chat Panel con Streaming

**Archivo**: `app/[locale]/dashboard/exams/ai-exams-creation-chat/components/ChatPanel.tsx`

**Cambios necesarios**:
1. Reemplazar fetch estándar por EventSource (SSE)
2. Manejar eventos de progreso en tiempo real
3. Mostrar feedback granular por fase
4. Actualizar resultado parcial durante generación

**Pseudocódigo**:
```typescript
const handleSendWithStreaming = async (input: string) => {
  const eventSource = new EventSource('/api/chat-mastra', {
    method: 'POST',
    body: JSON.stringify({ messages, context })
  });

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'progress') {
      // Actualizar UI con feedback
      addProgressMessage(data.text);

      // Si hay resultado parcial, actualizar
      if (data.partialResult) {
        updatePartialResult(data.partialResult);
      }
    }

    if (data.type === 'done') {
      // Finalizar, mostrar resultado completo
      updateFinalResult(data.result);
      eventSource.close();
    }

    if (data.type === 'error') {
      // Mostrar error
      showError(data.error);
      eventSource.close();
    }
  };
};
```

#### Progress Messages Component

**Archivo**: `app/[locale]/dashboard/exams/ai-exams-creation-chat/components/ProgressMessages.tsx`

**Propósito**: Mostrar mensajes de progreso durante la generación

**UI**:
```
📋 Plan creado: 10 preguntas sobre fotosíntesis
⚙️ Generando preguntas 1-3 de 10...
⚙️ Generando preguntas 4-6 de 10...
⚙️ Generando preguntas 7-9 de 10...
⚙️ Generando pregunta 10 de 10...
✅ Validando formato de preguntas...
🔀 Aleatorizando opciones...
✅ Generación finalizada. Haz clic en Resultados para ver las preguntas.
```

---

## 4. Estrategia de Migración

### 4.1 Feature Flag

**Variable de Entorno**: `AI_CHAT_MASTRA=true|false`

**Implementación**:
```typescript
// middleware.ts o layout config
const useMastraChat = process.env.AI_CHAT_MASTRA === 'true';

// En ChatPanel
const apiEndpoint = useMastraChat ? '/api/chat-mastra' : '/api/chat';
```

**Ventajas**:
- Rollback instantáneo si hay problemas
- A/B testing (porcentaje de usuarios)
- Comparación de performance lado a lado
- Migración gradual por tier (Free → Plus → All)

### 4.2 Fases de Rollout

**Fase 0: Desarrollo**
- Implementar nueva arquitectura en paralelo
- Testing local exhaustivo
- Validar paridad de features
- Feature flag: `false` (off)

**Fase 1: Internal Testing**
- Deploy a producción con flag `false`
- Activar manualmente para usuarios admin
- Recopilar feedback y métricas
- Iterar sobre bugs y UX

**Fase 2: Beta Users (Tier Plus)**
- Activar flag para usuarios Plus
- Monitorear errores y performance
- Comparar costos AI (Mastra vs Legacy)
- Recopilar satisfacción de usuario

**Fase 3: General Availability**
- Activar flag para todos los usuarios
- Mantener legacy endpoint 1 mes para rollback
- Monitorear métricas clave (latencia, éxito, costos)

**Fase 4: Deprecation**
- Eliminar código legacy después de 1 mes estable
- Remover feature flag
- Documentar nueva arquitectura

### 4.3 Rollback Plan

**Si hay problemas críticos**:
1. Cambiar env var: `AI_CHAT_MASTRA=false`
2. Redeploy (Vercel: instant)
3. Todos los usuarios vuelven a legacy
4. Investigar y corregir en dev
5. Re-intentar rollout

**Triggers de Rollback**:
- Error rate > 5%
- Latencia p95 > 30s
- Costos AI > 150% del baseline
- Quejas de usuarios > threshold

---

## 5. Ventajas del Nuevo Sistema

### 5.1 Para el Usuario

1. **Feedback en Tiempo Real**
   - Ve el progreso de generación paso a paso
   - Entiende qué está pasando (no solo spinner)
   - Puede cancelar si no le gusta el plan

2. **Generación Más Rápida (Percibida)**
   - Preguntas generadas en paralelo
   - Feedback intermedio reduce ansiedad
   - Resultados parciales visibles

3. **Modificación Granular**
   - "Cambia la pregunta 3" → solo regenera q3
   - "Adiciona 2 preguntas de clorofila" → solo genera 2
   - No re-genera todo el examen

4. **Mayor Confianza**
   - Ve el plan antes de generar
   - Puede aprobar o modificar plan
   - Menos "sorpresas" en el resultado

### 5.2 Para el Sistema

1. **Modularidad**
   - Tools independientes y testeables
   - Fácil adicionar nuevas capacidades
   - Reutilización de lógica

2. **Observabilidad**
   - Mastra tracing nativo
   - LangSmith integrado
   - Métricas por tool

3. **Confiabilidad**
   - Validadores en cada paso
   - Retry automático de tools
   - Manejo de errores granular

4. **Escalabilidad**
   - Generación paralela real
   - Menor latencia total
   - Mejor uso de recursos

5. **Mantenibilidad**
   - Código más limpio y organizado
   - Separación de responsabilidades
   - Documentación por tool

---

## 6. Consideraciones Técnicas

### 6.1 Compatibilidad

- **AI SDK V5**: Mastra es compatible con AI SDK v4 y v5
- **OpenRouter**: Soporte nativo via `@openrouter/ai-sdk-provider`
- **LangSmith**: Integración manual adicional (como actualmente)
- **Supabase**: Sin cambios, mismo auth y DB
- **IndexedDB**: Sin cambios, mismos documentos

### 6.2 Dependencias Nuevas

```json
{
  "@mastra/core": "^0.14.0",
  "@openrouter/ai-sdk-provider": "^1.0.0"
}
```

**Dependencias a Remover (después de deprecar legacy)**:
```json
{
  "langchain": "^0.3.77",  // Mantener hasta deprecar legacy
  "@langchain/openai": "^0.3.18"
}
```

### 6.3 Migración de Esquemas

**Buenas noticias**: No hay cambios en esquemas de datos

- `ExamSchema` se mantiene igual
- `QuestionSchema` se mantiene igual
- `TopicSummary` se mantiene igual
- Formato de respuesta de API idéntico (para compatibilidad frontend)

**Única diferencia**: Proceso interno de generación

### 6.4 Performance Estimado

**Legacy (actual)**:
- Latencia total: ~15-30s para 10 preguntas
- Generación: Secuencial, una llamada LLM
- Feedback: Solo loading spinner

**Mastra (objetivo)**:
- Latencia total: ~12-20s para 10 preguntas
- Generación: Paralela (chunks de 3-5), múltiples llamadas
- Feedback: 5-8 mensajes de progreso
- Percepción de velocidad: Mucho mejor

**Optimizaciones adicionales**:
- Cache de planes comunes
- Reutilización de preguntas similares
- Generación incremental (streaming dentro de tools)

### 6.5 Costos AI

**Análisis**:
- Más llamadas LLM (plan + chunks + validación)
- Pero llamadas más pequeñas y específicas
- Tokens totales: Similar o ligeramente mayor (+10-20%)
- Beneficio: Mejor uso de modelos baratos para subtareas

**Estrategia de optimización**:
- Plan: Modelo barato (ministral-8b)
- Generación: Modelo actual (gemini-flash-lite)
- Validación: Modelo ultra-barato o determinístico
- Aleatorización: Sin LLM (código)

### 6.6 Testing

**Estrategias**:

1. **Unit Tests** (tools individuales)
   - Mock de LLM responses
   - Validar input/output schemas
   - Edge cases (errores, formatos inválidos)

2. **Integration Tests** (agente completo)
   - Flujos end-to-end
   - Modificación parcial
   - Manejo de errores

3. **E2E Tests** (frontend + backend)
   - Generación completa desde UI
   - Streaming de progreso
   - Guardar resultados

4. **Manual QA**
   - Calidad de preguntas generadas
   - UX de feedback
   - Edge cases de usuario

---

## 7. Riesgos y Mitigaciones

### 7.1 Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Generación paralela falla | Media | Alto | Retry individual, fallback a secuencial |
| Costos AI aumentan significativamente | Baja | Alto | Monitoring, alerts, optimización de modelos |
| Latencia aumenta vs legacy | Baja | Medio | Benchmarking, optimización de chunks |
| Bugs en migración | Alta | Alto | Feature flag, testing exhaustivo, rollback plan |
| UX de streaming confunde usuarios | Media | Medio | User testing, iteración de mensajes |
| Mastra tiene bugs/incompatibilidades | Baja | Alto | Contribuir a OSS, fork si necesario |

### 7.2 Plan de Contingencia

**Si Mastra no funciona como esperado**:
1. Mantener legacy indefinidamente
2. Evaluar alternativas (LangGraph, custom orchestration)
3. Implementar generación paralela sin framework agéntico

---

## 8. Cronograma Estimado

### Fase 0: Setup (1 semana)
- [x] Crear feature branch
- [x] Análisis de sistema actual
- [x] Investigación de Mastra
- [x] Documento de plan de alto nivel
- [ ] Documento de tareas detallado

### Fase 1: Implementación Core (2-3 semanas)
- Instalar dependencias
- Crear tools básicos
- Implementar agente orquestador
- API route con streaming
- Testing unitario

### Fase 2: Frontend Adaptation (1-2 semanas)
- Streaming SSE en ChatPanel
- Progress messages UI
- Manejo de resultados parciales
- Testing E2E

### Fase 3: Testing & Refinamiento (1-2 semanas)
- QA manual extensivo
- Optimización de prompts
- Tuning de feedback messages
- Performance benchmarking

### Fase 4: Rollout (2-4 semanas)
- Deploy con flag off
- Internal testing (1 semana)
- Beta users (1 semana)
- General availability (1 semana)
- Monitoreo post-release (1 semana)

### Fase 5: Deprecation (1 mes después)
- Remover código legacy
- Cleanup de dependencias
- Documentación final

**Total estimado**: 2-3 meses

---

## 9. Métricas de Éxito

### 9.1 Métricas Cuantitativas

| Métrica | Baseline (Legacy) | Target (Mastra) |
|---------|-------------------|-----------------|
| Latencia p50 | 18s | 15s |
| Latencia p95 | 28s | 22s |
| Error rate | 3% | <2% |
| Costo por generación | $0.05 | <$0.06 |
| Satisfacción usuario (NPS) | - | >70 |
| Tasa de modificación parcial | 0% | >30% |

### 9.2 Métricas Cualitativas

- Feedback de usuarios positivo (encuestas)
- Reducción de tickets de soporte relacionados con IA
- Incremento en uso de feature de generación
- Mayor confianza en resultados (menos re-generaciones completas)

---

## 10. Próximos Pasos Inmediatos

1. ✅ **Crear este documento** (Plan de Alto Nivel)
2. ⏳ **Crear documento de tareas** (breakdown detallado por fases)
3. ⏳ **Approval de stakeholders** (validar enfoque)
4. ⏳ **Setup de entorno de desarrollo** (dependencias, Mastra config)
5. ⏳ **Comenzar Fase 1** (implementación core)

---

## 11. Referencias

- [Mastra Documentation](https://mastra.ai/docs)
- [Mastra Agents Guide](https://mastra.ai/docs/agents/overview)
- [OpenRouter Integration](https://mastra.ai/docs/frameworks/openrouter)
- [AI SDK V5 Migration](https://mastra.ai/docs/frameworks/agentic-uis/ai-sdk)
- [Análisis de Sistema Actual](./CURRENT_SYSTEM_ANALYSIS.md) (pendiente de exportar del agent output)
- [Documento de Tareas](./TASKS_BY_PHASE.md) (pendiente de crear)

---

**Fin del Plan de Alto Nivel**
