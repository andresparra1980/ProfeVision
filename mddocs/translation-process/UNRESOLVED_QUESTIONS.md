# Preguntas Sin Resolver - Sistema de Traducción

**Fecha:** Diciembre 29, 2025  
**Status:** Requiere decisión antes de implementación completa

---

## 🤔 Preguntas Técnicas

### 1. Translation Memory
**Pregunta:** ¿Implementar sistema de translation memory para reutilizar traducciones?

**Pros:**
- Reducir costos API (no re-traducir textos idénticos)
- Consistencia absoluta en términos repetidos
- Performance mejorado (cache local)

**Contras:**
- Complejidad adicional (DB o file cache)
- Mantenimiento de cache
- Posibles traducciones desactualizadas

**Opciones:**
- A) Implementar con SQLite local
- B) Usar archivos JSON como cache
- C) No implementar (mantener simple)

**Decisión:** ⏸️ Pendiente

---

### 2. Fallback Language
**Pregunta:** ¿Qué idioma usar como fallback cuando traducción no disponible?

**Contexto:**
- Source: Español (es)
- Idiomas disponibles: es, en, fr, pt

**Escenarios:**
```
Usuario pide: DE (alemán) - No existe traducción
Opciones fallback:
A) EN (inglés) - Más universal
B) ES (español) - Source original
C) Detectar desde Accept-Language header
```

**Decisión recomendada:** EN (más universal)

**Decisión final:** ⏸️ Pendiente

---

### 3. Review Humano
**Pregunta:** ¿Implementar proceso de QA humano antes de producción?

**Opciones:**
- A) Sin review - Confiar en IA 100%
- B) Sampling review - Revisar 10% de traducciones
- C) Full review - Revisar todas las traducciones
- D) Community review - Contributors revisan

**Trade-offs:**
| Opción | Tiempo | Costo | Calidad |
|--------|--------|-------|---------|
| A - Sin review | 0h | $0 | ? |
| B - Sampling | 2-3h | $50-100 | ++ |
| C - Full | 20-30h | $500-800 | +++ |
| D - Community | Variable | $0 | ++ |

**Decisión recomendada:** B (Sampling) + D (Community)

**Decisión final:** ⏸️ Pendiente

---

### 4. Versionado de Traducciones
**Pregunta:** ¿Cómo versionar traducciones para rollback?

**Opciones:**
- A) Git tags por idioma (`v1.0-fr`, `v1.0-pt`)
- B) Metadata en JSON (`"_version": "1.0"`)
- C) Directorio por versión (`locales/fr/v1/`, `locales/fr/v2/`)
- D) No versionar (confiar en git history)

**Pros/Contras:**
- Git tags: Simple, familiar, no afecta estructura
- Metadata: Programático, fácil de leer en runtime
- Directorio: Explícito, múltiples versiones en prod
- Sin versión: Más simple, confiar en git

**Decisión recomendada:** A (Git tags)

**Decisión final:** ⏸️ Pendiente

---

## 🌍 Preguntas de Proceso

### 5. Community Contributions
**Pregunta:** ¿Permitir contribuciones de traducciones vía Pull Requests?

**Pros:**
- Gratis (community-driven)
- Native speakers proveen mejor calidad
- Engagement con usuarios

**Contras:**
- Review time requerido
- Posible inconsistencia
- Coordinación compleja

**Si sí, requerimientos:**
- [ ] Template PR para traducciones
- [ ] Checklist de validación
- [ ] Guidelines para contributors
- [ ] Process de review
- [ ] Recognition (CONTRIBUTORS.md)

**Decisión:** ⏸️ Pendiente

---

### 6. Frecuencia de Updates
**Pregunta:** ¿Con qué frecuencia re-traducir cuando cambia source?

**Escenarios:**
```
Cambio en ES (source):
- New feature agrega 50 nuevas keys
- Bug fix modifica 1 key
- Refactor renombra 20 keys

¿Cuándo re-traducir?
A) Inmediatamente (CI/CD automático)
B) Por release (cada 2-4 semanas)
C) Manualmente según prioridad
D) Incremental (solo keys nuevas/modificadas)
```

**Decisión recomendada:** D (Incremental) + B (Batch por release)

**Decisión final:** ⏸️ Pendiente

---

### 7. Idiomas RTL (Right-to-Left)
**Pregunta:** ¿Soporte especial para idiomas RTL como Árabe?

**Consideraciones técnicas:**
```
Árabe (AR), Hebreo (HE):
- Layout completo RTL
- Componentes UI mirror
- Iconos direccionales invertidos
- Números y fechas especiales
```

