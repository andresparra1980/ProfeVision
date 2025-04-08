-- Función que se ejecutará cuando se inserten o actualicen resultados de exámenes
CREATE OR REPLACE FUNCTION sincronizar_calificaciones_examen()
RETURNS TRIGGER AS $$
DECLARE
    vinculo RECORD;
    calificacion_id UUID;
    nueva_calificacion NUMERIC;
BEGIN
    -- Solo proceder si el estado es "CALIFICADO"
    IF NEW.estado = 'CALIFICADO' THEN
        -- Buscar si este examen está vinculado a algún componente de calificación
        FOR vinculo IN
            SELECT componente_id 
            FROM examenes_a_componentes_calificacion 
            WHERE examen_id = NEW.examen_id
        LOOP
            -- Calcular la calificación (convertir porcentaje a escala 0-5)
            nueva_calificacion := NEW.porcentaje / 20.0;
            
            -- Verificar si ya existe una calificación para este estudiante y componente
            SELECT id INTO calificacion_id
            FROM calificaciones
            WHERE estudiante_id = NEW.estudiante_id AND componente_id = vinculo.componente_id;
            
            -- Si existe, actualizar; si no, insertar
            IF calificacion_id IS NOT NULL THEN
                UPDATE calificaciones 
                SET valor = nueva_calificacion, updated_at = NOW()
                WHERE id = calificacion_id;
            ELSE
                INSERT INTO calificaciones (id, estudiante_id, componente_id, valor, created_at, updated_at)
                VALUES (gen_random_uuid(), NEW.estudiante_id, vinculo.componente_id, nueva_calificacion, NOW(), NOW());
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger en la tabla resultados_examen
DROP TRIGGER IF EXISTS sincronizar_calificaciones_trigger ON resultados_examen;

CREATE TRIGGER sincronizar_calificaciones_trigger
AFTER INSERT OR UPDATE ON resultados_examen
FOR EACH ROW
EXECUTE FUNCTION sincronizar_calificaciones_examen();

-- Comentario explicativo
COMMENT ON FUNCTION sincronizar_calificaciones_examen() IS 'Función que sincroniza automáticamente las calificaciones de exámenes con los componentes de calificación vinculados. Se ejecuta cuando se inserta o actualiza un resultado de examen con estado CALIFICADO.';
COMMENT ON TRIGGER sincronizar_calificaciones_trigger ON resultados_examen IS 'Trigger que ejecuta la sincronización de calificaciones de exámenes cuando se registra o actualiza un resultado de examen.'; 