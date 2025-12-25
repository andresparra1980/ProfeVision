# Traducción a Francés y Portugués Brasileño - ProfeVision

**Estado:** Plan completado y documentado  
**Fecha:** Diciembre 25, 2025  
**Versión:** 1.0

---

## 📚 Documentación Disponible

Este directorio contiene toda la documentación necesaria para agregar soporte de Francés (FR) y Portugués Brasileño (PT-BR) a ProfeVision.

### 📋 PLAN.md
**Documento principal de planificación**

Contiene:
- ✅ Análisis actual del sistema i18n
- ✅ 6 fases de ejecución detalladas (Infraestructura → Traducción → Testing → Deploy)
- ✅ Arquitectura escalable a 12+ idiomas (Route Mapper pattern)
- ✅ Timeline estimado: 39-58.5 horas
- ✅ Checklist completo de ejecución
- ✅ Guía para agregar futuros idiomas

**Cuándo usar:** Para entender el plan general, timeline y arquitectura.

---

### 🔧 TECHNICAL_IMPLEMENTATION.md
**Guía técnica paso-a-paso con código**

Contiene:
- ✅ Ejemplos de código para cada cambio
- ✅ Instrucciones precisas para Fases 1.1 → 1.6
- ✅ Cómo crear `route-mapper.ts` (generador de mapeos)
- ✅ Cómo actualizar `language-switcher-dropdown.tsx`
- ✅ Tabla de traducciones de rutas comunes
- ✅ Scripts template para traducción automática
- ✅ Checklist de testing Fase 1

**Cuándo usar:** Durante la implementación para referencia de código y detalles técnicos.

---

## 🎯 Resumen Rápido

### Idiomas a Agregar
- **FR** - Français (Francés estándar)
- **PT** - Português (Brasil)

### Archivos a Crear/Modificar
```
Fase 1 (Infraestructura):  6 archivos
Fase 2 (UI Translations):  36 archivos JSON (fr + pt)
Fase 3 (API Translations): 44 archivos JSON (fr + pt)
Fase 4 (Docs):             ~30 archivos MDX (fr + pt)
────────────────────────────────────────────
TOTAL:                     ~120 archivos nuevos + 6 modificados
```

### Timeline
```
Fase 1 (Infraestructura):  1.5-2.5 horas
Fase 2-4 (Traducción IA):  30-45 horas
Fase 5-6 (Testing+Deploy): 7-11 horas
──────────────────────────────────
TOTAL:                     39-58.5 horas
```

---

## 🏗️ Arquitectura Clave

### Single Source of Truth (SoT)
**`routing.ts`** es la única fuente de verdad para todas las traducciones de rutas.

```
routing.ts (SoT)
    ↓
    ├→ next-intl (para routing)
    └→ route-mapper.ts (para language switcher)
        └→ language-switcher-dropdown.tsx (consumidor)
```

### Route Mapper Pattern
- **Archivo nuevo:** `apps/web/i18n/route-mapper.ts`
- **Propósito:** Generar mapeos dinámicamente desde routing.ts
- **Ventaja:** CERO redundancia, escalable a 50+ idiomas
- **Impacto:** Solo hay que actualizar routing.ts, el mapper funciona automáticamente

---

## ✨ Beneficios de Esta Arquitectura

| Aspecto | Beneficio |
|---------|-----------|
| **Single Source of Truth** | Cambiar una ruta = 1 lugar (vs 12+ en matriz N×N) |
| **Cero Redundancia** | No se duplica información de rutas |
| **Escalabilidad** | Agregar idioma #10, #20 = solo actualizar routing.ts |
| **Type Safety** | TypeScript verifica que todas las locales tengan rutas |
| **Performance** | O(1) route lookup, mapeos generados bajo demanda |
| **Professional** | Estándar usado por Figma, Linear, Vercel, Supabase |

---

## 🚀 Cómo Comenzar

### 1. Leer el Plan
```
Abre PLAN.md y lee secciones:
- Análisis Actual
- Fases de Ejecución (1-6)
- Arquitectura de Escalabilidad
```

### 2. Revisar Detalles Técnicos
```
Abre TECHNICAL_IMPLEMENTATION.md y revisa:
- Fase 1.1 → 1.6 (cambios de código)
- Testing checklist
- Scripts de traducción
```

### 3. Ejecutar Fase 1
```
Seguir TECHNICAL_IMPLEMENTATION.md paso-a-paso:
1. Actualizar config.ts
2. Expandir routing.ts
3. Crear route-mapper.ts
4. Actualizar language-switcher
5. Actualizar middlewares
6. Test local
```

### 4. Traducir Archivos (Fases 2-4)
```
Usar IA para traducir en paralelo:
- Fase 2: 36 JSONs (UI)
- Fase 3: 44 JSONs (API)
- Fase 4: ~30 MDX (Docs)
```

### 5. Testing y Deploy (Fases 5-6)
```
- Validar integridad de todas las traducciones
- Testing en staging
- Deploy a producción
```

---

## 📊 Comparativa de Arquitecturas Evaluadas

