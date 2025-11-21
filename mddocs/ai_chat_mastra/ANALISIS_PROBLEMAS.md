# Análisis de Problemas - Testbench Chat AI Mastra

**Fecha**: 2025-11-21
**Branch**: `feature/ai-chat-mastra`

---

## Resumen Ejecutivo

De **13 casos probados**, **9 exitosos** (69%) y **4 con problemas** (31%).

### Casos Exitosos ✅
- Caso 1.1: Generación 5 preguntas ✅
- Caso 1.2: Generación 10 preguntas ✅
- Caso 1.4: Generación easy ✅
- Caso 1.5: Generación hard ✅
- Caso 1.6: Generación inglés ✅
- Caso 2.1: Adición simple ✅
- Caso 2.2: Adición múltiple grupos ✅
- Casos 3.1-3.5: Todas las modificaciones ✅
- Casos 5.1-5.2: Regeneración ✅
- Caso 6.1: Cambio dificultad individual ✅
- Casos 7.1-7.2: Distribución tópicos ✅
- Caso 9.1: Upload documento ✅

### Casos con Problemas ❌
1. **Caso 1.3**: Generación 20 preguntas - No genera
2. **Caso 2.3**: Adición con dificultad - Primer intento falla, reintento duplica mensaje
3. **Caso 6.2**: Cambio masivo dificultad - ZodError en regenerateQuestion
4. **Caso 11.1**: Máximo 40 preguntas - Solo genera 10

---

## Problema 1: Agente se Detiene Después del Plan

### Casos Afectados
- Caso 1.3 (20 preguntas)
- Caso 2.3 (primer intento)
- Caso 11.1 (40 preguntas → solo 10)

### Síntomas
```log
[PERF] Agent generation completed { stepCount: 2, finishReason: 'stop' }
[API] Tool calls executed { toolCalls: [ 'planExamGeneration' ] }
[API] Final examResult state { hasExamResult: false }
[API] Sending text response to frontend (no exam)
```

### Análisis
1. Agente ejecuta `planExamGeneration` correctamente
2. Agente completa sin llamar a `generateQuestionsInBulk`
3. `finishReason: 'stop'` indica que el modelo decidió terminar
4. Frontend muestra: "Planificando examen... Procesando..." y luego permite escribir (sin resultado)

### Hipótesis
- **Agente instructions**: Instrucciones no claras sobre obligatoriedad de llamar generateQuestionsInBulk después del plan
- **maxSteps**: Posiblemente maxSteps=5 es insuficiente para 20+ preguntas
- **Model confusion**: Modelo piensa que el plan ES el resultado final
- **Token budget**: Respuesta muy larga causa truncamiento prematuro

### Logs Clave
```log
# Caso 1.3 - 20 preguntas
[PERF] Agent first step received { toolName: 'planExamGeneration', latency: 7353 }
[PERF] Agent step completed { toolCalls: 1 }  # Step 1: plan
[PERF] Agent step completed { toolCalls: 0 }  # Step 2: texto vacío, no tools
[PERF] Agent generation completed { stepCount: 2, finishReason: 'stop' }
[API] Tool calls executed { toolCalls: [ 'planExamGeneration' ] }  # Solo plan!
```

### Evidencia
- Caso 1.2 (10 preguntas): ✅ Exitoso
- Caso 1.3 (20 preguntas): ❌ Falla
- Caso 11.1 (40 preguntas): ❌ Falla (genera solo 10)

**Patrón**: Cuanto mayor el número de preguntas, más probabilidad de fallo.

---

## Problema 2: ZodError en `regenerateQuestion` - Campo `source` Requerido

### Casos Afectados
- Caso 6.2: Cambio masivo de dificultad

### Síntomas
```log
[ERROR] Error regenerating question: Error [ZodError]: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": ["source", "documentId"],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "array",
    "received": "undefined",
    "path": ["source", "spans"],
    "message": "Required"
  }
]
```

### Análisis
1. Usuario: "Cambia todas las preguntas a dificultad media"
2. Agente llama `regenerateQuestion` (debería llamar `modifyMultipleQuestions`)
3. LLM genera pregunta SIN campo `source`
4. Schema `ExamQuestionSchema` requiere `source.documentId` y `source.spans`
5. Validación falla con ZodError

### Causa Raíz
**Schema issue**: `source` está definido como requerido pero el LLM no lo genera consistentemente.

```typescript
// lib/ai/mastra/schemas/index.ts
source: z.object({
  documentId: z.string().nullable(),  // ❌ Required
  spans: z.array(z.unknown()),         // ❌ Required
})
```

### Solución Propuesta
Hacer `source` opcional o proveer default:

```typescript
source: z.object({
  documentId: z.string().nullable(),
  spans: z.array(z.unknown()),
}).optional().default({ documentId: null, spans: [] })
```

O en `regenerateQuestion` tool, asegurar que siempre se incluya:

```typescript
const regenerated = await generateQuestion(...);
return {
  ...regenerated,
  source: regenerated.source || { documentId: null, spans: [] }
};
```

### Logs Clave
```log
[INFO] [regenerateQuestion] Validated q12 exists in exam (12 questions)
[INFO] [regenerateQuestion] Extracted original question for q12
[ERROR] Error regenerating question: Error [ZodError]
[Agent:ProfeVision Chat Orchestrator] - Failed tool execution { name: 'regenerateQuestion' }
```

---

## Problema 3: Mensaje Duplicado en Reintento (Caso 2.3)

