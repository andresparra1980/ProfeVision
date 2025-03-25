-- Función para crear profesores sin restricciones RLS
CREATE OR REPLACE FUNCTION public.crear_profesor(p_id uuid, p_nombre text)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insertar el profesor
  INSERT INTO public.profesores (id, nombre_completo)
  VALUES (p_id, p_nombre);
  
  RETURN TRUE;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error creating profesor: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Dar permisos a usuarios autenticados para usar esta función
GRANT EXECUTE ON FUNCTION public.crear_profesor(uuid, text) TO authenticated; 