-- Habilitar Row Level Security (RLS) en todas las tablas
ALTER TABLE public.profesores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entidades_educativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profesor_entidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudiante_grupo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_pregunta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opciones_respuesta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.versiones_examen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aplicaciones_examen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resultados_examen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respuestas_estudiante ENABLE ROW LEVEL SECURITY;

-- Crear función para verificar si el usuario actual es el profesor
CREATE OR REPLACE FUNCTION public.es_profesor_actual(profesor_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() = profesor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear función para verificar si el usuario pertenece a una entidad
CREATE OR REPLACE FUNCTION public.es_miembro_entidad(entidad_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profesor_entidad
    WHERE profesor_id = auth.uid() AND entidad_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para la tabla profesores
CREATE POLICY "Los profesores pueden ver su propio perfil"
  ON public.profesores FOR SELECT
  USING (auth.uid() = id);
  
CREATE POLICY "Los profesores pueden actualizar su propio perfil"
  ON public.profesores FOR UPDATE
  USING (auth.uid() = id);

-- Políticas para la tabla entidades_educativas
CREATE POLICY "Los profesores pueden ver entidades educativas a las que pertenecen"
  ON public.entidades_educativas FOR SELECT
  USING (public.es_miembro_entidad(id) OR EXISTS (
    SELECT 1 FROM public.materias 
    WHERE entidad_id = public.entidades_educativas.id 
    AND profesor_id = auth.uid()
  ));

-- Políticas para la tabla profesor_entidad
CREATE POLICY "Los profesores pueden ver sus propias relaciones con entidades"
  ON public.profesor_entidad FOR SELECT
  USING (profesor_id = auth.uid());

-- Políticas para la tabla materias
CREATE POLICY "Los profesores pueden ver sus propias materias"
  ON public.materias FOR SELECT
  USING (profesor_id = auth.uid());
  
CREATE POLICY "Los profesores pueden crear sus propias materias"
  ON public.materias FOR INSERT
  WITH CHECK (profesor_id = auth.uid());
  
CREATE POLICY "Los profesores pueden actualizar sus propias materias"
  ON public.materias FOR UPDATE
  USING (profesor_id = auth.uid());
  
CREATE POLICY "Los profesores pueden eliminar sus propias materias"
  ON public.materias FOR DELETE
  USING (profesor_id = auth.uid());

-- Políticas para la tabla grupos
CREATE POLICY "Los profesores pueden ver sus propios grupos"
  ON public.grupos FOR SELECT
  USING (profesor_id = auth.uid());
  
CREATE POLICY "Los profesores pueden crear sus propios grupos"
  ON public.grupos FOR INSERT
  WITH CHECK (profesor_id = auth.uid());
  
CREATE POLICY "Los profesores pueden actualizar sus propios grupos"
  ON public.grupos FOR UPDATE
  USING (profesor_id = auth.uid());
  
CREATE POLICY "Los profesores pueden eliminar sus propios grupos"
  ON public.grupos FOR DELETE
  USING (profesor_id = auth.uid());

-- Políticas para la tabla estudiantes
CREATE POLICY "Los profesores pueden ver estudiantes de sus grupos"
  ON public.estudiantes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.estudiante_grupo eg
    JOIN public.grupos g ON eg.grupo_id = g.id
    WHERE eg.estudiante_id = public.estudiantes.id
    AND g.profesor_id = auth.uid()
  ));
  
CREATE POLICY "Los profesores pueden crear estudiantes para sus grupos"
  ON public.estudiantes FOR INSERT
  WITH CHECK (TRUE); -- La validación se hace al asignar al grupo
  
CREATE POLICY "Los profesores pueden actualizar estudiantes de sus grupos"
  ON public.estudiantes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.estudiante_grupo eg
    JOIN public.grupos g ON eg.grupo_id = g.id
    WHERE eg.estudiante_id = public.estudiantes.id
    AND g.profesor_id = auth.uid()
  ));

-- Políticas para la tabla estudiante_grupo
CREATE POLICY "Los profesores pueden ver relaciones estudiante-grupo de sus grupos"
  ON public.estudiante_grupo FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.grupos g
    WHERE g.id = public.estudiante_grupo.grupo_id
    AND g.profesor_id = auth.uid()
  ));
  
