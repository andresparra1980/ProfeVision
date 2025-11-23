# Testbench - Chat AI Mastra
## Plan de Pruebas con Datos Sintéticos

**Versión**: 1.0
**Fecha**: 2025-11-21
**Branch**: `feature/ai-chat-mastra`
**Estado**: 🧪 En Ejecución

---

## Índice

1. [Generación Inicial de Exámenes](#1-generación-inicial-de-exámenes)
2. [Adición de Preguntas](#2-adición-de-preguntas)
3. [Modificación de Preguntas](#3-modificación-de-preguntas)
4. [Eliminación de Preguntas](#4-eliminación-de-preguntas)
5. [Regeneración de Preguntas](#5-regeneración-de-preguntas)
6. [Cambios de Dificultad](#6-cambios-de-dificultad)
7. [Distribución de Tópicos](#7-distribución-de-tópicos)
8. [Manejo de Duplicados](#8-manejo-de-duplicados)
9. [Upload de Documentos](#9-upload-de-documentos)
10. [Casos de Error](#10-casos-de-error)
11. [Límites y Edge Cases](#11-límites-y-edge-cases)
12. [Performance y Feedback](#12-performance-y-feedback)

---

## 1. Generación Inicial de Exámenes

### Caso 1.1: Generación Básica - 5 Preguntas
**Estado**: ⏸️ Pendiente

**Prompt**:
```
Crea un examen de 5 preguntas sobre fotosíntesis para estudiantes de secundaria
```

**Contexto**:
- Tema: Fotosíntesis
- Nivel: Secundaria
- Cantidad: 5 preguntas
- Tipo: Multiple choice (default)
- Dificultad: Mixed (default)
- Idioma: Español

**Resultado Esperado**:
- ✅ Plan generado con 5 question specs
- ✅ 5 preguntas generadas correctamente
- ✅ IDs secuenciales: q1, q2, q3, q4, q5
- ✅ Cada pregunta tiene 4 opciones
- ✅ Una respuesta correcta por pregunta
- ✅ Rationale presente
- ✅ Sin duplicados
- ✅ Mensajes de progreso visibles en el chat

**Validación**:
- [ ] Verificar estructura JSON en localStorage
- [ ] Verificar IDs únicos y secuenciales
- [ ] Verificar que answer está en options
- [ ] Verificar que no hay duplicados de prompts
- [ ] Verificar que todos los campos requeridos están presentes

**Tiempo Esperado**: < 15 segundos

---

### Caso 1.2: Generación Media - 10 Preguntas
**Estado**: ⏸️ Pendiente

**Prompt**:
```
Genera 10 preguntas de opción múltiple sobre revolución industrial, dificultad media
```

**Contexto**:
- Tema: Revolución Industrial
- Cantidad: 10 preguntas
- Tipo: Multiple choice
- Dificultad: Medium
- Idioma: Español

**Resultado Esperado**:
- ✅ Plan con 10 question specs
- ✅ 10 preguntas generadas
- ✅ IDs: q1-q10
- ✅ Dificultad: medium para todas
- ✅ Sin duplicados
- ✅ Progress feedback en tiempo real

**Validación**:
- [ ] 10 preguntas exactas
- [ ] Todas dificultad "medium"
- [ ] Sin duplicados
- [ ] Respuestas correctas válidas

**Tiempo Esperado**: < 25 segundos

---

### Caso 1.3: Generación Grande - 20 Preguntas
**Estado**: ⏸️ Pendiente

**Prompt**:
```
Crea un examen completo de 20 preguntas sobre matemáticas básicas (suma, resta, multiplicación, división) para primaria
```

**Contexto**:
- Tema: Matemáticas básicas
- Nivel: Primaria
- Cantidad: 20 preguntas
- Tipo: Multiple choice
- Dificultad: Mixed
- Idioma: Español

**Resultado Esperado**:
- ✅ Plan con 20 question specs
- ✅ 20 preguntas generadas
- ✅ IDs: q1-q20
- ✅ Variedad de operaciones (suma, resta, multiplicación, división)
- ✅ Dificultad variada (easy, medium)
- ✅ Progress feedback (ej: "Generando preguntas 1-5 de 20...")

**Validación**:
- [ ] 20 preguntas exactas
- [ ] Variedad de temas cubiertos
- [ ] Sin duplicados
- [ ] Progreso visible en chunks

**Tiempo Esperado**: < 40 segundos

---

### Caso 1.4: Generación con Dificultad Específica - Easy
**Estado**: ⏸️ Pendiente

**Prompt**:
```
10 preguntas fáciles sobre el sistema solar
```

**Contexto**:
- Tema: Sistema solar
- Cantidad: 10 preguntas
- Tipo: Multiple choice
- Dificultad: Easy
- Idioma: Español

**Resultado Esperado**:
- ✅ 10 preguntas nivel fácil
- ✅ Todas con difficulty: "easy"
- ✅ Preguntas apropiadas para el nivel (ej: "¿Cuántos planetas tiene el sistema solar?")

**Validación**:
- [ ] Todas las preguntas tienen difficulty: "easy"
- [ ] Contenido apropiado para nivel fácil

**Tiempo Esperado**: < 20 segundos

---

### Caso 1.5: Generación con Dificultad Específica - Hard
**Estado**: ⏸️ Pendiente

**Prompt**:
```
Crea 8 preguntas difíciles sobre física cuántica
```

**Contexto**:
- Tema: Física cuántica
- Cantidad: 8 preguntas
- Tipo: Multiple choice
- Dificultad: Hard
- Idioma: Español

**Resultado Esperado**:
- ✅ 8 preguntas nivel difícil
- ✅ Todas con difficulty: "hard"
- ✅ Preguntas conceptualmente complejas

**Validación**:
- [ ] 8 preguntas exactas
- [ ] Todas difficulty: "hard"
- [ ] Contenido avanzado apropiado

**Tiempo Esperado**: < 20 segundos

---

### Caso 1.6: Generación en Inglés
**Estado**: ⏸️ Pendiente

**Prompt** (en inglés):
```
Create 5 questions about World War II for high school students
```

**Contexto**:
- Tema: World War II
- Nivel: High school
- Cantidad: 5 preguntas
- Idioma: English
- Tipo: Multiple choice
- Dificultad: Mixed

**Resultado Esperado**:
- ✅ 5 preguntas en inglés
- ✅ Prompts, opciones, rationale en inglés
- ✅ Tags en inglés (ej: ["world-war-ii", "history"])
- ✅ Estructura correcta

**Validación**:
- [ ] Todo el contenido en inglés
- [ ] Sin mezcla de idiomas
- [ ] Tags en inglés

**Tiempo Esperado**: < 15 segundos

---

## 2. Adición de Preguntas

### Caso 2.1: Adición Simple - Single Group
**Estado**: ⏸️ Pendiente

**Setup**:
1. Generar examen inicial: "5 preguntas sobre fotosíntesis"
2. Esperar resultado con q1-q5

**Prompt**:
```
Agrega 3 preguntas más sobre clorofila
```

**Resultado Esperado**:
- ✅ Examen original mantiene q1-q5 intactas
- ✅ 3 nuevas preguntas agregadas: q6, q7, q8
- ✅ Total: 8 preguntas
- ✅ IDs secuenciales sin gaps
- ✅ Nuevas preguntas sobre clorofila

**Validación**:
- [ ] Examen tiene 8 preguntas (5 + 3)
- [ ] IDs son q1, q2, ..., q8
- [ ] Preguntas originales no modificadas
- [ ] Nuevas preguntas sobre tema correcto

**Tiempo Esperado**: < 10 segundos

---

### Caso 2.2: Adición Multiple Groups - Sequential
**Estado**: ⏸️ Pendiente

**Setup**:
1. Generar examen inicial: "15 preguntas sobre inteligencia artificial"
2. Esperar resultado con q1-q15

**Prompt**:
```
Agreguemos 3 preguntas sobre Computer Vision, 2 sobre Deep Learning y 1 sobre estrategias de research
```

**Resultado Esperado**:
- ✅ Agente llama addQuestions 3 veces SECUENCIALMENTE
- ✅ Primera llamada: 3 preguntas (q16, q17, q18) sobre Computer Vision
- ✅ Segunda llamada: 2 preguntas (q19, q20) sobre Deep Learning
- ✅ Tercera llamada: 1 pregunta (q21) sobre research
- ✅ Total: 21 preguntas (15 + 6)
- ✅ IDs secuenciales: q1-q21
- ✅ Sin duplicados

**Validación**:
- [ ] 21 preguntas totales
- [ ] IDs son q1-q21 sin gaps
- [ ] Preguntas q16-q18 sobre Computer Vision
- [ ] Preguntas q19-q20 sobre Deep Learning
- [ ] Pregunta q21 sobre research
- [ ] Originales (q1-q15) no modificadas

**Tiempo Esperado**: < 20 segundos (3 llamadas secuenciales)

**Logs Esperados**:
```
Adding 3 questions starting from q15
Adding 2 questions starting from q18
Adding 1 questions starting from q20
```

---

### Caso 2.3: Adición con Dificultad Específica
**Estado**: ⏸️ Pendiente

**Setup**:
1. Generar examen inicial: "10 preguntas sobre historia"

**Prompt**:
```
Agrega 5 preguntas difíciles sobre la Segunda Guerra Mundial
```

**Resultado Esperado**:
- ✅ 5 nuevas preguntas agregadas (q11-q15)
- ✅ Todas con difficulty: "hard"
- ✅ Tema: Segunda Guerra Mundial

**Validación**:
- [ ] 15 preguntas totales
- [ ] Preguntas q11-q15 tienen difficulty: "hard"
- [ ] Contenido sobre WWII

**Tiempo Esperado**: < 12 segundos

---

## 3. Modificación de Preguntas

### Caso 3.1: Modificación de Pregunta Individual por Número
**Estado**: ⏸️ Pendiente

**Setup**:
1. Generar examen: "10 preguntas sobre biología"

**Prompt**:
```
Haz la pregunta 5 más difícil
```

**Resultado Esperado**:
- ✅ Solo pregunta q5 modificada
- ✅ Difficulty cambiado a "hard"
- ✅ Resto de preguntas (q1-q4, q6-q10) intactas
- ✅ Nuevo prompt más complejo para q5

**Validación**:
- [ ] Solo q5 modificada
- [ ] q5.difficulty === "hard"
- [ ] Otras preguntas sin cambios

**Tiempo Esperado**: < 8 segundos

---

### Caso 3.2: Modificación de Rango de Preguntas
**Estado**: ⏸️ Pendiente

**Setup**:
1. Generar examen: "15 preguntas sobre química"

**Prompt**:
```
Modifica las preguntas de la 3 a la 7 para que sean más fáciles
```

**Resultado Esperado**:
- ✅ Preguntas q3, q4, q5, q6, q7 modificadas
- ✅ Difficulty cambiado a "easy" para esas 5 preguntas
- ✅ Resto de preguntas intactas

**Validación**:
- [ ] Solo q3-q7 modificadas (5 preguntas)
- [ ] Todas tienen difficulty: "easy"
- [ ] q1-q2 y q8-q15 sin cambios

**Tiempo Esperado**: < 15 segundos

---

### Caso 3.3: Modificación Masiva - Todas las Preguntas
**Estado**: ⏸️ Pendiente

**Setup**:
1. Generar examen: "10 preguntas sobre geografía"

**Prompt**:
```
Cambia todas las preguntas a dificultad media
```

**Resultado Esperado**:
- ✅ Todas las 10 preguntas modificadas
- ✅ Difficulty: "medium" para todas
- ✅ IDs mantienen (q1-q10)

**Validación**:
- [ ] 10 preguntas con difficulty: "medium"
- [ ] IDs iguales
- [ ] Estructura preservada

**Tiempo Esperado**: < 20 segundos

---

### Caso 3.4: Modificación por Posición Relativa - "última"
**Estado**: ⏸️ Pendiente

**Setup**:
1. Generar examen: "12 preguntas sobre literatura"

**Prompt**:
```
Cambia la última pregunta para que sea sobre Don Quijote
```

**Resultado Esperado**:
- ✅ Solo pregunta q12 (última) modificada
- ✅ Nuevo prompt sobre Don Quijote
- ✅ Resto sin cambios

**Validación**:
- [ ] Solo q12 modificada
- [ ] Contenido sobre Don Quijote
- [ ] q1-q11 intactas

**Tiempo Esperado**: < 8 segundos

---

### Caso 3.5: Modificación por Número Escrito
**Estado**: ⏸️ Pendiente

**Setup**:
1. Generar examen: "8 preguntas sobre astronomía"

**Prompt**:
```
Mejora la pregunta cinco para que sea más clara
```

**Resultado Esperado**:
- ✅ Pregunta q5 modificada
- ✅ Prompt más claro/mejorado
- ✅ Resto sin cambios

**Validación**:
- [ ] Solo q5 modificada
- [ ] Prompt mejorado (más claro)

**Tiempo Esperado**: < 8 segundos

---

## 4. Eliminación de Preguntas

### Caso 4.1: Eliminar Pregunta Individual
**Estado**: ⏸️ Pendiente

**Setup**:
1. Generar examen: "10 preguntas sobre física"

**Prompt**:
```
Elimina la pregunta 7
```

**Resultado Esperado**:
- ✅ Pregunta q7 eliminada
- ✅ Total: 9 preguntas
- ✅ IDs renormalizados: q1-q9
- ✅ Orden preservado (q8 original → q7 nuevo)

**Validación**:
- [ ] 9 preguntas totales
- [ ] IDs son q1-q9 (sin gaps)
- [ ] Contenido de q8-q10 originales movido a q7-q9

**Tiempo Esperado**: < 5 segundos

---

### Caso 4.2: Eliminar Rango de Preguntas
**Estado**: ⏸️ Pendiente

**Setup**:
1. Generar examen: "15 preguntas sobre biología"

**Prompt**:
```
Elimina las preguntas 5, 6 y 7
```

**Resultado Esperado**:
- ✅ Preguntas q5, q6, q7 eliminadas
- ✅ Total: 12 preguntas
- ✅ IDs renormalizados: q1-q12

**Validación**:
- [ ] 12 preguntas totales
- [ ] IDs secuenciales q1-q12
- [ ] q1-q4 originales intactos
- [ ] q8-q15 originales → q5-q12 nuevos

**Tiempo Esperado**: < 5 segundos

---

### Caso 4.3: Rechazo de Eliminación (Safety)
**Estado**: ⏸️ Pendiente

**Setup**:
1. Generar examen: "3 preguntas sobre matemáticas"

**Prompt**:
```
Elimina las 3 preguntas
```

**Resultado Esperado**:
- ❌ Agente RECHAZA la eliminación
- ✅ Mensaje al usuario: "No puedo eliminar todas las preguntas. El examen debe tener al menos 1 pregunta."
- ✅ Examen permanece con 3 preguntas

**Validación**:
- [ ] Examen mantiene 3 preguntas
- [ ] Usuario recibe mensaje de error/warning
- [ ] No se ejecuta deleteQuestions

**Tiempo Esperado**: < 3 segundos

---

## 5. Regeneración de Preguntas

### Caso 5.1: Regenerar Pregunta Individual
**Estado**: ⏸️ Pendiente

**Setup**:
1. Generar examen: "10 preguntas sobre historia"

**Prompt**:
```
Regenera la pregunta 4
```

**Resultado Esperado**:
- ✅ Solo pregunta q4 regenerada
- ✅ Nuevo prompt completamente diferente
- ✅ Misma dificultad original
- ✅ Mismo tema general
- ✅ ID preservado (q4)
- ✅ Resto sin cambios

**Validación**:
- [ ] q4 tiene contenido nuevo (diferente al original)
- [ ] q4 mantiene ID
- [ ] Otras preguntas sin cambios

**Tiempo Esperado**: < 8 segundos

---

### Caso 5.2: Regenerar Múltiples Preguntas
**Estado**: ⏸️ Pendiente

**Setup**:
1. Generar examen: "12 preguntas sobre literatura"

**Prompt**:
```
Regenera las preguntas 3, 8 y 12
```

**Resultado Esperado**:
- ✅ Preguntas q3, q8, q12 regeneradas
- ✅ Contenido completamente nuevo para cada una
- ✅ IDs preservados
- ✅ Resto sin cambios

**Validación**:
- [ ] q3, q8, q12 con contenido nuevo
- [ ] IDs preservados
- [ ] Otras 9 preguntas sin cambios

**Tiempo Esperado**: < 12 segundos

---

## 6. Cambios de Dificultad

### Caso 6.1: Cambiar Dificultad de Pregunta Específica
**Estado**: ⏸️ Pendiente

**Setup**:
1. Generar examen: "8 preguntas sobre química"

**Prompt**:
```
Cambia la pregunta 5 a dificultad fácil
```

**Resultado Esperado**:
- ✅ q5.difficulty cambiado a "easy"
- ✅ Prompt simplificado si era más difícil
- ✅ Resto sin cambios

**Validación**:
- [ ] q5.difficulty === "easy"
- [ ] Otras preguntas sin cambios

**Tiempo Esperado**: < 8 segundos

---

### Caso 6.2: Cambiar Dificultad Masiva
**Estado**: ⏸️ Pendiente

**Setup**:
1. Generar examen: "15 preguntas sobre geografía, dificultad mixta"

**Prompt**:
```
Cambia todas las preguntas a dificultad media
```

**Resultado Esperado**:
- ✅ Todas las 15 preguntas con difficulty: "medium"
- ✅ Prompts ajustados al nivel medio

**Validación**:
- [ ] 15 preguntas todas con difficulty: "medium"
- [ ] Contenido apropiado para nivel medio

**Tiempo Esperado**: < 20 segundos

---

## 7. Distribución de Tópicos

### Caso 7.1: Distribución Exacta de Tópicos - One Shot
**Estado**: ⏸️ Pendiente

**Prompt**:
```
Crea un examen sobre inteligencia artificial con 10 preguntas sobre LLMs, 3 preguntas sobre Agentes y 2 preguntas sobre diseño HITL
```

**Contexto**:
- Temas: LLMs, Agentes, Diseño HITL
- Distribución exacta: 10 + 3 + 2 = 15
- Dificultad: Mixed
- Tipo: Multiple choice

**Resultado Esperado**:
- ✅ Plan con topicDistribution:
  ```json
  [
    {topic: "LLMs", count: 10},
    {topic: "Agentes", count: 3},
    {topic: "Diseño HITL", count: 2}
  ]
  ```
- ✅ 15 preguntas totales
- ✅ Exactamente 10 sobre LLMs (q1-q10)
- ✅ Exactamente 3 sobre Agentes (q11-q13)
- ✅ Exactamente 2 sobre HITL (q14-q15)
- ✅ Sin duplicados

**Validación**:
- [ ] 15 preguntas totales
- [ ] Distribución exacta por tema:
  - [ ] 10 preguntas sobre LLMs
  - [ ] 3 preguntas sobre Agentes
  - [ ] 2 preguntas sobre HITL
- [ ] Sin duplicados de prompts

**Tiempo Esperado**: < 30 segundos

---

### Caso 7.2: Distribución Exacta con Dificultad por Tema
**Estado**: ⏸️ Pendiente

**Prompt**:
```
Genera 5 preguntas fáciles sobre suma, 5 preguntas medias sobre resta y 5 preguntas difíciles sobre multiplicación
```

**Contexto**:
- Temas: Suma, Resta, Multiplicación
- Distribución: 5 + 5 + 5 = 15
- Dificultades específicas por tema

**Resultado Esperado**:
- ✅ Plan con topicDistribution:
  ```json
  [
    {topic: "Suma", count: 5, difficulty: "easy"},
    {topic: "Resta", count: 5, difficulty: "medium"},
    {topic: "Multiplicación", count: 5, difficulty: "hard"}
  ]
  ```
- ✅ 15 preguntas totales
- ✅ q1-q5: Suma, difficulty: "easy"
- ✅ q6-q10: Resta, difficulty: "medium"
- ✅ q11-q15: Multiplicación, difficulty: "hard"

**Validación**:
- [ ] 15 preguntas totales
- [ ] q1-q5 sobre suma, todas "easy"
- [ ] q6-q10 sobre resta, todas "medium"
- [ ] q11-q15 sobre multiplicación, todas "hard"

**Tiempo Esperado**: < 30 segundos

---

## 8. Manejo de Duplicados

### Caso 8.1: Detección y Eliminación de Duplicados
**Estado**: ⏸️ Pendiente

**Setup**:
1. Forzar generación de duplicados (manipulando seed o reduciendo variación)

**Resultado Esperado**:
- ✅ Sistema detecta duplicados automáticamente
- ✅ Duplicados removidos por `deduplicateQuestions()`
- ✅ Log con IDs de duplicados removidos
- ✅ Usuario recibe solo preguntas únicas

**Validación**:
- [ ] No hay preguntas con prompts idénticos (normalizados)
- [ ] Log muestra duplicados removidos
- [ ] Total de preguntas ajustado (ej: si se pidieron 10 y había 2 duplicados, resultado tiene 8 únicas)

**Tiempo Esperado**: < 5 segundos (post-generación)

**Nota**: Este test puede requerir modificar temporalmente el seed o el prompt para forzar duplicados.

---

## 9. Upload de Documentos

### Caso 9.1: Generación con Documento Único
**Estado**: ⏸️ Pendiente

**Setup**:
1. Preparar documento PDF sobre "Revolución Francesa"
2. Subirlo a través de la UI

**Prompt**:
```
Genera 8 preguntas basadas en el documento subido
```

**Resultado Esperado**:
- ✅ Documento procesado y resumido
- ✅ Resumen usado como contexto en plan
- ✅ 8 preguntas generadas basadas en contenido del documento
- ✅ Preguntas alineadas con temas del documento

**Validación**:
- [ ] 8 preguntas generadas
- [ ] Contenido alineado con documento
- [ ] No inventan información fuera del documento (si es posible validar)

**Tiempo Esperado**: < 35 segundos (procesamiento + generación)

---

### Caso 9.2: Generación con Múltiples Documentos
**Estado**: ⏸️ Pendiente

**Setup**:
1. Subir 3 documentos:
   - Doc 1: "Fotosíntesis"
   - Doc 2: "Respiración Celular"
   - Doc 3: "Ciclo del Carbono"

**Prompt**:
```
Genera 12 preguntas basadas en los 3 documentos subidos, 4 preguntas por documento
```

**Resultado Esperado**:
- ✅ 3 documentos procesados y resumidos
- ✅ Plan con distribución por documento
- ✅ 12 preguntas totales
- ✅ 4 preguntas por cada tema (fotosíntesis, respiración, ciclo carbono)

**Validación**:
- [ ] 12 preguntas totales
- [ ] ~4 preguntas por cada tema principal
- [ ] Contenido alineado con documentos

**Tiempo Esperado**: < 60 segundos

---

## 10. Casos de Error

### Caso 10.1: Error de LLM - Retry Graceful
**Estado**: ⏸️ Pendiente

**Setup**:
1. Simular error de LLM (timeout o rate limit)

**Resultado Esperado**:
- ✅ Sistema detecta error
- ✅ Intenta retry (si configurado)
- ✅ Usuario recibe mensaje claro de error
- ✅ Preguntas generadas hasta el momento preservadas (si generación parcial)
- ✅ No crash de la aplicación

**Validación**:
- [ ] Error manejado graciosamente
- [ ] Usuario informado claramente
- [ ] No pérdida de datos

**Tiempo Esperado**: Varía

---

### Caso 10.2: Error de Schema - Auto-Repair
**Estado**: ⏸️ Pendiente

**Setup**:
1. Forzar generación con error de schema (ej: answer numérico en vez de texto)

**Resultado Esperado**:
- ✅ `sanitizeAIExamPayload` detecta error
- ✅ Auto-reparación aplicada
- ✅ Pregunta corregida y validada
- ✅ Usuario recibe pregunta correcta
- ✅ Log muestra corrección aplicada

**Validación**:
- [ ] Pregunta pasa validación final
- [ ] Estructura correcta
- [ ] Log muestra corrección

**Tiempo Esperado**: < 5 segundos (post-generación)

---

### Caso 10.3: Límite de Tier - Rechazo
**Estado**: ⏸️ Pendiente

**Setup**:
1. Usuario con tier Free (límite: 10 generaciones/mes)
2. Agotar límite (10 generaciones ya consumidas)

**Prompt**:
```
Crea 5 preguntas sobre biología
```

**Resultado Esperado**:
- ❌ Generación rechazada
- ✅ Mensaje claro: "Límite de generaciones alcanzado. Actualiza a Plus para más generaciones."
- ✅ HTTP 403
- ✅ No consumo de tokens

**Validación**:
- [ ] Generación no ejecutada
- [ ] Mensaje de error claro
- [ ] Usuario puede ver su límite y uso actual

**Tiempo Esperado**: < 2 segundos

---

### Caso 10.4: Request Inválido - Validación
**Estado**: ⏸️ Pendiente

**Prompt**:
```
[Prompt vacío o solo espacios]
```

**Resultado Esperado**:
- ❌ Validación rechaza request
- ✅ Mensaje: "Por favor, escribe un mensaje válido"
- ✅ No consumo de recursos

**Validación**:
- [ ] Request rechazado antes de llamar LLM
- [ ] Mensaje de error apropiado

**Tiempo Esperado**: < 1 segundo

---

## 11. Límites y Edge Cases

### Caso 11.1: Máximo de Preguntas - 40
**Estado**: ⏸️ Pendiente

**Prompt**:
```
Genera 40 preguntas sobre historia universal
```

**Resultado Esperado**:
- ✅ 40 preguntas generadas (límite máximo)
- ✅ Generación en múltiples chunks
- ✅ Progress feedback visible

**Validación**:
- [ ] 40 preguntas exactas
- [ ] Sin errores
- [ ] Todas validadas

**Tiempo Esperado**: < 80 segundos

---

### Caso 11.2: Intentar Exceder Máximo - 50 Preguntas
**Estado**: ⏸️ Pendiente

**Prompt**:
```
Crea 50 preguntas sobre matemáticas
```

**Resultado Esperado**:
- ❌ Rechazo o ajuste a 40 (límite)
- ✅ Mensaje: "El límite máximo es 40 preguntas. Se generarán 40."
- ✅ Genera 40 preguntas

**Validación**:
- [ ] Máximo 40 preguntas generadas
- [ ] Usuario informado del límite

**Tiempo Esperado**: < 80 segundos

---

### Caso 11.3: Mínimo de Preguntas - 1
**Estado**: ⏸️ Pendiente

**Prompt**:
```
Genera 1 pregunta sobre Einstein
```

**Resultado Esperado**:
- ✅ 1 pregunta generada (q1)
- ✅ Estructura completa

**Validación**:
- [ ] 1 pregunta válida
- [ ] ID: q1

**Tiempo Esperado**: < 8 segundos

---

### Caso 11.4: Pregunta con LaTeX - Math Rendering
**Estado**: ⏸️ Pendiente

**Prompt**:
```
Genera 3 preguntas sobre ecuaciones cuadráticas con fórmulas matemáticas
```

**Resultado Esperado**:
- ✅ 3 preguntas con LaTeX en prompts
- ✅ LaTeX correctamente escapado (ej: `\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}`)
- ✅ `sanitizeJSON` corrige doble escapes si es necesario
- ✅ Rendering correcto en UI

**Validación**:
- [ ] 3 preguntas con fórmulas LaTeX
- [ ] LaTeX correctamente escapado
- [ ] No errores de parsing JSON

**Tiempo Esperado**: < 12 segundos

---

## 12. Performance y Feedback

### Caso 12.1: Feedback de Progreso Visible
**Estado**: ⏸️ Pendiente

**Setup**:
1. Generar examen de 15 preguntas

**Resultado Esperado**:
- ✅ Mensajes de progreso aparecen en el chat:
  - "Creando plan de 15 preguntas..."
  - "Generando preguntas 1-5 de 15..."
  - "Generando preguntas 6-10 de 15..."
  - "Generando preguntas 11-15 de 15..."
  - "Validando y organizando examen..."
  - "Aleatorizando opciones..."
  - "¡Generación completada! Haz clic en Resultados para ver las preguntas."
- ✅ Mensajes aparecen en tiempo real (no todos al final)

**Validación**:
- [ ] Mensajes aparecen progresivamente
- [ ] Timing apropiado (no instantáneo ni demorado)
- [ ] Mensajes claros y útiles

**Tiempo Esperado**: < 30 segundos (con mensajes distribuidos)

---

### Caso 12.2: Latencia - 10 Preguntas en < 25s
**Estado**: ⏸️ Pendiente

**Prompt**:
```
10 preguntas sobre geografía
```

**Resultado Esperado**:
- ✅ Generación completa en < 25 segundos (p95)

**Validación**:
- [ ] Tiempo total < 25s
- [ ] Si excede, investigar cuellos de botella

**Tiempo Esperado**: < 25 segundos (target)

---

### Caso 12.3: Resultados Parciales Visibles
**Estado**: ⏸️ Pendiente

**Setup**:
1. Abrir panel de Resultados
2. Generar examen de 15 preguntas

**Resultado Esperado**:
- ✅ Preguntas aparecen en Resultados a medida que se generan
- ✅ Primeras 3-5 preguntas visibles antes de que terminen las siguientes
- ✅ Skeletons/placeholders para preguntas pendientes
- ✅ Contador actualizado en tiempo real (ej: "5 de 15 preguntas generadas")

**Validación**:
- [ ] Preguntas aparecen progresivamente en Resultados
- [ ] Skeletons visibles para pendientes
- [ ] Contador actualizado

**Tiempo Esperado**: < 30 segundos (total)

---

### Caso 12.4: Botones Deshabilitados Durante Generación
**Estado**: ⏸️ Pendiente

**Setup**:
1. Iniciar generación de examen

**Resultado Esperado**:
- ✅ Botones "Aleatorizar", "Editar", "Eliminar" deshabilitados
- ✅ Input del chat deshabilitado (o con indicador "Generando...")
- ✅ Botones se habilitan cuando generación termina

**Validación**:
- [ ] Botones deshabilitados durante generación
- [ ] Botones habilitados al terminar
- [ ] Indicadores visuales claros (ej: opacity, cursor)

**Tiempo Esperado**: N/A (validación de UI)

---

## 13. Flujos Complejos (E2E)

### Caso 13.1: Flujo Completo - Generación → Modificación → Adición
**Estado**: ⏸️ Pendiente

**Pasos**:
1. **Generación inicial**:
   ```
   Crea 10 preguntas sobre historia de México
   ```
   - Validar: 10 preguntas (q1-q10)

2. **Modificación**:
   ```
   Cambia la pregunta 5 para que sea más fácil
   ```
   - Validar: q5 modificada, resto intacto

3. **Adición**:
   ```
   Agrega 3 preguntas sobre la Revolución Mexicana
   ```
   - Validar: 13 preguntas totales (q1-q13), últimas 3 sobre Revolución

**Resultado Esperado**:
- ✅ Examen final con 13 preguntas
- ✅ Todas las modificaciones aplicadas correctamente
- ✅ IDs secuenciales sin gaps

**Validación**:
- [ ] 13 preguntas totales
- [ ] q5 modificada (fácil)
- [ ] q11-q13 sobre Revolución Mexicana
- [ ] IDs q1-q13

**Tiempo Esperado Total**: < 60 segundos

---

### Caso 13.2: Flujo con Regeneración y Eliminación
**Estado**: ⏸️ Pendiente

**Pasos**:
1. **Generación**:
   ```
   15 preguntas sobre ciencias naturales
   ```
   - Validar: 15 preguntas

2. **Regeneración**:
   ```
   Regenera las preguntas 7 y 12
   ```
   - Validar: q7 y q12 con contenido nuevo

3. **Eliminación**:
   ```
   Elimina la pregunta 10
   ```
   - Validar: 14 preguntas (q1-q14), IDs renormalizados

**Resultado Esperado**:
- ✅ 14 preguntas finales
- ✅ q7 y q12 originales regeneradas (ahora q7 y q11 tras eliminación)
- ✅ IDs secuenciales

**Validación**:
- [ ] 14 preguntas totales
- [ ] q7 y q11 (ex-q12) regeneradas
- [ ] IDs q1-q14

**Tiempo Esperado Total**: < 50 segundos

---

## Matriz de Cobertura

| Categoría | Casos | Completados | Pendientes |
|-----------|-------|-------------|------------|
| Generación Inicial | 6 | 0 | 6 |
| Adición de Preguntas | 3 | 0 | 3 |
| Modificación de Preguntas | 5 | 0 | 5 |
| Eliminación de Preguntas | 3 | 0 | 3 |
| Regeneración | 2 | 0 | 2 |
| Cambios de Dificultad | 2 | 0 | 2 |
| Distribución de Tópicos | 2 | 0 | 2 |
| Manejo de Duplicados | 1 | 0 | 1 |
| Upload de Documentos | 2 | 0 | 2 |
| Casos de Error | 4 | 0 | 4 |
| Límites y Edge Cases | 4 | 0 | 4 |
| Performance y Feedback | 4 | 0 | 4 |
| Flujos Complejos | 2 | 0 | 2 |
| **TOTAL** | **40** | **0** | **40** |

---

## Instrucciones de Ejecución

### Setup Inicial
1. Activar feature flag:
   ```bash
   # .env.local
   AI_CHAT_MASTRA=true
   ```
2. Reiniciar servidor dev
3. Limpiar localStorage si hay datos previos
4. Abrir DevTools para monitorear logs

### Ejecución de Casos
Para cada caso:
1. ✅ Leer descripción y contexto
2. ✅ Ejecutar setup si es necesario
3. ✅ Ingresar prompt exacto
4. ✅ Observar feedback en tiempo real
5. ✅ Validar resultado según checklist
6. ✅ Verificar tiempo de ejecución
7. ✅ Marcar caso como completado o reportar bug
8. ✅ Limpiar estado para siguiente caso (si es necesario)

### Reportar Bugs
Si un caso falla:
```markdown
## Bug Report - [Caso X.Y]
**Fecha**: YYYY-MM-DD
**Estado**: ❌ Fallido

**Comportamiento Esperado**:
- [Descripción]

**Comportamiento Actual**:
- [Descripción]

**Logs**:
```
[Logs relevantes]
```

**Screenshots**: [Si aplica]

**Reproducción**:
1. [Pasos]
2. ...

**Prioridad**: Alta / Media / Baja
```

---

## Métricas de Éxito

### Criterios de Aceptación Global
- [ ] ≥ 95% de casos pasando (38/40)
- [ ] 0 casos críticos fallando
- [ ] Performance dentro de targets
- [ ] Feedback de progreso funcional en todos los casos
- [ ] Sin crashes ni pérdida de datos
- [ ] Duplicados detectados y removidos automáticamente
- [ ] Manejo de errores graceful en todos los casos

### Targets de Performance
- Generación 5 preguntas: < 15s
- Generación 10 preguntas: < 25s
- Generación 20 preguntas: < 40s
- Generación 40 preguntas: < 80s
- Modificación individual: < 8s
- Adición 3 preguntas: < 12s

---

## Notas Finales

### Datos Sintéticos
- Usar temas variados para cada test
- No reutilizar mismo prompt para múltiples casos
- Documentar cualquier patrón de error recurrente

### Testing Manual vs Automatizado
- Este documento es para testing manual desde UI
- Para automatización, considerar:
  - Playwright para E2E
  - Jest para unit tests de tools
  - k6 para load testing

### Próximos Pasos
1. Ejecutar todos los casos de Generación Inicial (Casos 1.1-1.6)
2. Validar Adición (Casos 2.1-2.3)
3. Validar Modificación (Casos 3.1-3.5)
4. Continuar con resto de categorías
5. Ejecutar Flujos Complejos (Casos 13.1-13.2)
6. Análisis final y reporte

---

**Última Actualización**: 2025-11-21
**Mantenedor**: Equipo ProfeVision
**Branch**: `feature/ai-chat-mastra`
