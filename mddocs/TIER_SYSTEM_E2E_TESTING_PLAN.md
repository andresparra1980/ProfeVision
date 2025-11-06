# Plan de Pruebas E2E - Sistema de Tiers

**Fecha**: 2025-11-04
**Usuario de Prueba**: `78f64700-c962-419d-8716-94e7d8f7be30`
**Versión**: 1.0

---

## 📋 Índice

1. [Setup Inicial](#setup-inicial)
2. [Pruebas por Tier](#pruebas-por-tier)
3. [Pruebas de Límites](#pruebas-de-límites)
4. [Pruebas de UI/UX](#pruebas-de-uiux)
5. [Pruebas de i18n](#pruebas-de-i18n)
6. [Pruebas de Ciclo de Facturación](#pruebas-de-ciclo-de-facturación)
7. [Scripts SQL de Soporte](#scripts-sql-de-soporte)
8. [Checklist de Validación](#checklist-de-validación)

---

## 🔧 Setup Inicial

### 1.1 Verificar Estado Inicial del Usuario

```sql
-- Consultar estado actual del profesor
SELECT
  id,
  nombre,
  email,
  subscription_tier,
  subscription_status,
  subscription_cycle_start,
  first_login_completed
FROM profesores
WHERE id = '78f64700-c962-419d-8716-94e7d8f7be30';

-- Consultar usage tracking actual
SELECT
  ut.id,
  ut.profesor_id,
  ut.month_year,
  ut.cycle_start_date,
  ut.cycle_end_date,
  ut.ai_generations_used,
  ut.scans_used,
  ut.created_at,
  ut.updated_at
FROM usage_tracking ut
WHERE ut.profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30'
ORDER BY ut.created_at DESC
LIMIT 1;
```

**Resultado Esperado:**
- Profesor existe y tiene tier asignado
- Existe un registro en `usage_tracking` para el ciclo actual
- Los contadores reflejan el uso real

### 1.2 Preparar Entorno de Pruebas

- [ ] Tener cuenta con email verificado
- [ ] Tener al menos 1 materia creada
- [ ] Tener al menos 1 grupo creado
- [ ] Tener acceso a cámara (para pruebas de scan)
- [ ] Navegador con consola abierta para ver logs
- [ ] Probar en ambos idiomas (es/en)

---

## 🎯 Pruebas por Tier

### 2.1 Tier: GRANDFATHERED (Ilimitado)

**Configurar Usuario:**
```sql
UPDATE profesores
SET
  subscription_tier = 'grandfathered',
  subscription_status = 'active',
  subscription_cycle_start_date = CURRENT_DATE
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

#### Test Cases:

**TC-GRAND-001: AI Chat - Toast Informativo**
- **Acción**: Abrir `/dashboard/exams/ai-exams-creation-chat`
- **Resultado Esperado**:
  - ✅ Aparece toast azul (info) con mensaje: "Ilimitado - Plan Fundador" (español) o "Unlimited - Founders Plan" (inglés)
  - ✅ Toast desaparece después de 4 segundos
  - ✅ Toast solo aparece UNA vez (no reaparece al navegar)
  - ✅ No hay indicador de uso permanente en la UI
  - ✅ Botón de envío está HABILITADO

**TC-GRAND-002: AI Chat - Generar Múltiples Exámenes**
- **Acción**: Generar 5 exámenes con IA consecutivamente
- **Resultado Esperado**:
  - ✅ Todas las generaciones se completan sin restricciones
  - ✅ No aparecen warnings ni modales de límite
  - ✅ Contador en DB incrementa correctamente (verificar con SQL)
  - ✅ UI nunca muestra límites

**TC-GRAND-003: Scan Wizard - Pantalla de Instrucciones**
- **Acción**: Abrir Scan Wizard (botón "Escanear Examen")
- **Resultado Esperado**:
  - ✅ Aparece indicador de uso: "∞ Unlimited" o "X of ∞"
  - ✅ Indicador tiene borde azul (sin warning)
  - ✅ NO aparece mensaje de "Limits reached"
  - ✅ Botón "Continuar" está HABILITADO
  - ✅ No hay loading flash antes de mostrar datos

**TC-GRAND-004: Scan Wizard - Realizar Múltiples Escaneos**
- **Acción**: Completar 60 escaneos (más del límite free)
- **Resultado Esperado**:
  - ✅ Todos los escaneos se completan sin restricciones
  - ✅ No aparecen warnings ni modales
  - ✅ Contador en DB incrementa correctamente
  - ✅ UI siempre muestra "Unlimited"

---

### 2.2 Tier: FREE (1 AI Gen, 50 Scans)

**Configurar Usuario:**
```sql
UPDATE profesores
SET
  subscription_tier = 'free',
  subscription_status = 'active',
  subscription_cycle_start_date = CURRENT_DATE
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

#### Test Cases:

**TC-FREE-001: AI Chat - Primer Uso (0/1)**
- **Acción**: Abrir AI Chat (sin uso previo)
- **Resultado Esperado**:
  - ✅ Toast informativo: "0 of 1 used"
  - ✅ Botón de envío HABILITADO
  - ✅ No hay warnings

**TC-FREE-002: AI Chat - Primera Generación (1/1)**
- **Acción**: Generar 1 examen con IA
- **Resultado Esperado**:
  - ✅ Generación se completa exitosamente
  - ✅ Contador incrementa a 1/1 en DB
  - ✅ Al recargar página, toast muestra: "1 of 1 used"

**TC-FREE-003: AI Chat - Límite Alcanzado (1/1)**
- **Acción**: Intentar generar otro examen
- **Resultado Esperado**:
  - ✅ Botón de envío está DESHABILITADO
  - ✅ Al hacer clic aparece modal "Limit Reached"
  - ✅ Modal muestra días hasta reseteo
  - ✅ Modal ofrece opción de upgrade

**TC-FREE-004: Scan Wizard - Uso Bajo (5/50 = 10%)**
```sql
UPDATE usage_tracking
SET scans_used = 5
WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
```
- **Acción**: Abrir Scan Wizard
- **Resultado Esperado**:
  - ✅ Indicador muestra: "5 of 50"
  - ✅ Borde azul (sin warning)
  - ✅ Botón "Continuar" HABILITADO

**TC-FREE-005: Scan Wizard - Uso Medio-Alto (42/50 = 84%)**
```sql
UPDATE usage_tracking
SET scans_used = 42
WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
```
- **Acción**: Abrir Scan Wizard
- **Resultado Esperado**:
  - ✅ Indicador muestra: "42 of 50"
  - ✅ Borde AMARILLO (warning threshold > 80%)
  - ✅ Aparece texto: "Near limit (84%)"
  - ✅ Botón "Continuar" HABILITADO

**TC-FREE-006: Scan Wizard - Límite Alcanzado (50/50 = 100%)**
```sql
UPDATE usage_tracking
SET scans_used = 50
WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
```
- **Acción**: Abrir Scan Wizard
- **Resultado Esperado**:
  - ✅ Indicador muestra: "50 of 50"
  - ✅ Borde ROJO
  - ✅ Aparece warning rojo con ícono de alerta
  - ✅ Mensaje: "Limit Reached" + descripción
  - ✅ Botón "Continuar" está DESHABILITADO
  - ✅ Al hacer clic en botón aparece modal "Limit Reached"

**TC-FREE-007: Scan Wizard - Intentar Escanear con Límite Alcanzado**
- **Precondición**: scans_used = 50
- **Acción**: Intentar avanzar del paso 1
- **Resultado Esperado**:
  - ✅ Modal "Limit Reached" aparece inmediatamente
  - ✅ No se puede avanzar al paso 2 (captura)
  - ✅ Modal muestra días hasta reseteo
  - ✅ Modal ofrece opción de upgrade

---

### 2.3 Tier: PLUS (Ilimitado)

**Configurar Usuario:**
```sql
UPDATE profesores
SET
  subscription_tier = 'plus',
  subscription_status = 'active',
  subscription_cycle_start_date = CURRENT_DATE
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

#### Test Cases:

**TC-PLUS-001: AI Chat - Comportamiento Idéntico a Grandfathered**
- **Acción**: Abrir AI Chat y generar 5 exámenes
- **Resultado Esperado**:
  - ✅ Toast informativo: "Unlimited"
  - ✅ Sin restricciones en generaciones
  - ✅ Botón siempre habilitado

**TC-PLUS-002: Scan Wizard - Comportamiento Idéntico a Grandfathered**
- **Acción**: Abrir Scan Wizard y realizar 60 escaneos
- **Resultado Esperado**:
  - ✅ Indicador muestra: "∞ Unlimited"
  - ✅ Sin restricciones en escaneos
  - ✅ Botón siempre habilitado

---

## 🚫 Pruebas de Límites

### 3.1 Límites de AI Generation

**TC-LIM-001: Transición de Disponible a Warning (FREE)**
```sql
-- Configurar usuario FREE
UPDATE profesores SET subscription_tier = 'free' WHERE id = '78f64700-c962-419d-8716-94e7d8f7be30';
UPDATE usage_tracking SET ai_generations_used = 0 WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
```
- **Acción 1**: Abrir AI Chat (0/1)
  - ✅ Toast info: "0 of 1 used"
- **Acción 2**: Generar 1 examen
  - ✅ Generación exitosa
- **Acción 3**: Recargar página
  - ✅ Toast warning: "Near limit (100%)"
  - ✅ Botón DESHABILITADO

**TC-LIM-002: Incremento de Contador en DB**
```sql
-- Antes de generar
SELECT ai_generations_used FROM usage_tracking WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
-- Resultado: 0

-- Después de generar
SELECT ai_generations_used FROM usage_tracking WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
-- Resultado: 1
```

### 3.2 Límites de Scan

**TC-LIM-003: Transición de Disponible a Warning a Límite (FREE)**
```sql
-- Configurar usuario FREE
UPDATE profesores SET subscription_tier = 'free' WHERE id = '78f64700-c962-419d-8716-94e7d8f7be30';
```

- **Estado 1**: 30/50 (60%)
  ```sql
  UPDATE usage_tracking SET scans_used = 30 WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
  ```
  - ✅ Borde azul
  - ✅ "30 of 50"

- **Estado 2**: 42/50 (84% - WARNING)
  ```sql
  UPDATE usage_tracking SET scans_used = 42 WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
  ```
  - ✅ Borde amarillo
  - ✅ "Near limit (84%)"

- **Estado 3**: 50/50 (100% - LÍMITE)
  ```sql
  UPDATE usage_tracking SET scans_used = 50 WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
  ```
  - ✅ Borde rojo
  - ✅ Warning con AlertCircle
  - ✅ Botón deshabilitado

**TC-LIM-004: Verificar que NO se puede bypassear límite**
- **Precondición**: scans_used = 50
- **Acción**: Manipular UI con DevTools para habilitar botón
- **Resultado Esperado**:
  - ✅ Hook `useTierLimits()` siempre retorna `canUseScan() = false`
  - ✅ Llamada a API debe fallar (si existiera endpoint)

---

## 🎨 Pruebas de UI/UX

### 4.1 Estados de Carga (Loading States)

**TC-UI-001: Scan Wizard - No Flash de Warning**
```sql
-- Configurar usuario GRANDFATHERED
UPDATE profesores SET subscription_tier = 'grandfathered' WHERE id = '78f64700-c962-419d-8716-94e7d8f7be30';
```
- **Acción**:
  1. Simular red lenta (DevTools > Network > Slow 3G)
  2. Abrir Scan Wizard
  3. Observar carga del componente Instructions
- **Resultado Esperado**:
  - ✅ NO aparece warning rojo mientras carga
  - ✅ Botón "Continuar" NO aparece deshabilitado mientras carga
  - ✅ Indicador de uso NO muestra "0 of 0" temporalmente
  - ✅ Cuando termina de cargar, muestra correctamente "Unlimited"

**TC-UI-002: AI Chat - No Múltiples Toasts**
- **Acción**:
  1. Abrir AI Chat
  2. Navegar a otra página
  3. Volver a AI Chat
  4. Repetir 3 veces
- **Resultado Esperado**:
  - ✅ Toast solo aparece la PRIMERA vez
  - ✅ No aparecen toasts duplicados
  - ✅ `toastShownRef` persiste correctamente

**TC-UI-003: Scroll Bar - Sin Desplazamiento Inesperado**
```sql
-- Configurar usuario FREE con uso medio
UPDATE profesores SET subscription_tier = 'free' WHERE id = '78f64700-c962-419d-8716-94e7d8f7be30';
UPDATE usage_tracking SET ai_generations_used = 0 WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
```
- **Acción**: Abrir AI Chat
- **Resultado Esperado**:
  - ✅ NO aparece banner permanente que desplace contenido
  - ✅ Solo toast flotante (no afecta layout)
  - ✅ Altura de la página NO cambia al aparecer/desaparecer toast
  - ✅ NO aparece scrollbar inesperado

### 4.2 Modales

**TC-UI-004: Modal Limit Reached - Contenido Correcto**
```sql
-- Configurar usuario FREE con límite alcanzado
UPDATE profesores SET subscription_tier = 'free', subscription_cycle_start_date = CURRENT_DATE WHERE id = '78f64700-c962-419d-8716-94e7d8f7be30';
UPDATE usage_tracking SET scans_used = 50, cycle_end_date = CURRENT_DATE + INTERVAL '15 days' WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
```
- **Acción**: Intentar escanear con límite alcanzado
- **Resultado Esperado**:
  - ✅ Modal se abre automáticamente
  - ✅ Título: "Limit Reached"
  - ✅ Descripción menciona "scans"
  - ✅ Muestra días hasta reseteo: "15 days"
  - ✅ Botón "Got it" cierra el modal
  - ✅ Modal tiene backdrop (oscurece fondo)

**TC-UI-005: Modal - Días Hasta Reseteo Dinámicos**
- **Caso A**: Reseteo mañana (1 día)
  ```sql
  UPDATE usage_tracking SET cycle_end_date = CURRENT_DATE + INTERVAL '1 day' WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
  ```
  - ✅ Muestra: "Your limit will reset in 1 day"

- **Caso B**: Reseteo hoy (0 días)
  ```sql
  UPDATE usage_tracking SET cycle_end_date = CURRENT_DATE WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
  ```
  - ✅ Muestra: "Your limit will reset tomorrow"

- **Caso C**: Reseteo en 20 días
  ```sql
  UPDATE usage_tracking SET cycle_end_date = CURRENT_DATE + INTERVAL '20 days' WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
  ```
  - ✅ Muestra: "Your limit will reset in 20 days"

---

## 🌍 Pruebas de i18n

### 5.1 Traducción Español (es)

**TC-I18N-001: Scan Wizard - Español**
```sql
UPDATE profesores SET subscription_tier = 'free' WHERE id = '78f64700-c962-419d-8716-94e7d8f7be30';
UPDATE usage_tracking SET scans_used = 42 WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
```
- **Acción**:
  1. Cambiar idioma a Español (si no es default)
  2. Abrir Scan Wizard
- **Resultado Esperado**:
  - ✅ Indicador: "42 de 50" (no "of")
  - ✅ Warning: "Cerca del límite (84%)"
  - ✅ Feature label: "Escaneos de exámenes"

**TC-I18N-002: AI Chat - Español**
```sql
UPDATE usage_tracking SET ai_generations_used = 0 WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
```
- **Acción**: Abrir AI Chat en español
- **Resultado Esperado**:
  - ✅ Toast: "0 de 1 usado"
  - ✅ Feature: "Generaciones con IA"

**TC-I18N-003: Modal - Español**
```sql
UPDATE usage_tracking SET scans_used = 50, cycle_end_date = CURRENT_DATE + INTERVAL '10 days' WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
```
- **Acción**: Abrir modal de límite alcanzado
- **Resultado Esperado**:
  - ✅ Título: "Límite Alcanzado"
  - ✅ Descripción menciona: "escaneos"
  - ✅ Reseteo: "Tu límite se reiniciará en 10 días"
  - ✅ Botón: "Entendido"

### 5.2 Traducción Inglés (en)

**TC-I18N-004: Scan Wizard - Inglés**
- **Acción**: Cambiar a `/en/dashboard` y abrir Scan Wizard
- **Resultado Esperado**:
  - ✅ Indicador: "42 of 50"
  - ✅ Warning: "Near limit (84%)"
  - ✅ Feature: "Exam Scans"

**TC-I18N-005: AI Chat - Inglés**
- **Acción**: Abrir AI Chat en `/en/dashboard/exams/ai-exams-creation-chat`
- **Resultado Esperado**:
  - ✅ Toast: "0 of 1 used"
  - ✅ Feature: "AI Generations"

**TC-I18N-006: Modal - Inglés**
- **Acción**: Abrir modal de límite en inglés
- **Resultado Esperado**:
  - ✅ Título: "Limit Reached"
  - ✅ Descripción: "scans"
  - ✅ Reseteo: "Your limit will reset in 10 days"
  - ✅ Botón: "Got it"

---

## 🔄 Pruebas de Ciclo de Facturación

### 6.1 Reseteo de Límites

**TC-CYCLE-001: Verificar Función `calculate_cycle_dates()`**
```sql
-- Probar con diferentes fechas de inicio
SELECT * FROM calculate_cycle_dates('2025-11-01');
-- Resultado esperado:
-- cycle_start_date: 2025-11-01
-- cycle_end_date: 2025-12-01

SELECT * FROM calculate_cycle_dates('2025-02-28');
-- Resultado esperado:
-- cycle_start_date: 2025-02-28
-- cycle_end_date: 2025-03-28 (no 30, porque Feb tiene menos días)
```

**TC-CYCLE-002: Simular Nuevo Ciclo**
```sql
-- Configurar ciclo que YA terminó
UPDATE profesores
SET subscription_cycle_start_date = CURRENT_DATE - INTERVAL '35 days'
WHERE id = '78f64700-c962-419d-8716-94e7d8f7be30';

UPDATE usage_tracking
SET
  cycle_start_date = CURRENT_DATE - INTERVAL '35 days',
  cycle_end_date = CURRENT_DATE - INTERVAL '5 days',
  scans_used = 50,
  ai_generations_used = 1
WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';

-- Ahora llamar a la función get_or_create_usage_tracking
SELECT * FROM get_or_create_usage_tracking('78f64700-c962-419d-8716-94e7d8f7be30');
```
- **Resultado Esperado**:
  - ✅ Se crea NUEVO registro en `usage_tracking`
  - ✅ Contadores resetean a 0
  - ✅ `cycle_start_date` = hoy
  - ✅ `cycle_end_date` = hoy + 30 días

**TC-CYCLE-003: UI Después de Reseteo**
- **Precondición**: Ciclo reseteado (contadores en 0)
- **Acción**:
  1. Abrir Scan Wizard
  2. Abrir AI Chat
- **Resultado Esperado**:
  - ✅ Scan Wizard muestra: "0 of 50"
  - ✅ AI Chat toast muestra: "0 of 1 used"
  - ✅ Botones HABILITADOS
  - ✅ Sin warnings

### 6.2 Días Hasta Reseteo

**TC-CYCLE-004: Cálculo de Días**
```sql
-- Configurar diferentes fechas de fin de ciclo
UPDATE usage_tracking
SET cycle_end_date = CURRENT_DATE + INTERVAL '3 days'
WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
```
- **Acción**: Abrir modal de límite alcanzado
- **Resultado Esperado**:
  - ✅ Modal muestra: "3 days until reset"

**TC-CYCLE-005: Hook `useTierLimits()` - Días Correctos**
- **Acción**: Inspeccionar con React DevTools el hook
- **Resultado Esperado**:
  ```javascript
  usage: {
    cycle: {
      start: "2025-11-04",
      end: "2025-11-07",
      daysUntilReset: 3
    }
  }
  ```

---

## 📝 Scripts SQL de Soporte

### 7.1 Scripts de Configuración Rápida

**Resetear Usuario a Estado Inicial:**
```sql
-- Configurar tier y resetear contadores
UPDATE profesores
SET
  subscription_tier = 'grandfathered',
  subscription_status = 'active',
  subscription_cycle_start_date = CURRENT_DATE
WHERE id = '78f64700-c962-419d-8716-94e7d8f7be30';

DELETE FROM usage_tracking WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
SELECT * FROM get_or_create_usage_tracking('78f64700-c962-419d-8716-94e7d8f7be30');
```

**Simular Usuario FREE con Uso Parcial:**
```sql
UPDATE profesores
SET subscription_tier = 'free', subscription_cycle_start_date = CURRENT_DATE
WHERE id = '78f64700-c962-419d-8716-94e7d8f7be30';

UPDATE usage_tracking
SET
  ai_generations_used = 0,
  scans_used = 30,
  cycle_start_date = CURRENT_DATE,
  cycle_end_date = CURRENT_DATE + INTERVAL '30 days'
WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
```

**Simular Usuario FREE con Límites Alcanzados:**
```sql
UPDATE profesores
SET subscription_tier = 'free', subscription_cycle_start_date = CURRENT_DATE
WHERE id = '78f64700-c962-419d-8716-94e7d8f7be30';

UPDATE usage_tracking
SET
  ai_generations_used = 1,
  scans_used = 50,
  cycle_start_date = CURRENT_DATE,
  cycle_end_date = CURRENT_DATE + INTERVAL '15 days'
WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
```

**Simular Ciclo Expirado (para probar reseteo):**
```sql
UPDATE profesores
SET subscription_cycle_start_date = CURRENT_DATE - INTERVAL '35 days'
WHERE id = '78f64700-c962-419d-8716-94e7d8f7be30';

UPDATE usage_tracking
SET
  cycle_start_date = CURRENT_DATE - INTERVAL '35 days',
  cycle_end_date = CURRENT_DATE - INTERVAL '5 days',
  ai_generations_used = 1,
  scans_used = 50
WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
```

### 7.2 Queries de Verificación

**Estado Completo del Usuario:**
```sql
SELECT
  p.id,
  p.nombres,
  p.apellidos,
  p.subscription_tier,
  p.subscription_status,
  p.subscription_cycle_start,
  ut.cycle_start_date,
  ut.cycle_end_date,
  (ut.cycle_end_date - CURRENT_DATE) as days_until_reset,
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

**Verificar Incremento de Contador:**
```sql
-- Antes de usar feature
SELECT ai_generations_used, scans_used FROM usage_tracking WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';

-- Después de usar feature
SELECT ai_generations_used, scans_used FROM usage_tracking WHERE profesor_id = '78f64700-c962-419d-8716-94e7d8f7be30';
```

**Verificar Función `check_feature_limit()`:**
```sql
-- Debería retornar TRUE si puede usar, FALSE si no
SELECT check_feature_limit('78f64700-c962-419d-8716-94e7d8f7be30', 'ai_generation');
SELECT check_feature_limit('78f64700-c962-419d-8716-94e7d8f7be30', 'scan');
```

---

## ✅ Checklist de Validación

### Tier GRANDFATHERED
- [x] TC-GRAND-001: Toast informativo correcto
- [x] TC-GRAND-002: Múltiples generaciones AI sin límite
- [x] TC-GRAND-003: Scan Wizard muestra "Unlimited"
- [x] TC-GRAND-004: Múltiples escaneos sin límite

### Tier FREE
- [x] TC-FREE-001: AI Chat primer uso (0/1)
- [x] TC-FREE-002: Primera generación exitosa
- [x] TC-FREE-003: Límite alcanzado (botón disabled, modal)
- [x] TC-FREE-004: Scan uso bajo (5/50)
- [x] TC-FREE-005: Scan uso medio-alto warning (42/50)
- [x] TC-FREE-006: Scan límite alcanzado (50/50)
- [x] TC-FREE-007: No puede escanear con límite alcanzado

### Tier PLUS
- [x] TC-PLUS-001: AI Chat ilimitado
- [x] TC-PLUS-002: Scan ilimitado

### Límites
- [x] TC-LIM-001: Transición de disponible a warning
- [x] TC-LIM-002: Contador incrementa en DB
- [x] TC-LIM-003: Transición de estados en Scan
- [x] TC-LIM-004: No se puede bypassear límite

### UI/UX
- [x] TC-UI-001: No flash de warning durante carga
- [x] TC-UI-002: Toast solo aparece una vez
- [x] TC-UI-003: Sin scrollbar inesperado
- [x] TC-UI-004: Modal con contenido correcto
- [x] TC-UI-005: Días hasta reseteo dinámicos

### i18n
- [x] TC-I18N-001: Scan Wizard español
- [x] TC-I18N-002: AI Chat español
- [x] TC-I18N-003: Modal español
- [x] TC-I18N-004: Scan Wizard inglés
- [x] TC-I18N-005: AI Chat inglés
- [x] TC-I18N-006: Modal inglés

### Ciclo de Facturación
- [ ] TC-CYCLE-001: Función `calculate_cycle_dates()` correcta
- [ ] TC-CYCLE-002: Nuevo ciclo crea registro y resetea contadores
- [ ] TC-CYCLE-003: UI después de reseteo
- [ ] TC-CYCLE-004: Cálculo de días correcto
- [ ] TC-CYCLE-005: Hook retorna días correctos

---

## 📊 Reporte de Resultados

**Última Actualización**: 2025-11-06

### Progreso General

**Completadas**: 28/33 pruebas principales (85%)

| Categoría | Completadas | Total | Progreso |
|-----------|-------------|-------|----------|
| Tier GRANDFATHERED | 4/4 | 4 | ✅ 100% |
| Tier FREE | 7/7 | 7 | ✅ 100% |
| Tier PLUS | 2/2 | 2 | ✅ 100% |
| Límites | 4/4 | 4 | ✅ 100% |
| UI/UX | 5/5 | 5 | ✅ 100% |
| i18n | 6/6 | 6 | ✅ 100% |
| Ciclo Facturación | 0/5 | 5 | ⏳ 0% (Pendiente para implementación de pagos) |

### Resultados Detallados

| Test Case | Estado | Notas | Fecha |
|-----------|--------|-------|-------|
| TC-GRAND-001 | ✅ Pasó | Toast "Unlimited" OK | 2025-11-06 |
| TC-GRAND-002 | ✅ Pasó | Múltiples generaciones sin restricción | 2025-11-06 |
| TC-GRAND-003 | ✅ Pasó | Indicador "∞ Unlimited" OK | 2025-11-06 |
| TC-GRAND-004 | ✅ Pasó | 60+ escaneos sin restricción | 2025-11-06 |
| TC-FREE-001 | ✅ Pasó | Toast "0 of 1" OK | 2025-11-06 |
| TC-FREE-002 | ✅ Pasó | Generación exitosa, contador incrementa | 2025-11-06 |
| TC-FREE-003 | ✅ Pasó | Botón disabled, modal aparece | 2025-11-06 |
| TC-FREE-004 | ✅ Pasó | Indicador azul "5 of 50" | 2025-11-06 |
| TC-FREE-005 | ✅ Pasó | Warning amarillo "42 of 50 (84%)" | 2025-11-06 |
| TC-FREE-006 | ✅ Pasó | Borde rojo, botón disabled | 2025-11-06 |
| TC-FREE-007 | ✅ Pasó | Modal aparece, no permite avanzar | 2025-11-06 |
| TC-PLUS-001 | ✅ Pasó | Toast "Plan Plus", sin restricciones | 2025-11-06 |
| TC-PLUS-002 | ✅ Pasó | Indicador "∞ Unlimited", sin límites | 2025-11-06 |
| TC-LIM-001 | ✅ Pasó | Transición info→warning correcta | 2025-11-06 |
| TC-LIM-002 | ✅ Pasó | Contadores incrementan en DB | 2025-11-06 |
| TC-LIM-003 | ✅ Pasó | 3 estados visuales (azul→amarillo→rojo) | 2025-11-06 |
| TC-LIM-004 | ✅ Pasó | No se puede bypassear con DevTools | 2025-11-06 |
| TC-UI-001 | ✅ Pasó | No flash de warning durante carga | 2025-11-06 |
| TC-UI-002 | ✅ Pasó | Toast aparece solo una vez | 2025-11-06 |
| TC-UI-003 | ✅ Pasó | Sin scrollbar inesperado | 2025-11-06 |
| TC-UI-004 | ✅ Pasó | Modal con contenido correcto | 2025-11-06 |
| TC-UI-005 | ✅ Pasó | Días hasta reseteo dinámicos | 2025-11-06 |
| TC-I18N-001 | ✅ Pasó | Scan Wizard español correcto | 2025-11-06 |
| TC-I18N-002 | ✅ Pasó | AI Chat español correcto | 2025-11-06 |
| TC-I18N-003 | ✅ Pasó | Modal español correcto | 2025-11-06 |
| TC-I18N-004 | ✅ Pasó | Scan Wizard inglés correcto | 2025-11-06 |
| TC-I18N-005 | ✅ Pasó | AI Chat inglés correcto | 2025-11-06 |
| TC-I18N-006 | ✅ Pasó | Modal inglés correcto | 2025-11-06 |

**Leyenda:**
- ✅ = Pasó
- ❌ = Falló
- ⚠️ = Parcial
- ⏳ = Pendiente
- ⏭️ = Omitido

### Issues Encontrados y Resueltos

| Issue | Descripción | Solución | Estado |
|-------|-------------|----------|--------|
| Hydration Error | `<p>` dentro de `<p>` en limit-reached-modal.tsx:61 | Cambiar `<p>` internos por `<div>` | ✅ Resuelto |
| Toast Tier Incorrecto | AI Chat siempre mostraba "Plan Legacy Temporal" incluso en tier PLUS | Detectar `usage.tier.name` y mostrar label correcto según tier (plus/grandfathered/free) | ✅ Resuelto |
| Traducciones Faltantes | No existían traducciones para `subscription.plus.title` y `subscription.free.title` | Agregar traducciones en es/en para todos los tiers | ✅ Resuelto |

---

**Fin del Plan de Pruebas E2E v1.0**