CREATE POLICY "Los profesores pueden asignar estudiantes a sus grupos"
  ON public.estudiante_grupo FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.grupos g
    WHERE g.id = public.estudiante_grupo.grupo_id
    AND g.profesor_id = auth.uid()
  ));
  
CREATE POLICY "Los profesores pueden eliminar estudiantes de sus grupos"
  ON public.estudiante_grupo FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.grupos g
    WHERE g.id = public.estudiante_grupo.grupo_id
    AND g.profesor_id = auth.uid()
  ));

-- Políticas para la tabla tipos_pregunta
CREATE POLICY "Todos pueden ver los tipos de pregunta"
  ON public.tipos_pregunta FOR SELECT
  USING (TRUE);

-- Políticas para la tabla examenes
CREATE POLICY "Los profesores pueden ver sus propios exámenes"
  ON public.examenes FOR SELECT
  USING (profesor_id = auth.uid());
  
CREATE POLICY "Los profesores pueden crear sus propios exámenes"
  ON public.examenes FOR INSERT
  WITH CHECK (profesor_id = auth.uid());
  
CREATE POLICY "Los profesores pueden actualizar sus propios exámenes"
  ON public.examenes FOR UPDATE
  USING (profesor_id = auth.uid());
  
CREATE POLICY "Los profesores pueden eliminar sus propios exámenes"
  ON public.examenes FOR DELETE
  USING (profesor_id = auth.uid());

-- Políticas para las demás tablas relacionadas con exámenes (cascada)
-- Preguntas
CREATE POLICY "Los profesores pueden ver preguntas de sus exámenes"
  ON public.preguntas FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.examenes e
    WHERE e.id = public.preguntas.examen_id
    AND e.profesor_id = auth.uid()
  ));

CREATE POLICY "Los profesores pueden crear preguntas para sus exámenes"
  ON public.preguntas FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.examenes e
    WHERE e.id = public.preguntas.examen_id
    AND e.profesor_id = auth.uid()
  ));

CREATE POLICY "Los profesores pueden actualizar preguntas de sus exámenes"
  ON public.preguntas FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.examenes e
    WHERE e.id = public.preguntas.examen_id
    AND e.profesor_id = auth.uid()
  ));

CREATE POLICY "Los profesores pueden eliminar preguntas de sus exámenes"
  ON public.preguntas FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.examenes e
    WHERE e.id = public.preguntas.examen_id
    AND e.profesor_id = auth.uid()
  ));

-- Opciones de respuesta
CREATE POLICY "Los profesores pueden ver opciones de respuesta de sus preguntas"
  ON public.opciones_respuesta FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.preguntas p
    JOIN public.examenes e ON p.examen_id = e.id
    WHERE p.id = public.opciones_respuesta.pregunta_id
    AND e.profesor_id = auth.uid()
  ));

CREATE POLICY "Los profesores pueden crear opciones de respuesta para sus preguntas"
  ON public.opciones_respuesta FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.preguntas p
    JOIN public.examenes e ON p.examen_id = e.id
    WHERE p.id = public.opciones_respuesta.pregunta_id
    AND e.profesor_id = auth.uid()
  ));

CREATE POLICY "Los profesores pueden actualizar opciones de respuesta de sus preguntas"
  ON public.opciones_respuesta FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.preguntas p
    JOIN public.examenes e ON p.examen_id = e.id
    WHERE p.id = public.opciones_respuesta.pregunta_id
    AND e.profesor_id = auth.uid()
  ));

CREATE POLICY "Los profesores pueden eliminar opciones de respuesta de sus preguntas"
  ON public.opciones_respuesta FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.preguntas p
    JOIN public.examenes e ON p.examen_id = e.id
    WHERE p.id = public.opciones_respuesta.pregunta_id
    AND e.profesor_id = auth.uid()
  ));

-- Políticas similares para versiones_examen, aplicaciones_examen, resultados_examen, respuestas_estudiante
-- siguiendo la misma lógica de acceso basado en propiedad

-- Trigger para crear automáticamente el registro en profesores cuando se crea un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profesores (id, nombre_completo)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Usuario'));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que se activa cuando se crea un nuevo usuario en auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Permitir acceso anónimo a tipos_pregunta para consulta (solo lectura)
GRANT SELECT ON public.tipos_pregunta TO anon; 