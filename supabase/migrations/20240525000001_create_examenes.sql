-- Crear tabla para materias/asignaturas
CREATE TABLE IF NOT EXISTS public.materias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  profesor_id UUID NOT NULL REFERENCES public.profesores(id) ON DELETE CASCADE,
  entidad_id UUID REFERENCES public.entidades_educativas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear tabla para grupos/clases
CREATE TABLE IF NOT EXISTS public.grupos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  materia_id UUID NOT NULL REFERENCES public.materias(id) ON DELETE CASCADE,
  profesor_id UUID NOT NULL REFERENCES public.profesores(id) ON DELETE CASCADE,
  año_escolar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear tabla para estudiantes
CREATE TABLE IF NOT EXISTS public.estudiantes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_completo TEXT NOT NULL,
  identificacion TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(identificacion)
);

-- Relación entre estudiantes y grupos
CREATE TABLE IF NOT EXISTS public.estudiante_grupo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estudiante_id UUID NOT NULL REFERENCES public.estudiantes(id) ON DELETE CASCADE,
  grupo_id UUID NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(estudiante_id, grupo_id)
);

-- Tabla para exámenes
CREATE TABLE IF NOT EXISTS public.examenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  instrucciones TEXT,
  materia_id UUID NOT NULL REFERENCES public.materias(id) ON DELETE CASCADE,
  profesor_id UUID NOT NULL REFERENCES public.profesores(id) ON DELETE CASCADE,
  estado TEXT NOT NULL DEFAULT 'borrador', -- 'borrador', 'publicado', 'archivado'
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duracion_minutos INTEGER,
  puntaje_total DECIMAL(5,2) DEFAULT 100.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla para tipos de preguntas
CREATE TABLE IF NOT EXISTS public.tipos_pregunta (
  id TEXT PRIMARY KEY, -- 'opcion_multiple', 'verdadero_falso', 'respuesta_corta', etc.
  nombre TEXT NOT NULL,
  descripcion TEXT
);

-- Insertar tipos de preguntas básicos
INSERT INTO public.tipos_pregunta (id, nombre, descripcion) VALUES
('opcion_multiple', 'Opción múltiple', 'Pregunta con varias opciones donde solo una es correcta'),
('verdadero_falso', 'Verdadero/Falso', 'Pregunta donde la respuesta es verdadero o falso'),
('seleccion_multiple', 'Selección múltiple', 'Pregunta con varias opciones donde varias pueden ser correctas')
ON CONFLICT (id) DO NOTHING;

-- Tabla para preguntas
CREATE TABLE IF NOT EXISTS public.preguntas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  examen_id UUID NOT NULL REFERENCES public.examenes(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  tipo_id TEXT NOT NULL REFERENCES public.tipos_pregunta(id),
  puntaje DECIMAL(5,2) NOT NULL DEFAULT 1.0,
  dificultad TEXT, -- 'facil', 'media', 'dificil'
  retroalimentacion TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla para opciones de respuesta
CREATE TABLE IF NOT EXISTS public.opciones_respuesta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pregunta_id UUID NOT NULL REFERENCES public.preguntas(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  es_correcta BOOLEAN NOT NULL DEFAULT FALSE,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla para versiones del examen
CREATE TABLE IF NOT EXISTS public.versiones_examen (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  examen_id UUID NOT NULL REFERENCES public.examenes(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  orden_preguntas JSONB, -- Array con el orden de las preguntas en esta versión
  orden_opciones JSONB, -- Objeto con el orden de las opciones por pregunta
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(examen_id, codigo)
);

-- Tabla para aplicaciones de examen
CREATE TABLE IF NOT EXISTS public.aplicaciones_examen (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  examen_id UUID NOT NULL REFERENCES public.examenes(id) ON DELETE CASCADE,
  grupo_id UUID NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  fecha_aplicacion DATE NOT NULL,
  hora_inicio TIME,
  hora_fin TIME,
  estado TEXT NOT NULL DEFAULT 'programado', -- 'programado', 'en_progreso', 'finalizado', 'cancelado'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla para resultados de los estudiantes
CREATE TABLE IF NOT EXISTS public.resultados_examen (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aplicacion_id UUID NOT NULL REFERENCES public.aplicaciones_examen(id) ON DELETE CASCADE,
  estudiante_id UUID NOT NULL REFERENCES public.estudiantes(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES public.versiones_examen(id) ON DELETE CASCADE,
  puntaje_obtenido DECIMAL(5,2),
  porcentaje DECIMAL(5,2),
  tiempo_utilizado INTEGER, -- en minutos
  estado TEXT NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'en_progreso', 'completado', 'ausente'
  fecha_calificacion TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(aplicacion_id, estudiante_id)
);

-- Tabla para respuestas de los estudiantes
CREATE TABLE IF NOT EXISTS public.respuestas_estudiante (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resultado_id UUID NOT NULL REFERENCES public.resultados_examen(id) ON DELETE CASCADE,
  pregunta_id UUID NOT NULL REFERENCES public.preguntas(id) ON DELETE CASCADE,
  opcion_id UUID REFERENCES public.opciones_respuesta(id) ON DELETE SET NULL,
  es_correcta BOOLEAN,
  puntaje_obtenido DECIMAL(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(resultado_id, pregunta_id)
);

-- Aplicar triggers para updated_at
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.materias
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.grupos
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.estudiantes
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.estudiante_grupo
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.examenes
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.preguntas
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.opciones_respuesta
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.versiones_examen
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.aplicaciones_examen
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.resultados_examen
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.respuestas_estudiante
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp(); 