### Síntomas
Frontend muestra mensaje duplicado:
```
"He creado un plan para generar 10 preguntas sobre historia de Europa en el siglo XX.
Generando preguntas... Procesando... 10 preguntas sobre historia de Europa en el siglo XX
Hecho. He creado las preguntas para tu examen. He creado un plan para generar 10 preguntas
sobre historia de Europa en el siglo XX. Generando preguntas... Procesando... 10 preguntas
sobre historia de Europa en el siglo XX Hecho. He creado las preguntas para tu examen."
```

### Análisis
- Primer intento: Falla (Problema 1)
- Usuario reintenta con mismo prompt
- Segundo intento: Éxito PERO duplica confirmación

### Hipótesis
- **Frontend bug**: No limpia mensajes de progreso previos
- **Backend bug**: Envía eventos SSE duplicados
- **Estado incorrecto**: localStorage mantiene mensajes del intento fallido

### Solución
Investigar si el problema es:
1. Frontend no limpia estado entre intentos
2. Backend envía duplicados en SSE stream
3. Chat context incluye mensaje previo fallido

---

## Problema 4: Límite de 40 Preguntas No Respetado

### Caso Afectado
- Caso 11.1: Solicita 40, genera solo 10

### Análisis
Similar a Problema 1, pero más severo. Agente probablemente:
1. Crea plan para 40 preguntas
2. Llama `generateQuestionsInBulk` con chunk de 10 (primer chunk)
3. Se detiene sin procesar chunks restantes

### Logs Esperados vs Reales
**Esperado** (40 preguntas):
```log
[generateQuestionsInBulk] Generating chunk 1/8 (5 questions)
[generateQuestionsInBulk] Generating chunk 2/8 (5 questions)
...
[generateQuestionsInBulk] Generating chunk 8/8 (5 questions)
[validateAndOrganizeExam] Total 40 questions
```

**Real** (solo 10):
```log
[planExamGeneration] Plan created with 40 questionSpecs
# (probablemente solo 1 llamada a generateQuestionsInBulk)
[API] Final examResult state { hasExamResult: true, questionCount: 10 }
```

### Hipótesis
- **chunkSize issue**: Chunks muy grandes causan timeout
- **maxSteps issue**: 5 steps insuficientes para 8 chunks
- **Model confusion**: Modelo piensa que 10 es "suficiente"

---

## Recomendaciones Inmediatas

### Alta Prioridad 🔴

1. **Arreglar Schema `source` (Problema 2)**
   - Archivo: `lib/ai/mastra/schemas/index.ts`
   - Hacer `source` opcional con default
   - Testing: Caso 6.2

2. **Investigar Agent Instructions (Problema 1)**
   - Archivo: `lib/ai/mastra/agents/chat-orchestrator.ts`
   - Reforzar: "MUST call generateQuestionsInBulk after plan"
   - Agregar ejemplos explícitos para 20+ preguntas
   - Testing: Casos 1.3, 11.1

3. **Revisar maxSteps (Problema 1 y 4)**
   - Archivo: `app/api/chat-mastra/route.ts`
   - Aumentar de 5 a 10-15 para exámenes grandes
   - Calcular dinámicamente: `maxSteps = Math.ceil(numQuestions / 5) + 3`
   - Testing: Casos 1.3, 11.1

### Media Prioridad 🟡

4. **Limpiar Estado en Reintentos (Problema 3)**
   - Archivo: `app/.../hooks/useChatMessages.ts`
   - Limpiar progress messages al iniciar nuevo request
   - Testing: Caso 2.3 con reintento

5. **Logs Mejorados**
   - Agregar log cuando agente decide stop sin resultado
   - Agregar log de número total de steps ejecutados vs esperados
   - Agregar warning si plan tiene N preguntas pero solo genera M

### Baja Prioridad 🟢

6. **Timeout Handling**
   - Manejar gracefully si generateQuestionsInBulk tarda mucho
   - Mostrar progreso por chunk al usuario

7. **Test 11.2 y 11.3**
   - Validar límite superior (50 → ajustar a 40)
   - Validar límite inferior (1 pregunta)

---

## Plan de Acción

### Fase 1: Fixes Críticos (1-2 horas)
- [ ] Fix schema `source` opcional
- [ ] Revisar agent instructions para 20+ preguntas
- [ ] Aumentar maxSteps dinámicamente
- [ ] Commit: "fix(ai-chat): schema source optional + agent instructions + dynamic maxSteps"

### Fase 2: Testing (30 min)
- [ ] Re-ejecutar Caso 1.3 (20 preguntas)
- [ ] Re-ejecutar Caso 6.2 (cambio masivo)
- [ ] Re-ejecutar Caso 11.1 (40 preguntas)
- [ ] Documentar resultados

### Fase 3: Refinamiento (1 hora)
- [ ] Fix mensaje duplicado (Caso 2.3)
- [ ] Mejorar logs y warnings
- [ ] Commit: "refactor(ai-chat): improve progress messages and logging"

---

## Métricas Actuales

| Categoría | Exitosos | Fallidos | Tasa Éxito |
|-----------|----------|----------|------------|
| Generación Inicial | 4/6 | 2/6 | 67% |
| Adición | 2/3 | 1/3 | 67% |
| Modificación | 5/5 | 0/5 | 100% |
| Regeneración | 2/2 | 0/2 | 100% |
| Cambio Dificultad | 1/2 | 1/2 | 50% |
| Distribución Tópicos | 2/2 | 0/2 | 100% |
| Upload Documentos | 1/1 | 0/1 | 100% |
| Límites | 0/1 | 1/1 | 0% |
| **TOTAL** | **9/13** | **4/13** | **69%** |

### Target Post-Fixes
- Generación Inicial: 100% (6/6)
- Límites: 100% (1/1)
- **TOTAL**: 95%+ (12+/13)

---

**Última Actualización**: 2025-11-21
**Próximo Review**: Después de Fase 1
