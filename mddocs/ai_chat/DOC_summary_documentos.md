# Especificación: Summary de Documentos

Objetivo: generar resúmenes fieles y útiles de uno o más documentos cargados, con opción de granularidad (global, por sección, por selección).

## Requisitos funcionales

- Entrada: `documentId` y/o texto, parámetros de objetivo (longitud, estilo, idioma), y alcance (global/sección).
- Salida: objeto JSON con el resumen y metadatos de cobertura.
- Extracción de texto barata y efímera vía un endpoint unificado (sin DB): `POST /api/documents/extract` (multipart/form-data) que devuelve texto plano procesado.

## Subida y extracción de documentos (efímero, sin DB)

- Endpoint: `POST /api/documents/extract` (runtime Node.js)
- Entrada: `file` (PDF, DOC, DOCX) en form-data. Tamaño máx. sugerido: 10MB.
- Implementación:
  - DOC/DOCX: usar `mammoth` para extraer texto (sin LLM).
  - PDF: usar `pdf-parse` para extraer texto (sin LLM). Asegurar que el handler corra en runtime Node.js.
  - No guardar archivos ni texto en servidor (proceso efímero, solo respuesta HTTP).
- Respuesta:
  ```json
  {
    "text": "...contenido extraído...",
    "meta": { "mime": "application/pdf", "fileName": "nombre.pdf", "length": 12345 }
  }
  ```
- Persistencia: solo en navegador (IndexedDB/localStorage) usando utilidades como `saveDocument(documentId, { text, meta })` y `saveLastDocumentContext({ documentId })`.

## Contrato de salida

```json
{
  "summary": {
    "documentId": "string",
    "language": "string",
    "granularity": "global|section|selection",
    "targetLength": "short|medium|long",
    "content": "string",
    "bullets": ["string"],
    "coverage": {
      "sections": [
        { "title": "string", "spans": [{ "start": number, "end": number }] }
      ],
      "percentage": number
    }
  }
}
```

## Endpoint server: `app/api/summary/route.ts`

- Método: POST
- Body esperado:

```json
{
  "documentId": "string",
  "language": "es|en|...",
  "granularity": "global|section|selection",
  "targetLength": "short|medium|long",
  "selectionSpans": [{ "start": 0, "end": 5000 }]
}
```

- Flujo:
  1) Usar `text` provisto en el body (no se resuelve `documentId` en servidor en esta fase).
  2) Preprocesar con utilidades en `app/lib/document-processor/` (limpieza, chunking opcional).
  3) Llamar LLM con contrato estricto para el resumen.
  4) Validar contrato y responder (stream opcional para UX).

## Prompting (guía)

- Pedir un párrafo principal + bullets clave.
- Forzar concisión y fidelidad (no alucinar; si falta contexto, notificarlo explícitamente).
- Respetar idioma solicitado.
- Si existe selección, limitarse a esa selección.

## UI/UX

- Mostrar estado de procesamiento en `BackgroundProcessingStatus.tsx` u otro indicador.
- Vista previa con alternancia "Párrafo" / "Bullets".
- Botón de copiar / exportar.
- En `DocumentContextBar` agregar subida de archivo: tras llamar a `/api/documents/extract`, guardar `text` en IndexedDB con un `documentId` local (por ejemplo, `local:{uuid}`) y persistir el `documentId` con `saveLastDocumentContext()`.
- Para solicitudes a `/api/summary`, enviar `text` directamente en el body (el servidor no resolverá `documentId`).

## Métricas y límites

- Tamaño máximo de texto por request (p.ej. ~50k caracteres, configurable).
- Truncar o resumir por chunks si excede el límite; combinar luego los resúmenes parciales.

