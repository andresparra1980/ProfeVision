-- Crear función RPC para insertar estudiantes
CREATE OR REPLACE FUNCTION insertar_estudiantes(estudiantes JSONB)
RETURNS SETOF UUID AS $$
DECLARE
  estudiante JSONB;
  nuevo_id UUID;
BEGIN
  -- Iterar sobre cada estudiante en el array JSON
  FOR estudiante IN SELECT * FROM jsonb_array_elements(estudiantes)
  LOOP
    -- Insertar el estudiante y obtener su ID
    INSERT INTO estudiantes (
      nombre_completo, 
      identificacion, 
      email
    ) VALUES (
      estudiante->>'nombre_completo',
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
$$ LANGUAGE plpgsql SECURITY DEFINER; 