-- 1. Permitir todas las operaciones sobre entidades_educativas para el cliente de servicio
ALTER TABLE public.entidades_educativas ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Los profesores pueden crear entidades educativas" ON public.entidades_educativas;
DROP POLICY IF EXISTS "Los profesores pueden ver todas las entidades educativas" ON public.entidades_educativas;
DROP POLICY IF EXISTS "Los profesores pueden ver entidades educativas a las que perten" ON public.entidades_educativas;

-- Permitir inserción sin restricciones para servicio-role
CREATE POLICY "Servicio puede insertar entidades educativas"
ON public.entidades_educativas
FOR INSERT
TO service_role
WITH CHECK (true);

-- Permitir selección sin restricciones para servicio-role
CREATE POLICY "Servicio puede ver todas las entidades educativas"
ON public.entidades_educativas
FOR SELECT
TO service_role
USING (true);

-- Permitir a los profesores ver todas las entidades educativas
CREATE POLICY "Los profesores pueden ver todas las entidades educativas"
ON public.entidades_educativas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profesores
    WHERE id = auth.uid()
  )
);

-- 2. Función mejorada para crear profesores con un nombre más apropiado
CREATE OR REPLACE FUNCTION public.crear_profesor_mejorado(p_id uuid, p_email text)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nombre_generado text;
BEGIN
  -- Generar un nombre apropiado a partir del email
  nombre_generado := COALESCE(
    INITCAP(SPLIT_PART(p_email, '@', 1)),
    'Profesor'
  );
  
  -- Reemplazar puntos y guiones por espacios para formar un nombre más natural
  nombre_generado := REPLACE(REPLACE(nombre_generado, '.', ' '), '-', ' ');
  
  -- Insertar el profesor con un nombre generado más apropiado
  INSERT INTO public.profesores (id, nombre_completo)
  VALUES (p_id, nombre_generado);
  
  RETURN TRUE;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error creating profesor: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Dar permisos a usuarios autenticados para usar esta función
GRANT EXECUTE ON FUNCTION public.crear_profesor_mejorado(uuid, text) TO authenticated; 