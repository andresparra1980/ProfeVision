# Setup Completado - Pruebas E2E Sistema de Tiers

**Fecha**: 2025-11-04
**Usuario de Prueba**: `78f64700-c962-419d-8716-94e7d8f7be30` (Andres Parra)

---

## ✅ Estado Actual del Usuario

```
ID: 78f64700-c962-419d-8716-94e7d8f7be30
Nombre: Andres Parra
Tier: grandfathered
Status: active
Cycle Start: 2025-11-04
Cycle End: 2025-12-03
Días hasta reseteo: 29

Límites:
  - AI Generations: -1 (ilimitado)
  - Exam Scans: -1 (ilimitado)

Uso Actual:
  - AI Generations: 0
  - Exam Scans: 0

Usage Tracking ID: 620ed7de-3116-44da-a414-5fb202b20bc1
```

---

## 📋 Plan de Pruebas

El plan completo de pruebas E2E está disponible en:
**`mddocs/TIER_SYSTEM_E2E_TESTING_PLAN.md`**

El plan incluye:
- ✅ **69 test cases** organizados por categorías
- ✅ Scripts SQL para configurar diferentes escenarios
- ✅ Queries de verificación
- ✅ Checklist de validación
- ✅ Nombres de campos corregidos según el schema real de la DB

---

## 🚀 Cómo Empezar las Pruebas

### 1. Verificar Estado Inicial

Ejecuta este query para confirmar que el usuario está listo:

```sql
SELECT
  p.id,
  p.nombres,
  p.apellidos,
  p.subscription_tier,
  p.subscription_status,
  p.subscription_cycle_start,
  ut.month_year,
  ut.cycle_start_date,
  ut.cycle_end_date,
  (DATE(ut.cycle_end_date) - CURRENT_DATE) as days_until_reset,
  ut.ai_generations_used,
  ut.scans_used,
  tl.ai_generations_per_month as ai_limit,
  tl.scans_per_month as scan_limit
FROM profesores p
LEFT JOIN usage_tracking ut ON ut.profesor_id = p.id
LEFT JOIN tier_limits tl ON tl.tier = p.subscription_tier
WHERE p.id = '78f64700-c962-419d-8716-94e7d8f7be30'
ORDER BY ut.created_at DESC
LIMIT 1;
```

**Resultado esperado:**
- `subscription_tier`: `grandfathered`
- `ai_limit`: `-1` (ilimitado)
- `scan_limit`: `-1` (ilimitado)
- `ai_generations_used`: `0`
- `scans_used`: `0`

---

### 2. Iniciar con Pruebas de Tier GRANDFATHERED

**Sección en el plan**: `2.1 Tier: GRANDFATHERED (Ilimitado)`

**Test Cases a ejecutar:**
1. **TC-GRAND-001**: AI Chat - Toast Informativo
   - Abrir `/dashboard/exams/ai-exams-creation-chat`
   - Verificar toast "Unlimited - Founders Plan" (inglés) o "Ilimitado - Plan Fundador" (español)

2. **TC-GRAND-002**: AI Chat - Generar Múltiples Exámenes
   - Generar 5 exámenes consecutivos
   - Verificar que NO hay restricciones

3. **TC-GRAND-003**: Scan Wizard - Pantalla de Instrucciones
   - Abrir Scan Wizard
   - Verificar indicador "∞ Unlimited"

4. **TC-GRAND-004**: Scan Wizard - Realizar Múltiples Escaneos
   - Completar 60 escaneos
   - Verificar que NO hay restricciones

---

### 3. Cambiar a Tier FREE para Pruebas de Límites

**Cuando quieras probar el tier FREE**, ejecuta:

```sql
-- Configurar usuario como FREE
UPDATE profesores
SET subscription_tier = 'free'
WHERE id = '78f64700-c962-419d-8716-94e7d8f7be30';

-- Resetear contadores
UPDATE usage_tracking
SET
  ai_generations_used = 0,
  scans_used = 0,
  cycle_start_date = CURRENT_DATE,
  cycle_end_date = CURRENT_DATE + INTERVAL '30 days'
WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
```

Luego sigue con **Sección 2.2** del plan de pruebas.

---

### 4. Simular Diferentes Estados de Uso

El plan incluye scripts SQL para simular:

**Estado de Warning (80%+ de uso):**
```sql
UPDATE profesores SET subscription_tier = 'free' WHERE id = '78f64700-c962-419d-8716-94e7d8f7be30';
UPDATE usage_tracking SET scans_used = 42 WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
```

**Estado de Límite Alcanzado:**
```sql
UPDATE profesores SET subscription_tier = 'free' WHERE id = '78f64700-c962-419d-8716-94e7d8f7be30';
UPDATE usage_tracking
SET
  scans_used = 50,
  ai_generations_used = 1
WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
```

**Resetear a Estado Inicial:**
```sql
UPDATE profesores
SET
  subscription_tier = 'grandfathered',
  subscription_status = 'active',
  subscription_cycle_start = CURRENT_DATE
WHERE id = '78f64700-c962-419d-8716-94e7d8f7be30';

DELETE FROM usage_tracking WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
SELECT * FROM get_or_create_usage_tracking('78f64700-c962-419d-8716-94e7d8f7be30');
```

---

## 📊 Categorías de Pruebas

El plan cubre las siguientes áreas:

### A. Pruebas por Tier
- ✅ **Tier GRANDFATHERED** (4 test cases)
- ✅ **Tier FREE** (7 test cases)
- ✅ **Tier PLUS** (2 test cases)

### B. Pruebas de Límites
- ✅ **Incremento de contadores** (4 test cases)
- ✅ **Validación de límites** (4 test cases)

### C. Pruebas de UI/UX
- ✅ **Loading states** (3 test cases)
- ✅ **Modales** (2 test cases)
- ✅ **Toasts** (incluidos en otros tests)

### D. Pruebas de i18n
- ✅ **Español** (3 test cases)
- ✅ **Inglés** (3 test cases)

### E. Pruebas de Ciclo de Facturación
- ✅ **Reseteo de límites** (3 test cases)
- ✅ **Cálculo de días** (2 test cases)

---

## 🔍 Herramientas de Desarrollo Útiles

### React DevTools
- Inspecciona el hook `useTierLimits()` para ver el estado en tiempo real
- Verifica que `canUseAI()` y `canUseScan()` retornan valores correctos

### Browser Console
- Busca logs de desarrollo (solo en dev mode)
- Busca errores de traducción: `MISSING_MESSAGE`

### Network Tab
- Monitorea llamadas a `/api/tiers/usage`
- Verifica tiempos de carga (para tests de loading state)

### Supabase Dashboard
- Monitorea cambios en `usage_tracking` en tiempo real
- Verifica triggers y funciones SQL

---

## ⚠️ Casos Especiales a Validar

### 1. No Flash de Warning Durante Carga
**Problema anterior**: El warning "Limits reached" aparecía brevemente mientras cargaban los datos.

**Solución implementada**:
- Prop `loading` en `Instructions` component
- Condición: `!loading && !canScan && scanUsage`

**Test Case**: TC-UI-001

### 2. Toast Solo Aparece Una Vez
**Problema anterior**: Toast podría aparecer múltiples veces al navegar.

**Solución implementada**:
- `useRef` para trackear si ya se mostró
- `toastShownRef.current = true`

**Test Case**: TC-UI-002

### 3. No Scrollbar Inesperado en AI Chat
**Problema anterior**: Banner permanente desplazaba contenido.

**Solución implementada**:
- Reemplazado banner con toast flotante
- Toast no afecta el layout

**Test Case**: TC-UI-003

---

## 📝 Registro de Resultados

Se recomienda llevar un registro de los resultados en una tabla como esta:

| Test Case | Fecha | Estado | Navegador | Idioma | Notas |
|-----------|-------|--------|-----------|--------|-------|
| TC-GRAND-001 | 2025-11-04 | ⏳ | Chrome | es | |
| TC-GRAND-002 | | ⏳ | | | |
| ... | | | | | |

**Leyenda de Estados:**
- ✅ = Pasó
- ❌ = Falló
- ⚠️ = Parcial
- ⏳ = Pendiente
- ⏭️ = Omitido

---

## 🐛 Reporte de Bugs

Si encuentras problemas durante las pruebas, documéntalos con:

```markdown
**Test Case**: TC-XXX-YYY
**Descripción**: [Qué salió mal]
**Steps to Reproduce**:
1. [Paso 1]
2. [Paso 2]
3. [Resultado actual]

**Resultado Esperado**: [Qué debería pasar]
**Resultado Actual**: [Qué pasó realmente]
**Screenshots**: [Si aplica]
**Browser**: Chrome 120 / Firefox 121 / etc.
**Idioma**: es / en
```

---

## 🎯 Próximos Pasos Recomendados

1. **Día 1**: Pruebas de Tier GRANDFATHERED (Sección 2.1)
   - Validar comportamiento ilimitado
   - Verificar toasts y UI

2. **Día 2**: Pruebas de Tier FREE (Sección 2.2)
   - Validar límites y warnings
   - Probar estados de carga

3. **Día 3**: Pruebas de i18n (Sección 5)
   - Validar traducciones en español
   - Validar traducciones en inglés

4. **Día 4**: Pruebas de Ciclo de Facturación (Sección 6)
   - Probar reseteo de límites
   - Validar cálculo de días

5. **Día 5**: Pruebas de Edge Cases
   - Manipulación de UI
   - Múltiples navegaciones
   - Refresh durante uso

---

## 📚 Referencias

- **Plan Completo**: `mddocs/TIER_SYSTEM_E2E_TESTING_PLAN.md`
- **Database Schema**: `mddocs/DATABASE_SCHEMA.md`
- **Task List**: `mddocs/TIER_SYSTEM_IMPLEMENTATION_TASKS.md` (22/22 completado)
- **Código Fuente**:
  - Scan Wizard: `components/exam/scan-wizard.tsx`
  - Instructions: `components/exam/wizard-steps/instructions.tsx`
  - AI Chat: `app/[locale]/dashboard/exams/ai-exams-creation-chat/components/ChatPanel.tsx`
  - Hook: `lib/hooks/useTierLimits.ts`
  - Traducciones: `i18n/locales/{es,en}/tiers.json`

---

**¡Todo listo para comenzar las pruebas!** 🚀

El usuario `78f64700-c962-419d-8716-94e7d8f7be30` está completamente configurado y el plan de pruebas está documentado con todos los scripts SQL necesarios.
