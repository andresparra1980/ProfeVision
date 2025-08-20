# Overview del Sistema de Generación de Exámenes por IA

Este documento describe la visión general, arquitectura y lineamientos para integrar un sistema de generación de exámenes por IA dentro de esta web app (Next.js + TypeScript) usando Vercel AI SDK, con capacidades de:

- Generación de preguntas por chat.
- Resumen (summary) de documentos subidos.
- Persistencia en el navegador para estado de UI y datos intermedios.

Se busca que el contenido de estos documentos alimente un LLM dentro del contexto real del proyecto.

## Arquitectura propuesta (alto nivel)

- UI (client):
  - Componentes React en `app/components/` para chat, visor de documento y ajustes.
  - Hooks en `app/lib/hooks/` para estado, efectos y persistencia.
  - Vercel AI SDK (cliente) con `useChat` (o equivalente) para la experiencia conversacional.
- API (server):
  - Rutas Next.js en `app/api/`:
    - `app/api/chat/` para generación de preguntas por IA.
    - `app/api/summary/` para resumen de documentos.
    - `app/api/extract-pdf/` y `app/api/extract-docx/` ya existen para extraer texto.
- Procesamiento de documentos:
  - Utilidades en `app/lib/document-processor/` para limpieza, chunking y normalización de texto.
- Persistencia en navegador:
  - Almacenamiento ligero en `localStorage` (estado de UI, settings, prompts, últimas sesiones).
  - Almacenamiento pesado en `IndexedDB` (chunks de documentos, historiales largos) si aplica.

## Flujo principal

1. Usuario carga uno o varios documentos (PDF/DOCX).
2. Backend extrae texto con `app/api/extract-pdf/` o `app/api/extract-docx/`.
3. UI muestra estado de contexto de documento (ver `DocumentContextBar.tsx`, `DocumentContextIndicator.tsx`).
4. Usuario abre el chat y solicita generar preguntas (objetivo: JSON estructurado con ítems de evaluación).
5. Opcional: el usuario solicita un resumen del documento o sección.
6. Persistencia guarda estado, borradores y resultados.

## Consideraciones de seguridad

- No almacenar claves privadas en el cliente. Usar variables de entorno en el server (`.env.local`) para proveedores de LLM.
- Sanitizar entradas de usuario y validar outputs del modelo (schema JSON/Zod del lado server).
- Aplicar límites de tamaño de archivo y páginas en extracción.
- Rate limiting en endpoints de IA para evitar abuso.

## Rendimiento y costos

- Chunking de documentos para prompts contextuales.
- Controlar el tamaño del prompt (tokens) y usar resúmenes intermedios.
- Streaming de respuestas para mejor UX.

## Observabilidad

- Logging básico en server (inicio/fin de request, tiempos, conteo aproximado de tokens).
- Identificadores de sesión en el cliente para correlación.

## Archivos relacionados

- Generación de preguntas: `DOC_preguntas_ia.md`.
- Summary de documentos: `DOC_summary_documentos.md`.
- Persistencia en navegador: `DOC_persistencia_browser.md`.
