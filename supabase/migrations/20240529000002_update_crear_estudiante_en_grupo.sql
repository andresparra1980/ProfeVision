-- Actualizar la función crear_estudiante_en_grupo para usar nombres y apellidos
CREATE OR REPLACE FUNCTION public.crear_estudiante_en_grupo(
  p_nombres text,
  p_apellidos text,
  p_identificacion text,
  p_email text,
  p_grupo_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_estudiante_id UUID;
  v_profesor_id UUID;
BEGIN
  -- Obtener el profesor_id del grupo
  SELECT profesor_id INTO v_profesor_id
  FROM grupos
  WHERE id = p_grupo_id;

  -- Verificar que el grupo pertenece al profesor actual
  IF v_profesor_id != auth.uid() THEN
    RAISE EXCEPTION 'No tienes permiso para agregar estudiantes a este grupo';
  END IF;

  -- Crear el estudiante
  INSERT INTO estudiantes (nombres, apellidos, identificacion, email)
  VALUES (p_nombres, p_apellidos, p_identificacion, p_email)
  RETURNING id INTO v_estudiante_id;

  -- Asignar el estudiante al grupo
  INSERT INTO estudiante_grupo (estudiante_id, grupo_id)
  VALUES (v_estudiante_id, p_grupo_id);

  RETURN v_estudiante_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Si algo falla, eliminar el estudiante si fue creado
    IF v_estudiante_id IS NOT NULL THEN
      DELETE FROM estudiantes WHERE id = v_estudiante_id;
    END IF;
    RAISE;
END;
$$; 