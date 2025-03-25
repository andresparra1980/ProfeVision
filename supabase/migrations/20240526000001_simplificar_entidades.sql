-- Simplificar la tabla de entidades_educativas
-- Primero eliminar columnas innecesarias
ALTER TABLE public.entidades_educativas
  DROP COLUMN IF EXISTS direccion,
  DROP COLUMN IF EXISTS ciudad,
  DROP COLUMN IF EXISTS pais,
  DROP COLUMN IF EXISTS telefono,
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS website,
  DROP COLUMN IF EXISTS logo_url;

-- Asegurarse de que RLS está habilitado
ALTER TABLE public.entidades_educativas ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Los profesores pueden ver entidades educativas a las que perten" ON public.entidades_educativas;
DROP POLICY IF EXISTS "Los profesores pueden crear entidades educativas" ON public.entidades_educativas;
DROP POLICY IF EXISTS "Los profesores pueden ver todas las entidades educativas" ON public.entidades_educativas;

-- Actualizar políticas para hacer más permisivo el sistema
-- Permitir a los profesores crear entidades educativas sin restricciones
CREATE POLICY "Los profesores pueden crear entidades educativas"
ON public.entidades_educativas
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profesores
    WHERE id = auth.uid()
  )
);

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

-- Comentario sobre el cambio
COMMENT ON TABLE public.entidades_educativas IS 'Tabla simplificada para instituciones educativas creadas por profesores'; 