# Testing Onboarding

## Resetear estado para pruebas

### Via SQL (Supabase)

```sql
-- Obtener tu user_id
SELECT id, nombres, apellidos, onboarding_status, first_login_completed
FROM profesores 
WHERE id = (SELECT id FROM auth.users WHERE email = 'tu@email.com');

-- Resetear a estado "usuario nuevo post-migración" (verá wizard)
UPDATE profesores 
SET onboarding_status = '{"wizard_completed": false, "wizard_step": 0}'::jsonb
WHERE id = 'TU_USER_ID';

-- Resetear completamente (NULL = usuario legacy, NO verá wizard)
UPDATE profesores 
SET onboarding_status = NULL 
WHERE id = 'TU_USER_ID';

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
WHERE id = 'TU_USER_ID';
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
