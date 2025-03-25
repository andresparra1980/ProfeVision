-- Función para verificar si un profesor existe
CREATE OR REPLACE FUNCTION public.check_profesor_exists(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  exists_professor boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.profesores WHERE id = p_id
  ) INTO exists_professor;

  RETURN exists_professor;
END;
$$;

-- Función para crear una entidad educativa y devolver su ID
CREATE OR REPLACE FUNCTION public.crear_entidad_educativa(p_nombre text, p_tipo text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  entity_id uuid;
BEGIN
  INSERT INTO public.entidades_educativas (nombre, tipo)
  VALUES (p_nombre, p_tipo)
  RETURNING id INTO entity_id;
  
  RETURN entity_id;
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error creating entidad_educativa: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- Función para crear una relación profesor-entidad
CREATE OR REPLACE FUNCTION public.crear_relacion_profesor_entidad(p_profesor_id uuid, p_entidad_id uuid, p_es_admin boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profesor_entidad (profesor_id, entidad_educativa_id, es_administrador)
  VALUES (p_profesor_id, p_entidad_id, p_es_admin);
  
  RETURN TRUE;
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error creating profesor_entidad relation: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Otorgar permisos para usar estas funciones a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.check_profesor_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crear_entidad_educativa(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crear_relacion_profesor_entidad(uuid, uuid, boolean) TO authenticated; 