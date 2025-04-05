-- Actualizar la función insertar_estudiantes para usar nombres y apellidos
CREATE OR REPLACE FUNCTION public.insertar_estudiantes(estudiantes jsonb)
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  estudiante JSONB;
  nuevo_id UUID;
BEGIN
  -- Iterar sobre cada estudiante en el array JSON
  FOR estudiante IN SELECT * FROM jsonb_array_elements(estudiantes)
  LOOP
    -- Insertar el estudiante y obtener su ID
    INSERT INTO estudiantes (
      nombres,
      apellidos,
      identificacion, 
      email
    ) VALUES (
      estudiante->>'nombres',
      estudiante->>'apellidos',
      estudiante->>'identificacion',
      estudiante->>'email'
    )
    ON CONFLICT (identificacion) DO NOTHING
    RETURNING id INTO nuevo_id;
    
    -- Si se insertó correctamente, devolver el ID
    IF nuevo_id IS NOT NULL THEN
      RETURN NEXT nuevo_id;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$; 