-- Solución definitiva para políticas RLS en entidades_educativas
-- Primero deshabilitar RLS temporalmente para asegurar que podemos hacer cambios
ALTER TABLE public.entidades_educativas DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Los profesores pueden crear entidades educativas" ON public.entidades_educativas;
DROP POLICY IF EXISTS "Los profesores pueden ver todas las entidades educativas" ON public.entidades_educativas;
DROP POLICY IF EXISTS "Los profesores pueden ver entidades educativas a las que perten" ON public.entidades_educativas;
DROP POLICY IF EXISTS "Servicio puede insertar entidades educativas" ON public.entidades_educativas;
DROP POLICY IF EXISTS "Servicio puede ver todas las entidades educativas" ON public.entidades_educativas;

-- Volver a habilitar RLS
ALTER TABLE public.entidades_educativas ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir al rol de servicio TODAS las operaciones
CREATE POLICY "service_role_all_operations" 
ON public.entidades_educativas
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Crear política para permitir a los profesores autenticados VER todas las entidades
CREATE POLICY "authenticated_users_select"
ON public.entidades_educativas
FOR SELECT
TO authenticated
USING (true);

-- Política para permitir a profesores crear entidades (aunque ahora usamos el service_role)
CREATE POLICY "authenticated_users_insert"
ON public.entidades_educativas
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profesores
    WHERE id = auth.uid()
  )
);

-- Habilitar también políticas similares para la tabla profesor_entidad
ALTER TABLE public.profesor_entidad ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes en profesor_entidad
DROP POLICY IF EXISTS "Servicio puede insertar relaciones profesor-entidad" ON public.profesor_entidad;

-- Crear política para permitir al rol de servicio TODAS las operaciones en profesor_entidad
CREATE POLICY "service_role_all_operations" 
ON public.profesor_entidad
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true); 