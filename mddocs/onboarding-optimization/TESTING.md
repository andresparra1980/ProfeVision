# Testing Onboarding

## Resetear estado para pruebas

### Via SQL (Supabase)


USER_ID: e037a348-152d-436a-9d6d-2b7650888e0e
EMAIL: profevision.pruebas@gmail.com
PASS: qwerty123

```sql
-- Obtener tu user_id
SELECT id, nombres, apellidos, onboarding_status, first_login_completed
FROM profesores 
WHERE id = (SELECT id FROM auth.users WHERE email = 'profevision.pruebas@gmail.com');

-- Resetear a estado "usuario nuevo post-migración" (verá wizard)
UPDATE profesores 
SET onboarding_status = '{"wizard_completed": false, "wizard_step": 0}'::jsonb
WHERE id = 'e037a348-152d-436a-9d6d-2b7650888e0e';

-- Resetear completamente (NULL = usuario legacy, NO verá wizard)
UPDATE profesores 
SET onboarding_status = NULL 
WHERE id = 'e037a348-152d-436a-9d6d-2b7650888e0e';

-- Simular wizard completado pero checklist pendiente
UPDATE profesores 
SET onboarding_status = '{
  "wizard_completed": true,
  "wizard_step": 5,
  "wizard_completed_at": "2025-01-01T00:00:00Z",
  "checklist_items": {
    "exam_created": false,
    "exam_published": false,
    "pdf_exported": false,
    "first_scan": false
  }
}'::jsonb
WHERE id = 'e037a348-152d-436a-9d6d-2b7650888e0e';
```

### Via localStorage (browser console)

```js
// Resetear flag de checklist dismissed
localStorage.removeItem('onboarding_checklist_dismissed');
```

### Limpiar datos creados en wizard

Si el wizard creó institución/materia/grupo/estudiantes de prueba:

```sql
-- Eliminar estudiantes del grupo
DELETE FROM estudiante_grupo WHERE grupo_id = 'GRUPO_ID';

-- Eliminar grupo
DELETE FROM grupos WHERE id = 'GRUPO_ID';

-- Eliminar materia
DELETE FROM materias WHERE id = 'MATERIA_ID';

-- Eliminar institución
DELETE FROM entidades_educativas WHERE id = 'ENTIDAD_ID';
```

## Estados posibles

| `onboarding_status` | `first_login_completed` | Resultado |
|---------------------|------------------------|-----------|
| `NULL` | `false` | Usuario legacy sin completar - NO wizard |
| `NULL` | `true` | Usuario legacy completado - NO wizard |
| `{wizard_completed: false}` | cualquier | Usuario nuevo - SI wizard |
| `{wizard_completed: true}` | cualquier | Wizard completado - checklist si pendiente |

## Flujo de testing recomendado

1. Resetear `onboarding_status` a `{"wizard_completed": false, "wizard_step": 0}`
2. Refrescar página del dashboard
3. Completar wizard paso a paso
4. Verificar que checklist aparece después
5. Completar items del checklist
6. Verificar que desaparece al completar todo

---

## Anexo: Reset completo de usuario para testing

Ejecutar en orden. Borra TODOS los datos del usuario para probar onboarding desde cero.

