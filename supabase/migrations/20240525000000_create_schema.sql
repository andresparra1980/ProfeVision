-- Establecer el esquema público para ProfeVision
CREATE SCHEMA IF NOT EXISTS public;

-- Activar las extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsquedas de texto eficientes
CREATE EXTENSION IF NOT EXISTS "unaccent"; -- Para manejar acentos en búsquedas

-- Crear tabla de profesores que extiende la información de auth.users
CREATE TABLE IF NOT EXISTS public.profesores (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  telefono TEXT,
  cargo TEXT,
  biografia TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear tabla de entidades educativas
CREATE TABLE IF NOT EXISTS public.entidades_educativas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'colegio', 'universidad', 'instituto', etc.
  direccion TEXT,
  ciudad TEXT,
  pais TEXT,
  telefono TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Relación entre profesores y entidades educativas
CREATE TABLE IF NOT EXISTS public.profesor_entidad (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profesor_id UUID NOT NULL REFERENCES public.profesores(id) ON DELETE CASCADE,
  entidad_id UUID NOT NULL REFERENCES public.entidades_educativas(id) ON DELETE CASCADE,
  rol TEXT NOT NULL, -- 'profesor', 'coordinador', 'director', etc.
  departamento TEXT,
  fecha_inicio DATE,
  fecha_fin DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profesor_id, entidad_id)
);

-- Trigger para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar el trigger a todas las tablas
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.profesores
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.entidades_educativas
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.profesor_entidad
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp(); 