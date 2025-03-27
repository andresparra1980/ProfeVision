-- Crear tabla examen_grupo
CREATE TABLE examen_grupo (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    examen_id UUID NOT NULL REFERENCES examenes(id) ON DELETE CASCADE,
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    fecha_aplicacion TIMESTAMP WITH TIME ZONE,
    duracion_minutos INTEGER,
    estado VARCHAR(20) DEFAULT 'programado' CHECK (estado IN ('programado', 'en_progreso', 'completado', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(examen_id, grupo_id)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_examen_grupo_examen_id ON examen_grupo(examen_id);
CREATE INDEX idx_examen_grupo_grupo_id ON examen_grupo(grupo_id);

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_examen_grupo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_examen_grupo_updated_at
    BEFORE UPDATE ON examen_grupo
    FOR EACH ROW
    EXECUTE FUNCTION update_examen_grupo_updated_at();

-- Agregar políticas RLS
ALTER TABLE examen_grupo ENABLE ROW LEVEL SECURITY;

-- Política para permitir a los profesores ver sus exámenes asignados a grupos
CREATE POLICY "Profesores pueden ver sus exámenes asignados a grupos"
    ON examen_grupo FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM examenes e
            JOIN materias m ON e.materia_id = m.id
            JOIN profesores p ON m.profesor_id = p.id
            WHERE e.id = examen_grupo.examen_id
            AND p.id = auth.uid()
        )
    );

-- Política para permitir a los profesores crear asignaciones de exámenes a grupos
CREATE POLICY "Profesores pueden crear asignaciones de exámenes a grupos"
    ON examen_grupo FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM examenes e
            JOIN materias m ON e.materia_id = m.id
            JOIN profesores p ON m.profesor_id = p.id
            WHERE e.id = examen_grupo.examen_id
            AND p.id = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 FROM grupos g
            JOIN materias m ON g.materia_id = m.id
            JOIN profesores p ON m.profesor_id = p.id
            WHERE g.id = examen_grupo.grupo_id
            AND p.id = auth.uid()
        )
    );

-- Política para permitir a los profesores actualizar sus asignaciones de exámenes
CREATE POLICY "Profesores pueden actualizar sus asignaciones de exámenes"
    ON examen_grupo FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM examenes e
            JOIN materias m ON e.materia_id = m.id
            JOIN profesores p ON m.profesor_id = p.id
            WHERE e.id = examen_grupo.examen_id
            AND p.id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM examenes e
            JOIN materias m ON e.materia_id = m.id
            JOIN profesores p ON m.profesor_id = p.id
            WHERE e.id = examen_grupo.examen_id
            AND p.id = auth.uid()
        )
    );

-- Política para permitir a los profesores eliminar sus asignaciones de exámenes
CREATE POLICY "Profesores pueden eliminar sus asignaciones de exámenes"
    ON examen_grupo FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM examenes e
            JOIN materias m ON e.materia_id = m.id
            JOIN profesores p ON m.profesor_id = p.id
            WHERE e.id = examen_grupo.examen_id
            AND p.id = auth.uid()
        )
    ); 