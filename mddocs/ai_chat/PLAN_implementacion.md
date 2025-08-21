# Plan de Implementación — Sistema de Generación de Exámenes por IA (Chat)

## Objetivo
Implementar una experiencia de chat para que docentes generen bancos de preguntas y resúmenes de documentos con IA, con validación estricta de contratos JSON, streaming, persistencia en navegador y compatibilidad con el esquema interno de ProfeVision.

## Alcance y entregables
- UI de chat en `app/[locale]/dashboard/exams/ai-exams-creation-chat/`:
  - `page.tsx`, `components/ChatPanel.tsx`, `components/SettingsPanel.tsx`, `components/DocumentContextBar.tsx`, `components/ResultsView.tsx`.
- Endpoints server:
  - `app/api/chat/route.ts`: generación de preguntas vía chat (streaming, validación Zod).
  - `app/api/summary/route.ts`: resumen de documentos (streaming, validación Zod).
- Utilidades:
  - `lib/document-processor/`: `cleanText`, `chunkText`, utilidades de normalización/contado aprox. de tokens.
  - `lib/ai/convert.ts`: conversor JSON IA -> estructuras internas (examen/preguntas/opciones).
  - `lib/persistence/browser.ts`: persistencia en `localStorage`/`IndexedDB`.
- Integración y exportación:
  - Persistir configuraciones, sesiones y resultados.
  - Exportar JSON/CSV desde `ResultsView`.
  - Botón para continuar al flujo de creación de examen con datos prellenados.

## Dependencias y variables de entorno
- Dependencias nuevas:
  - `ai` (Vercel AI SDK) y `@ai-sdk/openai` para streaming y compatibilidad.
- Variables en `.env.local` (server-only; nunca exponer claves en cliente):
  - `OPENROUTER_API_KEY` (ya existente).
  - `OPENAI_MODEL`, `OPENAI_FALLBACK_MODEL` (ya existentes; default sugerido: `google/gemini-2.5-flash-lite` vía OpenRouter).
  - Opcional: `AI_BASE_URL=https://openrouter.ai/api/v1`.

## Arquitectura (resumen)
- UI (cliente): Next.js + TypeScript con Vercel AI SDK (`useChat`), componentes en la ruta indicada.
- Server/API: Rutas en `app/api/chat` y `app/api/summary` con streaming y validación Zod.
- Procesamiento de documentos: utilidades en `lib/document-processor/`.
- Persistencia en navegador: `localStorage` e `IndexedDB` (ver especificación).

## Contratos y especificaciones
- Generación de preguntas: ver `mddocs/ai_chat/DOC_preguntas_ia.md`.
  - Respuesta esperada: objeto `exam` con `questions[]` donde cada ítem incluye `type`, `prompt`, `options`, `answer`, `rationale`, `difficulty`, `taxonomy`, `tags`, `source`.
  - Validación en server con Zod; retornar 400/422 con detalles cuando corresponda.
- Resumen de documentos: ver `mddocs/ai_chat/DOC_summary_documentos.md`.
  - Respuesta esperada: objeto `summary` con `content`, `bullets`, `coverage`.
- Persistencia en navegador: ver `mddocs/ai_chat/DOC_persistencia_browser.md`.

## Reglas de calidad (OBLIGATORIAS)
- Linting:
  - Ejecutar `yarn lint` y corregir todos los errores antes de commit/merge.
  - No introducir nuevos warnings. Si existen warnings inevitables, justificarlos en el PR y aplicar `eslint-disable` de forma localizada y documentada.
  - Seguir guías en `mddocs/CODE_STYLE.md` y `mddocs/CODE_QUALITY.md`.
- Logging/Debug:
  - Usar el helper `lib/utils/logger.ts` para toda la instrumentación (no usar `console.log`).
  - En server: `logger.api()` para eventos de endpoint, `logger.log()` para información, `logger.error()` para errores y `logger.perf()` para tiempos y métricas.
  - Sanitizar datos sensibles, respetar el comportamiento de producción del logger.

## Fases y tareas
1) Infraestructura IA y endpoints
   - Instalar `ai` y `@ai-sdk/openai`.
   - Implementar `app/api/chat/route.ts` (POST) con body: `messages[]` + `context` (idioma, numQuestions, tipos, dificultad, taxonomy, documentId opcional). Streaming + validación Zod del contrato de preguntas. Autenticación opcional (patrón `exams/questions/generate`). Rate limit básico y límites (`numQuestions` ≤ 50).
   - Implementar `app/api/summary/route.ts` (POST) con body por `DOC_summary_documentos.md`. Resolver texto por `documentId` (o integrar con flujos existentes), aplicar preprocesamiento, streaming + validación Zod.
2) Utilidades de documentos y conversores
   - `cleanText`, `chunkText`, normalización y conteo de tokens aprox.
   - `fromAIExamToInternal(examJson)` -> mapeo a tablas internas (`examenes`, `preguntas`, `opciones_respuesta`), tipos (`opcion_multiple`, `verdadero_falso`, `seleccion_multiple`).
3) Persistencia en navegador
   - `lib/persistence/browser.ts`: claves `pv.settings.v1`, `pv.chat.sessions.v1`, `pv.docs.v1`, `pv.outputs.v1`; debounce escrituras; manejo de cuota y errores.
4) UI de Chat y flujo
   - `page.tsx` con layout.
   - `ChatPanel` con `useChat` (streaming) y envío de `context` desde `SettingsPanel`.
   - `DocumentContextBar` para indicar documento/contexto activo.
   - `ResultsView` para visualizar/validar resultados, exportar JSON/CSV, continuar al flujo de creación.
5) Observabilidad, límites y pulido
   - Métricas de tiempos, tamaño de prompts, conteo tokens (aprox.).
   - Manejo de errores comunes (JSON inválido, timeouts, respuesta vacía) con códigos 4xx/5xx apropiados.

## Criterios de aceptación
- Endpoints devuelven stream y validan esquema; errores descriptivos en fallas.
- UI muestra progreso, permite configurar parámetros y persiste estado/sesiones/resultados.
- Conversión a estructura interna usable por el flujo de creación de exámenes.
- `yarn build` y `yarn lint` sin errores; sin warnings nuevos.
- Logs consistentes vía `lib/utils/logger.ts`.

## Riesgos y mitigaciones
- JSON inválido del modelo: reparación automática/2do intento; si falla, 422 con guía.
- Contexto extenso: chunking/resúmenes parciales y combinación posterior.
- Costos/latencias: control de tokens, modelos rápidos por defecto, streaming para UX.

## Checklist de PR
- [ ] Endpoints `/api/chat` y `/api/summary` con Zod + streaming + tests básicos.
- [ ] Utilidades `document-processor` y `ai/convert`.
- [ ] UI `ai-exams-creation-chat` completa con persistencia.
- [ ] Exportación JSON/CSV y navegación al flujo de creación.
- [ ] `yarn lint` sin errores y sin warnings nuevos.
- [ ] Logs usando `lib/utils/logger.ts`.
- [ ] Actualización de `.env.local.example` documentada.
