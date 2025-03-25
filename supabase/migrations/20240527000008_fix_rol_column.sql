-- Corregir la función para incluir la columna 'rol' en la relación profesor-entidad
CREATE OR REPLACE FUNCTION public.crear_relacion_profesor_entidad(p_profesor_id uuid, p_entidad_id uuid, p_es_admin boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profesor_entidad (profesor_id, entidad_id, rol)
  VALUES (p_profesor_id, p_entidad_id, CASE WHEN p_es_admin THEN 'Administrador' ELSE 'Profesor' END);
  
  RETURN TRUE;
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error creating profesor_entidad relation: %', SQLERRM;
    RETURN FALSE;
END;
$$; 