| Aspecto | Hub-and-Spoke | Matriz N×N | Route Mapper ✅ |
|---------|---|---|---|
| Redundancia con 12 idiomas | Redirecciones | 132 mapeos | 0 |
| Código a mantener | 30-50 líneas | 500+ líneas | 50-100 líneas |
| SoT (Source of Truth) | No | No | Sí |
| Escalable a 12+ idiomas | No | No | Sí |
| Tiempo agregar idioma #5 | 2-3h | 5-6h | 30 minutos |

**Conclusión:** Route Mapper es el estándar profesional para múltiples idiomas.

---

## 🔮 Preparación para Futuros Idiomas

Una vez completadas estas 6 fases, agregar un nuevo idioma (Ej: Italiano) será:

```
1. Actualizar config.ts: Agregar it: 'Italiano'
2. Actualizar routing.ts: Agregar IT a cada pathname
3. Crear carpetas: mkdir apps/web/i18n/locales/it
4. Traducir archivos con IA
5. Listo. Route mapper y language switcher funcionan automáticamente.

Tiempo estimado por idioma adicional: ~35-45 horas (solo traducción)
```

---

## 📁 Estructura de Directorios Resultante

```
apps/web/i18n/
├── config.ts                    ← Actualizado (agregar FR/PT)
├── routing.ts                   ← Actualizado (expandir pathnames)
├── route-mapper.ts              ← NUEVO (generador de mapeos)
├── request.ts
├── navigation.ts
├── locales/
│   ├── es/                      (18 archivos JSON)
│   ├── en/                      (18 archivos JSON)
│   ├── fr/                      ← NUEVO (18 archivos JSON)
│   └── pt/                      ← NUEVO (18 archivos JSON)
└── api/
    ├── locales/
    │   ├── es/                  (22 archivos JSON)
    │   ├── en/                  (22 archivos JSON)
    │   ├── fr/                  ← NUEVO (22 archivos JSON)
    │   └── pt/                  ← NUEVO (22 archivos JSON)
    ├── config.ts
    └── index.ts

apps/docs/
└── content/docs/
    ├── *.mdx                    (Español)
    ├── *.en.mdx                 (English)
    ├── *.fr.mdx                 ← NUEVO (Français)
    └── *.pt.mdx                 ← NUEVO (Português)

apps/web/components/shared/
├── language-switcher.tsx        ← Actualizado
└── language-switcher-dropdown.tsx ← Actualizado (usar route-mapper)

apps/web/
└── middleware.ts                ← Actualizado (SUPPORTED_LOCALES)

apps/docs/
└── middleware.ts                ← Actualizado (si aplica)
```

---

## ❓ Preguntas Frecuentes

### ¿Por qué crear route-mapper.ts en lugar de mantener hardcoding?
Porque con 12+ idiomas, mantener mapeos en múltiples lugares cause inconsistencias, bugs y es mantenimiento pesado. Route mapper los genera automáticamente desde la SoT única (routing.ts).

### ¿Cuánto tiempo toma traducir con IA?
Fase 2-4 (traducciones): 30-45 horas con IA. El tiempo se distribuye entre traducción automática + validación de calidad.

### ¿Qué sucede si falta una traducción?
El fallback es:
1. Intenta la traducción solicitada
2. Intenta inglés (EN)
3. Usa la clave sin traducir
El logger mostrará warnings si hay traducciones faltantes.

### ¿Puedo agregar más idiomas después?
Sí. El patrón de Route Mapper está diseñado para escalar a 50+ idiomas sin cambios arquitectónicos. Solo actualiza routing.ts.

---

## 🔗 Referencias Externas

- **next-intl Documentation:** https://next-intl-docs.vercel.app/
- **Route Mapper Pattern:** Usado por Figma, Linear, Vercel (best practice en industria)
- **ProfeVision Codebase:** apps/web/i18n/, apps/web/components/shared/

---

## ✅ Checklist de Referencia Rápida

### Antes de Empezar
- [ ] Crear rama: `git checkout -b feat/add-fr-pt-translation`
- [ ] Leer PLAN.md completamente
- [ ] Revisar TECHNICAL_IMPLEMENTATION.md

### Fase 1 (Infraestructura)
- [ ] Actualizar config.ts
- [ ] Expandir routing.ts (tarea larga)
- [ ] Crear route-mapper.ts
- [ ] Actualizar language-switcher-dropdown.tsx
- [ ] Actualizar middleware.ts
- [ ] Actualizar docs/middleware.ts
- [ ] Crear carpetas (fr, pt)
- [ ] Test local: `pnpm dev`

### Fases 2-4 (Traducción)
- [ ] Traducir 36 JSONs UI (Fase 2)
- [ ] Traducir 44 JSONs API (Fase 3)
- [ ] Traducir ~30 MDX docs (Fase 4)

### Fases 5-6 (Testing + Deploy)
- [ ] Validar integridad JSON/MDX
- [ ] Testing en staging
- [ ] Monitorear en producción

---

## 📧 Contacto / Soporte

Para preguntas sobre el plan o arquitectura:
1. Revisar PLAN.md → Sección "Arquitectura de Escalabilidad"
2. Revisar TECHNICAL_IMPLEMENTATION.md → Ejemplos de código
3. Consultar conversation thread original

---

*Documento de referencia v1.0 - Plan completo y documentado (25 Dec 2025)*
