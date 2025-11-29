-- ============================================================
-- MIGRACIÓN: Activar Onboarding para Nuevos Usuarios
-- ============================================================
-- Fecha: 2025-11-28
-- Descripción: Modifica handle_new_user() para que nuevos usuarios
--              entren al flujo de onboarding automáticamente.
--
-- ANTES: Nuevos usuarios tenían onboarding_status = NULL (legacy)
-- DESPUÉS: Nuevos usuarios tendrán onboarding_status con wizard pendiente
-- ============================================================

-- ============================================================
-- PASO 1: Actualizar la función handle_new_user()
-- ============================================================
-- Esta función es un trigger que se ejecuta cuando se crea
-- un nuevo usuario en auth.users

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Crear registro en profesores con onboarding activo
  INSERT INTO public.profesores (
    id, 
    nombres,
    apellidos,
    telefono,
    onboarding_status  -- NUEVO: inicializar onboarding
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'nombre', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
    COALESCE(NEW.raw_user_meta_data->>'telefono', ''),
    -- Inicializar onboarding para nuevos usuarios
    jsonb_build_object(
      'wizard_completed', false,
      'wizard_step', 0,
      'wizard_started_at', NOW(),
      'checklist_items', jsonb_build_object(
        'exam_created', false,
        'exam_published', false,
        'pdf_exported', false,
        'first_scan', false
      )
    )
  );
  
  RETURN NEW;
END;
$function$;

-- ============================================================
-- VERIFICACIÓN: Confirmar que la función se actualizó
-- ============================================================
-- Ejecutar después de aplicar la migración:

-- SELECT pg_get_functiondef(oid) 
-- FROM pg_proc 
-- WHERE proname = 'handle_new_user';

-- ============================================================
-- ROLLBACK (si es necesario revertir)
-- ============================================================
-- Para volver al comportamiento anterior (usuarios legacy):

/*
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profesores (
    id, 
    nombres,
    apellidos,
    telefono
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'nombre', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
    COALESCE(NEW.raw_user_meta_data->>'telefono', '')
  );
  
  RETURN NEW;
END;
$function$;
*/

-- ============================================================
-- NOTAS
-- ============================================================
-- 
-- 1. Esta migración NO afecta usuarios existentes
--    - Usuarios con onboarding_status = NULL siguen siendo legacy
--    - Solo nuevos registros tendrán el onboarding activo
--
-- 2. El trigger está asociado a auth.users
--    - Se ejecuta automáticamente en cada INSERT en auth.users
--    - No requiere cambios en el código de la aplicación
--
-- 3. Estructura del onboarding_status inicial:
--    {
--      "wizard_completed": false,
--      "wizard_step": 0,
--      "wizard_started_at": "2025-...",
--      "checklist_items": {
--        "exam_created": false,
--        "exam_published": false,
--        "pdf_exported": false,
--        "first_scan": false
--      }
--    }
--
-- 4. Para testing, crear usuario de prueba y verificar:
--    SELECT id, nombres, onboarding_status 
--    FROM profesores 
--    ORDER BY created_at DESC 
--    LIMIT 1;
--
-- ============================================================
