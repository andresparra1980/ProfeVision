-- Paso 1: Añadir la columna periodo_escolar
ALTER TABLE grupos ADD COLUMN IF NOT EXISTS periodo_escolar TEXT;

-- Paso 2: Copiar datos de año_escolar a periodo_escolar
UPDATE grupos SET periodo_escolar = año_escolar WHERE periodo_escolar IS NULL;

-- Paso 3: Crear un trigger para mantener sincronizadas ambas columnas
CREATE OR REPLACE FUNCTION sync_periodo_escolar() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.periodo_escolar IS DISTINCT FROM OLD.periodo_escolar THEN
    NEW.año_escolar := NEW.periodo_escolar;
  ELSIF NEW.año_escolar IS DISTINCT FROM OLD.año_escolar THEN
    NEW.periodo_escolar := NEW.año_escolar;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_periodo_escolar_trigger ON grupos;

CREATE TRIGGER sync_periodo_escolar_trigger
BEFORE UPDATE ON grupos
FOR EACH ROW
EXECUTE FUNCTION sync_periodo_escolar();

-- Paso 4: Añadir comentario descriptivo a la columna
COMMENT ON COLUMN grupos.periodo_escolar IS 'Periodo escolar en formato YYYY o NS-YYYY (N=número de semestre, S=semestre, YYYY=año)';

-- NOTAS:
-- 1. Ejecutar este script en el panel SQL de Supabase
-- 2. Si se produce algún error, detener la ejecución y revisar
-- 3. No eliminar la columna año_escolar hasta que todas las referencias hayan sido actualizadas 