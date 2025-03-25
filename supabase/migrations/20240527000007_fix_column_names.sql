-- Corregir la función para crear una relación profesor-entidad con el nombre correcto de la columna
CREATE OR REPLACE FUNCTION public.crear_relacion_profesor_entidad(p_profesor_id uuid, p_entidad_id uuid, p_es_admin boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profesor_entidad (profesor_id, entidad_id)
  VALUES (p_profesor_id, p_entidad_id);
  
  RETURN TRUE;
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error creating profesor_entidad relation: %', SQLERRM;
    RETURN FALSE;
END;
$$; 