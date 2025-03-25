-- Actualizar la relación entre profesor_entidad y entidades_educativas si es necesario
DO $$
BEGIN
  -- Comprobar si existe la clave foránea con el nombre antiguo
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profesor_entidad_entidad_educativa_id_fkey' 
    AND table_name = 'profesor_entidad'
  ) THEN
    ALTER TABLE public.profesor_entidad 
    DROP CONSTRAINT profesor_entidad_entidad_educativa_id_fkey;
    
    -- Crear la restricción de clave foránea usando los nombres de columna correctos
    ALTER TABLE public.profesor_entidad
    ADD CONSTRAINT profesor_entidad_entidad_id_fkey
    FOREIGN KEY (entidad_id)
    REFERENCES public.entidades_educativas(id)
    ON DELETE CASCADE;
  END IF;
  
  -- Comprobar si existe la clave entidad_id pero no está referenciada
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profesor_entidad' AND column_name = 'entidad_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profesor_entidad_entidad_id_fkey' 
    AND table_name = 'profesor_entidad'
  ) THEN
    -- Crear la restricción de clave foránea
    ALTER TABLE public.profesor_entidad
    ADD CONSTRAINT profesor_entidad_entidad_id_fkey
    FOREIGN KEY (entidad_id)
    REFERENCES public.entidades_educativas(id)
    ON DELETE CASCADE;
  END IF;
END $$; 