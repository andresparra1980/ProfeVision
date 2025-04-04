-- Crear tabla de calificaciones
CREATE TABLE IF NOT EXISTS calificaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  estudiante_id UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  componente_id UUID NOT NULL REFERENCES componentes_calificacion(id) ON DELETE CASCADE,
  valor NUMERIC(4,2) NOT NULL CHECK (valor >= 0 AND valor <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(estudiante_id, componente_id)
);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_calificaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calificaciones_updated_at
  BEFORE UPDATE ON calificaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_calificaciones_updated_at();

-- Políticas RLS
ALTER TABLE calificaciones ENABLE ROW LEVEL SECURITY;

-- Política para ver calificaciones (profesor del grupo o estudiante)
CREATE POLICY view_calificaciones ON calificaciones
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM componentes_calificacion c
      JOIN periodos_calificacion p ON c.periodo_id = p.id
      JOIN esquemas_calificacion e ON p.esquema_id = e.id
      JOIN grupos g ON e.grupo_id = g.id
      WHERE c.id = calificaciones.componente_id
      AND (
        g.profesor_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM estudiante_grupo eg
          WHERE eg.grupo_id = g.id
          AND eg.estudiante_id = calificaciones.estudiante_id
          AND calificaciones.estudiante_id = auth.uid()
        )
      )
    )
  );

-- Política para insertar/actualizar calificaciones (solo profesor del grupo)
CREATE POLICY insert_calificaciones ON calificaciones
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM componentes_calificacion c
      JOIN periodos_calificacion p ON c.periodo_id = p.id
      JOIN esquemas_calificacion e ON p.esquema_id = e.id
      JOIN grupos g ON e.grupo_id = g.id
      WHERE c.id = calificaciones.componente_id
      AND g.profesor_id = auth.uid()
    )
  );

CREATE POLICY update_calificaciones ON calificaciones
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM componentes_calificacion c
      JOIN periodos_calificacion p ON c.periodo_id = p.id
      JOIN esquemas_calificacion e ON p.esquema_id = e.id
      JOIN grupos g ON e.grupo_id = g.id
      WHERE c.id = calificaciones.componente_id
      AND g.profesor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM componentes_calificacion c
      JOIN periodos_calificacion p ON c.periodo_id = p.id
      JOIN esquemas_calificacion e ON p.esquema_id = e.id
      JOIN grupos g ON e.grupo_id = g.id
      WHERE c.id = calificaciones.componente_id
      AND g.profesor_id = auth.uid()
    )
  );

-- Función para calcular promedio de un periodo
CREATE OR REPLACE FUNCTION calcular_promedio_periodo(periodo_id UUID, estudiante_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  promedio NUMERIC;
BEGIN
  SELECT COALESCE(
    SUM(c.valor * cc.porcentaje / 100.0),
    0
  ) INTO promedio
  FROM calificaciones c
  JOIN componentes_calificacion cc ON c.componente_id = cc.id
  WHERE cc.periodo_id = $1
  AND c.estudiante_id = $2;
  
  RETURN promedio;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para calcular nota final
CREATE OR REPLACE FUNCTION calcular_nota_final(esquema_id UUID, estudiante_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  nota_final NUMERIC;
BEGIN
  SELECT COALESCE(
    SUM(
      calcular_promedio_periodo(p.id, $2) * p.porcentaje / 100.0
    ),
    0
  ) INTO nota_final
  FROM periodos_calificacion p
  WHERE p.esquema_id = $1;
  
  RETURN nota_final;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 