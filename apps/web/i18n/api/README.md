# i18n para API (Respuestas del servidor)

Este módulo provee internacionalización para mensajes de respuestas de la API (errores/estados) usando archivos JSON por ruta/namespace. El objetivo es:

- Mantener archivos pequeños y cercanos a cada endpoint (menos tokens y edición más simple).
- Evitar prefijos de idioma en `/api`; el idioma se resuelve vía query o headers.

## Cómo funciona

- Utilidad principal: `getApiTranslator(request, namespace)` en `i18n/api/index.ts`.
- Resolución de locale (en orden):
  1) Query param `?locale=es|en`
  2) Headers `x-next-intl-locale` o `x-locale`
  3) `Accept-Language`
  4) Fallback: `es`

- Carga de mensajes: `i18n/api/locales/{locale}/{namespace}.json`.
- Acceso a mensajes: `t('errors.algo')`, `t('success.algo')`.

## Convención de nombres (namespace)

Usa el path del endpoint como namespace, con `"/"` → `"."` y segmentos dinámicos como nombres literales:

- `/api/exams/[id]/details` → `exams.details`
- `/api/exams/[id]/update-answer` → `exams.id.update-answer`
- `/api/exams/check-duplicate` → `exams.check-duplicate`
- `/api/groups/[id]/grading-scheme` → `groups.id.grading-scheme`

Archivos esperados (por idioma):

```
i18n/api/locales/es/<namespace>.json
i18n/api/locales/en/<namespace>.json
```

Estructura recomendada:

```json
{
  "errors": {
    "internal": "...",
    "serverConfig": "...",
    "unauthorized": "...",
    "validationKey": "..."
  },
  "success": {
    "ok": "..."
  }
}
```

## Uso en un endpoint

```ts
import { getApiTranslator } from '@/i18n/api';

export async function GET(request: NextRequest) {
  const { t, locale } = await getApiTranslator(request, 'exams.details');

  // ... lógica ...
  return NextResponse.json({ error: t('errors.notFound') }, { status: 404 });
}
```

Sugerencias:
- Llama a `getApiTranslator` una vez por handler (por performance/claridad).
- Usa `t('errors.algo')` para errores y `t('success.algo')` para mensajes de éxito.
- `t` acepta un fallback opcional: `t('errors.x', 'Mensaje por defecto')`.

## Añadir un nuevo endpoint con i18n

1) Define el `namespace` siguiendo la convención.
2) Crea los JSON:
   - `i18n/api/locales/es/<namespace>.json`
   - `i18n/api/locales/en/<namespace>.json`
3) En el handler, importa y usa `getApiTranslator(request, '<namespace>')`.
4) Reemplaza strings literales por `t('errors.*')`/`t('success.*')`.
5) Prueba con `curl`:

```bash
# Forzar EN por query
curl -i "http://localhost:3000/api/...?...&locale=en"

# Forzar EN por header
curl -i -H "x-next-intl-locale: en" "http://localhost:3000/api/..."
```

## Buenas prácticas

- Mantén mensajes cortos, consistentes y específicos por ruta.
- Reutiliza claves comunes (`internal`, `serverConfig`, `unauthorized`).
- No traduzcas payloads de datos (solo mensajes).
- Evita depender del prefijo de idioma en `/api`.