**Impacto:**
- CSS: `dir="rtl"` en HTML root
- Tailwind: Variantes RTL (`rtl:flex-row-reverse`)
- Components: Mirror logic
- Testing: Browsers RTL mode

**Decisión:** ⏸️ Posponer hasta Q3 2026 (cuando se agregue AR)

---

## 💰 Preguntas de Costos

### 8. Budget Mensual
**Pregunta:** ¿Cuál es el budget mensual para traducciones?

**Estimados:**
```
Costo por idioma completo (inicial): ~$3.50
Updates mensuales (incremental): ~$0.50/idioma

Con 12 idiomas:
- Setup inicial: 12 × $3.50 = $42
- Mantenimiento mensual: 12 × $0.50 = $6/mes
- Anual: $42 + ($6 × 12) = $114/año
```

**Presupuesto recomendado:**
- Inicial (12 idiomas): $50-100
- Mensual ongoing: $10-20

**Decisión:** ⏸️ Pendiente (aprobar budget)

---

### 9. Cost Tracking
**Pregunta:** ¿Implementar tracking de costos de API?

**Utilidad:**
- Monitorear spending
- Optimizar prompts (reducir tokens)
- ROI analysis

**Opciones:**
- A) Log simple (tokens + costo estimado)
- B) Dashboard Grafana/similar
- C) No trackear (confiar en OpenRouter billing)

**Decisión recomendada:** A (Log simple)

**Decisión final:** ⏸️ Pendiente

---

## 🔒 Preguntas de Seguridad

### 10. API Key Management
**Pregunta:** ¿Cómo manejar API keys en producción?

**Escenarios:**
- Desarrollo local: `.env` file
- CI/CD: GitHub Secrets
- Producción runtime: ¿No aplica? (traducción es build-time)

**Opciones:**
- A) Solo local (developers) + CI/CD
- B) Agregar production runtime fallback
- C) Service separation (translation service)

**Decisión recomendada:** A (build-time only)

**Decisión final:** ⏸️ Pendiente

---

## 🎨 Preguntas de Calidad

### 11. A/B Testing de Prompts
**Pregunta:** ¿Implementar A/B testing para optimizar prompts?

**Proceso:**
```
1. Crear variantes de prompt (A, B, C)
2. Traducir mismo texto con cada variante
3. Evaluar calidad (humano o automated scoring)
4. Elegir mejor variante
5. Iterar
```

**Métricas de calidad:**
- Naturalness (fluent vs literal)
- Consistency (terminology)
- Accuracy (preserva significado)

**Decisión:** ⏸️ Útil pero low priority (Fase futura)

---

### 12. Automated Quality Scoring
**Pregunta:** ¿Usar IA para scoring automático de traducciones?

**Approach:**
```python
def score_translation(source, target, context):
    prompt = f"""
    Rate this translation from 1-10:
    Source: {source}
    Target: {target}
    Context: {context}
    
    Criteria: naturalness, accuracy, consistency
    """
    # Segunda llamada a IA para scoring
    return score
```

**Pros:**
- Automated quality gate
- No requiere review humano
- Escalable

**Contras:**
- Costo adicional (doble API calls)
- IA scoring puede ser impreciso
- False positives/negatives

**Decisión:** ⏸️ Experimental (Fase futura)

---

## 📋 Resumen de Decisiones Pendientes

| # | Pregunta | Prioridad | Deadline |
|---|----------|-----------|----------|
| 1 | Translation memory | Baja | Q2 2026 |
| 2 | Fallback language | Alta | Antes de implementación |
| 3 | Review humano | Alta | Antes de producción |
| 4 | Versionado | Media | Q1 2026 |
| 5 | Community contributions | Media | Q2 2026 |
| 6 | Frecuencia updates | Alta | Antes de implementación |
| 7 | Soporte RTL | Baja | Q3 2026 |
| 8 | Budget mensual | Alta | Inmediato |
| 9 | Cost tracking | Media | Q1 2026 |
| 10 | API key management | Alta | Antes de CI/CD |
| 11 | A/B testing prompts | Baja | Q3 2026 |
| 12 | Automated scoring | Baja | Q4 2026 |

---

## ✅ Recomendaciones Inmediatas

Para comenzar implementación, decidir:

1. **Fallback language** → Recomendado: EN
2. **Review process** → Recomendado: Sampling (10%) + Community
3. **Update frequency** → Recomendado: Incremental + Batch por release
4. **Budget** → Aprobar $50-100 inicial + $10-20/mes
5. **API key management** → Confirmar: Build-time only (local + CI/CD)

Resto de decisiones pueden posponerse sin bloquear MVP.

---

*Documento de preguntas v1.0 - Diciembre 29, 2025*