## Validación de esquema (JSON Schema)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["summary"],
  "properties": {
    "summary": {
      "type": "object",
      "required": [
        "documentId",
        "language",
        "granularity",
        "targetLength",
        "content",
        "bullets",
        "coverage"
      ],
      "properties": {
        "documentId": { "type": ["string", "null"] },
        "language": { "type": "string" },
        "granularity": {
          "type": "string",
          "enum": ["global", "section", "selection"]
        },
        "targetLength": {
          "type": "string",
          "enum": ["short", "medium", "long"]
        },
        "content": { "type": "string", "minLength": 1 },
        "bullets": {
          "type": "array",
          "items": { "type": "string" },
          "maxItems": 10
        },
        "coverage": {
          "type": "object",
          "required": ["sections", "percentage"],
          "properties": {
            "sections": {
              "type": "array",
              "items": {
                "type": "object",
                "required": ["title", "spans"],
                "properties": {
                  "title": { "type": "string" },
                  "spans": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "required": ["start", "end"],
                      "properties": {
                        "start": { "type": "number", "minimum": 0 },
                        "end": { "type": "number", "minimum": 0 }
                      }
                    }
                  }
                }
              }
            },
            "percentage": { "type": "number", "minimum": 0, "maximum": 100 }
          }
        }
      }
    }
  }
}
```

## Mapeo de targetLength a tokens/longitud

- short: ~120-180 palabras (~800-1,000 caracteres / ~150-220 tokens)
- medium: ~250-350 palabras (~1,600-2,200 caracteres / ~300-450 tokens)
- long: ~500-700 palabras (~3,200-4,800 caracteres / ~650-900 tokens)

Usar límites estrictos en el prompt + post-recorte suave preservando frases completas.

## Estrategia de chunking y fusión

1. Preprocesar (`normalizeWhitespace`, remover headers/footers repetidos).
2. Chunking por límites semánticos (secciones, párrafos) o tamaño fijo (p.ej. ~2k-3k chars) en `app/lib/document-processor/`.
3. Resumen por chunk con el mismo contrato (marcar `coverage.sections` por índice o título si disponible).
4. Fusión: generar meta-resumen a partir de bullets de cada chunk; unificar y deduplicar bullets, mantener trazabilidad de cobertura.
5. Si `granularity=selection`, limitar chunking a los spans provistos.

## Streaming y UX

- Soportar streaming desde el LLM; render incremental del párrafo y luego bullets.
- Indicadores en `app/components/BackgroundProcessingStatus.tsx`.
- Cancelación: permitir abortar request y limpiar progreso.

## Persistencia y cacheo

- Cache en memoria por `documentId+granularity+targetLength+language+selectionSpans`.
- TTL configurable; invalidar si cambia el contenido del documento (hash de texto base).
- Opción de guardar resultado en IndexedDB/localStorage si aplica (ver `DOC_persistencia_browser.md`).

## Seguridad y privacidad

- No registrar texto completo en logs; solo hashes/estadísticas.
- Sanitizar entrada (control de tamaño, caracteres de control).
- Restringir dominios de llamada si se usa proveedor externo.

## Ejemplos de prompts (LLM)

```
Eres un asistente que resume textos con alta fidelidad. Responde SOLO en JSON válido siguiendo este contrato:
{ ...contrato mostrado arriba... }

Parámetros:
- idioma: "es"
- granularidad: "global"
- targetLength: "medium"

Instrucciones:
1) No inventes información. 2) Si faltan datos, indica "coverage.percentage" < 100 y refleja la duda en bullets. 3) Mantén coherencia del idioma.

Texto a resumir:
"""
...contenido...
"""
```

## Observabilidad y métricas

- Latencia total, latencia de extracción, tokens consumidos, porcentaje de cobertura.
- Ratio de éxito de validación JSON y errores por tipo.

## Pruebas

- Unit: validación de esquema, fusión de chunks, recorte por `targetLength`.
- Integración: flujo end-to-end desde `documentId` (PDF y DOCX), selección por spans.
- E2E: interfaz de usuario, streaming y cancelación.

## Errores y manejo

- Documento no encontrado: 404.
- Selección fuera de rango: 400 con spans válidos.
- JSON inválido: 422 y sugerencia de reintento con menor `targetLength`.
