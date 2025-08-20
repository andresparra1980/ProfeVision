# Especificación: Persistencia en el Navegador

Objetivo: guardar estado de UI, configuraciones y resultados (preguntas, resúmenes) para continuidad de sesión, trabajo offline limitado y mejor UX.

## Almacenamientos

- `localStorage` (rápido, clave-valor, máx ~5-10MB):
  - `pv.settings.v1`: idioma, tema, proveedor/modelo, límites por defecto.
  - `pv.chat.sessions.v1`: índice de sesiones (ids, timestamps, metadata ligera).
  - `pv.lastDocumentContext.v1`: `documentId` y metadatos recientes.
- `IndexedDB` (voluminoso):
  - `pv.docs.v1`: texto/chunks por `documentId`.
  - `pv.outputs.v1`: resultados grandes (exámenes, resúmenes).

## Versionado y migraciones

- Prefijo `pv.*.v{n}` para claves/DB.
- Al cambiar esquema, crear migrador que lea v{n} y escriba v{n+1}.

## API de persistencia (cliente)

- Módulo en `app/lib/hooks/` o `app/lib/` con funciones:
  - `saveSettings(partial)` / `loadSettings()`
  - `saveChatSession(session)` / `listChatSessions()` / `deleteChatSession(id)`
  - `saveDocument(documentId, payload)` / `loadDocument(documentId)`
  - `saveOutput(kind, id, payload)` / `loadOutput(kind, id)`
- Debounce escrituras (200–500ms) para evitar thrashing.
- Manejar quotas y errores (catch + fallback a limpieza selectiva).

## Estructuras sugeridas

```ts
// settings
interface SettingsV1 {
  language: string; // "es", "en"
  theme: "light" | "dark" | "system";
  defaultModel?: string;
  limits?: { maxQuestions?: number; maxTextChars?: number };
}

// chat session metadata (localStorage)
interface ChatSessionIndexItemV1 {
  id: string;
  createdAt: string; // ISO
  title: string;
  documentId?: string;
  tags?: string[];
}
```

## Integración UI

- Al montar el chat, cargar `settings` y la última sesión.
- Guardar automáticamente los resultados al finalizar una generación/resumen.
- Botones de "Exportar" y "Limpiar" con confirmación.

## Privacidad y seguridad

- No guardar datos sensibles sin aviso.
- Permitir limpieza total (“Borrar datos locales”).
- Documentar límite de almacenamiento y posibles pérdidas al limpiar caché del navegador.

## Observabilidad

- Telemetría anónima opcional: conteo de sesiones guardadas, tamaños aproximados (sin contenido).