```sql
-- ========================================
-- RESET COMPLETO DE USUARIO DE PRUEBAS
-- Usuario: profevision.pruebas@gmail.com
-- ID: e037a348-152d-436a-9d6d-2b7650888e0e
-- ========================================

-- 1. Eliminar respuestas de estudiantes (depende de resultados_examen y preguntas)
DELETE FROM respuestas_estudiante 
WHERE resultado_id IN (
  SELECT re.id FROM resultados_examen re
  JOIN examenes e ON re.examen_id = e.id
  WHERE e.profesor_id = 'e037a348-152d-436a-9d6d-2b7650888e0e'
);

-- 2. Eliminar examenes escaneados (depende de resultados_examen)
DELETE FROM examenes_escaneados 
WHERE profesor_id = 'e037a348-152d-436a-9d6d-2b7650888e0e';

-- 3. Eliminar resultados de examen
DELETE FROM resultados_examen 
WHERE examen_id IN (
  SELECT id FROM examenes 
  WHERE profesor_id = 'e037a348-152d-436a-9d6d-2b7650888e0e'
);

-- 4. Eliminar exam_scans (cola de procesamiento)
DELETE FROM exam_scans 
WHERE exam_id IN (
  SELECT id FROM examenes 
  WHERE profesor_id = 'e037a348-152d-436a-9d6d-2b7650888e0e'
);

-- 5. Eliminar examen_grupo (relación examen-grupo)
DELETE FROM examen_grupo 
WHERE examen_id IN (
  SELECT id FROM examenes 
  WHERE profesor_id = 'e037a348-152d-436a-9d6d-2b7650888e0e'
);

-- 6. Eliminar opciones de respuesta (depende de preguntas)
DELETE FROM opciones_respuesta 
WHERE pregunta_id IN (
  SELECT p.id FROM preguntas p
  JOIN examenes e ON p.examen_id = e.id
  WHERE e.profesor_id = 'e037a348-152d-436a-9d6d-2b7650888e0e'
);

-- 7. Eliminar preguntas (depende de examenes)
DELETE FROM preguntas 
WHERE examen_id IN (
  SELECT id FROM examenes 
  WHERE profesor_id = 'e037a348-152d-436a-9d6d-2b7650888e0e'
);

-- 8. Eliminar versiones de examen
DELETE FROM versiones_examen 
WHERE examen_id IN (
  SELECT id FROM examenes 
  WHERE profesor_id = 'e037a348-152d-436a-9d6d-2b7650888e0e'
);

-- 9. Eliminar examenes
DELETE FROM examenes 
WHERE profesor_id = 'e037a348-152d-436a-9d6d-2b7650888e0e';

-- 10. Eliminar esquemas de calificación (depende de grupos)
DELETE FROM esquemas_calificacion 
WHERE grupo_id IN (
  SELECT id FROM grupos 
  WHERE profesor_id = 'e037a348-152d-436a-9d6d-2b7650888e0e'
);

-- 11. Eliminar estudiante_grupo (relación estudiante-grupo)
DELETE FROM estudiante_grupo 
WHERE grupo_id IN (
  SELECT id FROM grupos 
  WHERE profesor_id = 'e037a348-152d-436a-9d6d-2b7650888e0e'
);

-- 12. Eliminar grupos
DELETE FROM grupos 
WHERE profesor_id = 'e037a348-152d-436a-9d6d-2b7650888e0e';

-- 13. Eliminar materias
DELETE FROM materias 
WHERE profesor_id = 'e037a348-152d-436a-9d6d-2b7650888e0e';

-- 14. Eliminar profesor_entidad (relación profesor-entidad)
DELETE FROM profesor_entidad 
WHERE profesor_id = 'e037a348-152d-436a-9d6d-2b7650888e0e';

-- 15. Eliminar entidades educativas
DELETE FROM entidades_educativas 
WHERE profesor_id = 'e037a348-152d-436a-9d6d-2b7650888e0e';

-- 16. Resetear onboarding status
UPDATE profesores 
SET onboarding_status = '{"wizard_completed": false, "wizard_step": 0}'::jsonb
WHERE id = 'e037a348-152d-436a-9d6d-2b7650888e0e';

-- Verificar que quedó limpio
SELECT 
  (SELECT COUNT(*) FROM examenes WHERE profesor_id = 'e037a348-152d-436a-9d6d-2b7650888e0e') as examenes,
  (SELECT COUNT(*) FROM grupos WHERE profesor_id = 'e037a348-152d-436a-9d6d-2b7650888e0e') as grupos,
  (SELECT COUNT(*) FROM materias WHERE profesor_id = 'e037a348-152d-436a-9d6d-2b7650888e0e') as materias,
  (SELECT COUNT(*) FROM entidades_educativas WHERE profesor_id = 'e037a348-152d-436a-9d6d-2b7650888e0e') as entidades;
```

**Nota**: Los estudiantes no se eliminan porque pueden estar compartidos con otros profesores. Solo se elimina la relación `estudiante_grupo`.

### También en browser console:
```js
localStorage.removeItem('onboarding_checklist_dismissed');
```
