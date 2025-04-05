-- Actualizar la tabla de profesores para incluir los campos adicionales
ALTER TABLE public.profesores
DROP COLUMN IF EXISTS nombre_completo,
ADD COLUMN IF NOT EXISTS nombres TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS apellidos TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS telefono TEXT,
ADD COLUMN IF NOT EXISTS cargo TEXT,
ADD COLUMN IF NOT EXISTS biografia TEXT;

-- Actualizar los registros existentes para separar nombres y apellidos
WITH user_emails AS (
  SELECT id, email 
  FROM auth.users
)
UPDATE public.profesores p
SET 
  nombres = SPLIT_PART(u.email, '@', 1),
  apellidos = ''
FROM user_emails u
WHERE p.id = u.id AND p.nombres = ''; 