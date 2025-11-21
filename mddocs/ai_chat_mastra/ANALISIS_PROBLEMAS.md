# Análisis de Problemas - Testbench Chat AI Mastra

**Fecha**: 2025-11-21 (Actualizado)
**Branch**: `feature/ai-chat-mastra`

---

## Resumen Ejecutivo

De **13 casos probados**, **12 exitosos** (92%) y **1 con problemas** (8%).

### Casos Exitosos ✅
- Caso 1.1: Generación 5 preguntas ✅
- Caso 1.2: Generación 10 preguntas ✅
- **Caso 1.3: Generación 20 preguntas ✅** (RESUELTO)
- Caso 1.4: Generación easy ✅
- Caso 1.5: Generación hard ✅
- Caso 1.6: Generación inglés ✅
- Caso 2.1: Adición simple ✅
- Caso 2.2: Adición múltiple grupos ✅
- **Caso 2.3: Adición con dificultad ✅** (RESUELTO)
- Casos 3.1-3.5: Todas las modificaciones ✅
- Casos 5.1-5.2: Regeneración ✅
- Caso 6.1: Cambio dificultad individual ✅
- Casos 7.1-7.2: Distribución tópicos ✅
- Caso 9.1: Upload documento ✅
- **Caso 11.1: Máximo 40 preguntas ✅** (RESUELTO)

### Casos con Problemas ❌
1. **Caso 6.2**: Cambio masivo dificultad - ZodError en regenerateQuestion

---

## Problema 1: Agente se Detiene Después del Plan ✅ RESUELTO

### Casos Afectados
- Caso 1.3 (20 preguntas) ✅ RESUELTO
- Caso 2.3 (primer intento) ✅ RESUELTO
- Caso 11.1 (40 preguntas → solo 10) ✅ RESUELTO

### Síntomas Originales
```log
[PERF] Agent generation completed { stepCount: 2, finishReason: 'stop' }
[API] Tool calls executed { toolCalls: [ 'planExamGeneration' ] }
[API] Final examResult state { hasExamResult: false }
[API] Sending text response to frontend (no exam)
```

### Causa Raíz Identificada
1. **maxSteps estático**: Fijo en 15, insuficiente para workflows grandes
2. **numQuestions no parseado**: Backend no extraía número del mensaje del usuario
3. **Cálculo incorrecto**: Siempre usaba default (10) en vez del número real solicitado

### Solución Implementada

**Commits:**
- `bc9f4c2`: maxSteps dinámico según número de preguntas
- `932a1ba`: Parseo automático de numQuestions del mensaje

**Fórmula**: `Math.ceil(numQuestions / 5) + 3`
- `/5`: Tamaño de chunk para generación paralela
- `+3`: Pasos fijos (plan, validate, randomize)
- **Min**: 5, **Max**: 30

**Ejemplos**:
| Preguntas | maxSteps |
|-----------|----------|
| 5 | 5 |
| 10 | 5 |
| 20 | 7 |
| 40 | 11 |

**Función extractNumQuestions()**:
- Patrones regex para español e inglés
- Validación 1-100 preguntas
- Prioridad: context → mensaje → default

### Logs Después del Fix
```log
[API] Dynamic maxSteps calculated {
  requestedQuestions: 40,
  parsedFromMessage: 40,
  source: 'message',
  calculatedSteps: 11,
  maxSteps: 11
}
[INFO] Bulk generation completed: 40/40 questions in 11.35s
```

### Testing Confirmado
- Caso 1.3 (20 preguntas): ✅ Genera correctamente con maxSteps=7
- Caso 2.3 (adición): ✅ Funciona en primer intento
- Caso 11.1 (40 preguntas): ✅ Genera 40/40 con maxSteps=11

**Estado**: ✅ RESUELTO COMPLETAMENTE

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

## ~~Problema 3: Mensaje Duplicado en Reintento~~ ✅ RESUELTO

**Estado**: ✅ Resuelto indirectamente por el fix del Problema 1

Este problema ocurría porque el primer intento fallaba (Problema 1) y el usuario reintentaba.
Al resolver el Problema 1, el primer intento ahora funciona correctamente, eliminando la necesidad de reintentar.

---

## ~~Problema 4: Límite de 40 Preguntas No Respetado~~ ✅ RESUELTO

**Estado**: ✅ Resuelto completamente por el fix del Problema 1

Este era una manifestación del Problema 1 (maxSteps insuficiente).
Con maxSteps dinámico, ahora genera correctamente 40/40 preguntas con maxSteps=11.

---

## Próximos Pasos

### Alta Prioridad 🔴

1. **Arreglar Schema `source` (Problema 2)** ← SIGUIENTE
   - Archivo: `lib/ai/mastra/schemas/index.ts`
   - Hacer `source` opcional con default
   - Testing: Caso 6.2
   - Estimado: 15-30 min

### Completados ✅

- [x] maxSteps dinámico (Problema 1)
- [x] Parseo numQuestions del mensaje (Problema 1)
- [x] Testing Casos 1.3, 2.3, 11.1

---

## Métricas Actuales

### Antes del Fix (2025-11-21 AM)

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

### Después del Fix (2025-11-21 PM)

| Categoría | Exitosos | Fallidos | Tasa Éxito | Cambio |
|-----------|----------|----------|------------|--------|
| Generación Inicial | **6/6** | 0/6 | **100%** | ✅ +33% |
| Adición | **3/3** | 0/3 | **100%** | ✅ +33% |
| Modificación | 5/5 | 0/5 | 100% | - |
| Regeneración | 2/2 | 0/2 | 100% | - |
| Cambio Dificultad | 1/2 | 1/2 | 50% | ⏸️ Pendiente |
| Distribución Tópicos | 2/2 | 0/2 | 100% | - |
| Upload Documentos | 1/1 | 0/1 | 100% | - |
| Límites | **1/1** | 0/1 | **100%** | ✅ +100% |
| **TOTAL** | **12/13** | **1/13** | **92%** | ✅ **+23%** |

### Próximo Target
- Cambio Dificultad: 100% (2/2) - Resolver Problema 2
- **TOTAL**: 100% (13/13)

---

**Última Actualización**: 2025-11-21 PM
**Próximo Review**: Después de resolver P2 (source schema)
