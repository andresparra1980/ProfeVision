-- Consultas para verificar migración (ver archivo completo para detalles)

-- Verificar que la columna periodo_escolar existe
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'grupos' AND column_name = 'periodo_escolar';

-- Verificar que el trigger existe
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'grupos' AND trigger_name = 'sync_periodo_escolar_trigger';

-- Verificar que los datos se hayan migrado correctamente
SELECT id, nombre, año_escolar, periodo_escolar
FROM grupos
WHERE año_escolar IS DISTINCT FROM periodo_escolar
   OR (año_escolar IS NULL AND periodo_escolar IS NOT NULL)
   OR (año_escolar IS NOT NULL AND periodo_escolar IS NULL);

-- Verificar el funcionamiento del trigger
-- (Ejecutar después de hacer una actualización manual para probar)
UPDATE grupos
SET periodo_escolar = CASE WHEN periodo_escolar = '2025' THEN '1S-2025' ELSE '2025' END
WHERE id = (SELECT id FROM grupos LIMIT 1);

SELECT id, nombre, año_escolar, periodo_escolar
FROM grupos
WHERE id = (SELECT id FROM grupos LIMIT 1);
