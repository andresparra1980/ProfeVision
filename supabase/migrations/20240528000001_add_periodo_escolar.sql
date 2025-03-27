-- Add periodo_escolar column to grupos table
ALTER TABLE grupos ADD COLUMN IF NOT EXISTS periodo_escolar TEXT;

-- Migrate existing data from año_escolar to periodo_escolar
UPDATE grupos SET periodo_escolar = año_escolar WHERE periodo_escolar IS NULL;

-- Create a trigger to keep both columns in sync
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

-- Add comment to the column
COMMENT ON COLUMN grupos.periodo_escolar IS 'Periodo escolar en formato YYYY o NS-YYYY (N=número de semestre, S=semestre, YYYY=año)'; 