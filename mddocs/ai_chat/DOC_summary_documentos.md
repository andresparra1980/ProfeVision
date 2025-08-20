# Especificación: Summary de Documentos

Objetivo: generar resúmenes fieles y útiles de uno o más documentos cargados, con opción de granularidad (global, por sección, por selección).

## Requisitos funcionales

- Entrada: `documentId` y/o texto, parámetros de objetivo (longitud, estilo, idioma), y alcance (global/sección).
- Salida: objeto JSON con el resumen y metadatos de cobertura.
- Debe poder consumir los endpoints existentes de extracción (`app/api/extract-pdf/`, `app/api/extract-docx/`).

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
  1) Resolver texto desde `documentId` usando resultados de `extract-*`.
  2) Preprocesar con utilidades en `app/lib/document-processor/` (limpieza, chunking opcional).
  3) Llamar LLM vía SDK con prompt que pida estructura estricta.
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

## Métricas y límites

- Tamaño máximo de texto por request (p.ej. ~50k caracteres, configurable).
- Truncar o resumir por chunks si excede el límite; combinar luego los resúmenes parciales.

## Errores y manejo

- Documento no encontrado: 404.
- Selección fuera de rango: 400 con spans válidos.
- JSON inválido: 422 y sugerencia de reintento con menor `targetLength`.
