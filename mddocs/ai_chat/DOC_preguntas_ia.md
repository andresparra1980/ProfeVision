# Especificación: Generación de Preguntas por IA (Vercel AI SDK)

Objetivo: permitir que el usuario, vía chat, genere bancos de preguntas a partir de instrucciones y opcionalmente con contexto de documentos previamente cargados.

## Requisitos funcionales

- Entrada: mensaje del usuario indicando el tema, nivel, formato, número de preguntas y criterios (ej: taxonomía Bloom, dificultad).
- Contexto opcional: texto extraído de documentos y/o metadatos (fuente, secciones).
- Salida: objeto JSON estructurado con una lista de preguntas y sus atributos.
- Modo streaming en UI para mostrar progreso.

## Contrato de salida (servidor)

```json
{
  "exam": {
    "title": "string",
    "subject": "string",
    "level": "string",
    "language": "string",
    "questions": [
      {
        "id": "string",
        "type": "multiple_choice|true_false|short_answer|essay",
        "prompt": "string",
        "options": ["string"],
        "answer": "string|number|boolean|array",
        "rationale": "string",
        "difficulty": "easy|medium|hard",
        "taxonomy": "remember|understand|apply|analyze|evaluate|create",
        "tags": ["string"],
        "source": {
          "documentId": "string|null",
          "spans": [{ "start": number, "end": number }]
        }
      }
    ]
  }
}
```

- Validar este contrato en server antes de retornar al cliente. En caso de error, retornar 400 con detalles.

## Endpoint server: `app/api/chat/route.ts`

- Método: POST
- Body esperado:

```json
{
  "messages": [ { "role": "user|system|assistant", "content": "string" } ],
  "context": {
    "documentId": "string|null",
    "language": "es|en|...",
    "numQuestions": 10,
    "questionTypes": ["multiple_choice", "short_answer"],
    "difficulty": "mixed",
    "taxonomy": ["apply", "analyze"]
  }
}
```

- Respuesta: stream de texto o stream NDJSON con eventos. Al finalizar, el server intenta parsear y validar el JSON completo bajo el contrato.

## Prompting (guía)

- Incluir instrucciones claras para producir JSON válido, sin comentarios, sin texto adicional.
- Forzar idioma de salida.
- Explicar el nivel educativo, formato, longitud de prompts y opciones.
- Si hay contexto de documento, incluir fragmentos relevantes y pedir citar spans.

Ejemplo de sistema (resumen):

```
Eres un generador de exámenes. Devuelves exclusivamente JSON válido ajustado al contrato acordado. Mantén consistencia de idioma y nivel. Incluye racionales breves.
```

Ejemplo de usuario:

```
Tema: Derivadas básicas
Nivel: Secundaria
Formato: 6 preguntas (4 selección múltiple, 2 respuesta corta)
Dificultad: mixta
Idioma: es
Contexto: [fragmentos de documento]
```

## Cliente (UI) con Vercel AI SDK

- Hook `useChat` (o equivalente) para manejar mensajes y streaming.
- Mostrar un panel de configuración (número, tipo, nivel, idioma) y un botón "Generar".
- Al finalizar, persistir el resultado en navegador y permitir exportar (JSON/CSV).

## Validación y post-procesado

- En server: validación de esquema (Zod u otra) y normalización de tipos.
- En client: realzar errores de validación y permitir reintento.
- De-dup de preguntas similares si el usuario genera varias rondas.

## Métricas y límites

- Limitar `numQuestions` (p.ej. máx 50 por solicitud).
- Truncar contexto > N tokens usando resúmenes parciales.
- Registrar tiempos, conteo aproximado de tokens y tamaño de payload.

## Errores comunes y manejo

- JSON inválido: intentar reparación automática y si falla, devolver 422 con indicaciones.
- Respuesta vacía del modelo: reintentar con temperatura menor o prompt fallback.
- Timeout: devolver 504 con recomendación de reducir tamaño del contexto.
