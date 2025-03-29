-- Crear tabla para almacenar escaneos de exámenes
CREATE TABLE IF NOT EXISTS exam_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL UNIQUE,
  image_path TEXT NOT NULL,
  exam_id UUID REFERENCES examenes(id) ON DELETE SET NULL,
  student_id UUID REFERENCES estudiantes(id) ON DELETE SET NULL,
  group_id UUID REFERENCES grupos(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_queue', 'processing', 'completed', 'error')),
  result JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS exam_scans_job_id_idx ON exam_scans(job_id);
CREATE INDEX IF NOT EXISTS exam_scans_status_idx ON exam_scans(status);
CREATE INDEX IF NOT EXISTS exam_scans_exam_id_idx ON exam_scans(exam_id);
CREATE INDEX IF NOT EXISTS exam_scans_student_id_idx ON exam_scans(student_id);

-- Configurar trigger para actualizar el updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_exam_scans_updated_at ON exam_scans;
CREATE TRIGGER update_exam_scans_updated_at
BEFORE UPDATE ON exam_scans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Configurar políticas RLS
ALTER TABLE exam_scans ENABLE ROW LEVEL SECURITY;

-- Crear políticas de acceso
-- 1. Política para administradores (acceso total)
CREATE POLICY admin_access_exam_scans
ON exam_scans
FOR ALL
TO authenticated
USING (auth.jwt() ? 'user_role' AND auth.jwt()->>'user_role' = 'admin');

-- 2. Política para profesores (ver sus propios exámenes)
CREATE POLICY teacher_select_exam_scans
ON exam_scans
FOR SELECT
TO authenticated
USING (
  exam_id IN (
    SELECT id FROM examenes WHERE profesor_id = auth.uid()
  )
);

-- 3. Política para el microservicio (usar service role)
COMMENT ON TABLE exam_scans IS 'Tabla para almacenar escaneos de exámenes y su estado de procesamiento.
El microservicio debe usar service_role para omitir las RLS policies.';

-- 4. Permitir inserción a usuarios autenticados
CREATE POLICY insert_own_scan
ON exam_scans
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. Permitir actualización solo a las propias filas para profesores
CREATE POLICY update_own_exam_scans
ON exam_scans
FOR UPDATE
TO authenticated
USING (
  exam_id IN (
    SELECT id FROM examenes WHERE profesor_id = auth.uid()
  )
)
WITH CHECK (
  exam_id IN (
    SELECT id FROM examenes WHERE profesor_id = auth.uid()
  )
); 