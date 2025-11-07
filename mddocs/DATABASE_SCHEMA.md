# ProfeVision - Database Schema (Public Schema)

**Fecha**: 2025-11-04
**Base de Datos**: PostgreSQL (Supabase)
**Schema**: `public`
**RLS**: Habilitado en todas las tablas

---

## Índice

1. [Profesores y Entidades](#profesores-y-entidades)
2. [Materias y Grupos](#materias-y-grupos)
3. [Estudiantes](#estudiantes)
4. [Exámenes](#exámenes)
5. [Resultados y Respuestas](#resultados-y-respuestas)
6. [Grading Schemes](#grading-schemes)
7. [Sistema de Tiers y Suscripciones](#sistema-de-tiers-y-suscripciones)
8. [Procesos y Jobs](#procesos-y-jobs)
9. [Relaciones Clave](#relaciones-clave)

---

## Profesores y Entidades

### `profesores`
**Descripción**: Perfiles de profesores (1:1 con auth.users)

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | - | ID del profesor (= auth.users.id) |
| `nombres` | text | updatable | '' | Nombres del profesor |
| `apellidos` | text | updatable | '' | Apellidos del profesor |
| `telefono` | text | nullable, updatable | - | Teléfono de contacto |
| `cargo` | text | nullable, updatable | - | Cargo o puesto |
| `biografia` | text | nullable, updatable | - | Biografía del profesor |
| `foto_url` | text | nullable, updatable | - | URL de foto de perfil |
| `subscription_tier` | text | updatable | 'grandfathered' | Tier de suscripción |
| `subscription_status` | text | updatable | 'active' | Estado de suscripción |
| `subscription_cycle_start` | date | nullable, updatable | - | Inicio del ciclo de facturación |
| `polar_subscription_id` | text | nullable, updatable | - | ID de suscripción en Polar.sh |
| `polar_customer_id` | text | nullable, updatable | - | ID de cliente en Polar.sh |
| `first_login_completed` | bool | updatable | false | Si completó el primer login |
| `created_at` | timestamptz | updatable | now() | Fecha de creación |
| `updated_at` | timestamptz | updatable | now() | Fecha de actualización |

**Constraints**:
- FK: `id` → `auth.users.id`
- CHECK: `subscription_tier IN ('free', 'plus', 'admin', 'grandfathered')`
- CHECK: `subscription_status IN ('active', 'cancelled', 'past_due')`

**RLS**: ✅ Habilitado
**Rows**: 30

---

### `entidades_educativas`
**Descripción**: Instituciones educativas creadas por profesores

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | uuid_generate_v4() | ID de la entidad |
| `nombre` | text | updatable | - | Nombre de la institución |
| `tipo` | text | updatable | - | Tipo (colegio, universidad, etc.) |
| `profesor_id` | uuid | updatable | - | ID del profesor propietario |
| `created_at` | timestamptz | updatable | now() | Fecha de creación |
| `updated_at` | timestamptz | updatable | now() | Fecha de actualización |

**Constraints**:
- FK: `profesor_id` → `profesores.id`

**RLS**: ✅ Habilitado
**Rows**: 14

---

### `profesor_entidad`
**Descripción**: Relación N:M entre profesores y entidades

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | uuid_generate_v4() | ID de la relación |
| `profesor_id` | uuid | updatable | - | ID del profesor |
| `entidad_id` | uuid | updatable | - | ID de la entidad |
| `rol` | text | updatable | - | Rol del profesor en la entidad |
| `departamento` | text | nullable, updatable | - | Departamento |
| `fecha_inicio` | date | nullable, updatable | - | Fecha de inicio |
| `fecha_fin` | date | nullable, updatable | - | Fecha de fin |
| `created_at` | timestamptz | updatable | now() | Fecha de creación |
| `updated_at` | timestamptz | updatable | now() | Fecha de actualización |

**Constraints**:
- FK: `profesor_id` → `profesores.id`
- FK: `entidad_id` → `entidades_educativas.id`

**RLS**: ✅ Habilitado
**Rows**: 14

---

## Materias y Grupos

### `materias`
**Descripción**: Materias/cursos creados por profesores

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | uuid_generate_v4() | ID de la materia |
| `nombre` | text | updatable | - | Nombre de la materia |
| `descripcion` | text | nullable, updatable | - | Descripción |
| `profesor_id` | uuid | updatable | - | ID del profesor |
| `entidad_id` | uuid | nullable, updatable | - | ID de la entidad educativa |
| `created_at` | timestamptz | updatable | now() | Fecha de creación |
| `updated_at` | timestamptz | updatable | now() | Fecha de actualización |

**Constraints**:
- FK: `profesor_id` → `profesores.id`
- FK: `entidad_id` → `entidades_educativas.id`

**RLS**: ✅ Habilitado
**Rows**: 14

---

### `grupos`
**Descripción**: Grupos/clases de estudiantes

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | uuid_generate_v4() | ID del grupo |
| `nombre` | text | updatable | - | Nombre del grupo |
| `descripcion` | text | nullable, updatable | - | Descripción |
| `materia_id` | uuid | updatable | - | ID de la materia |
| `profesor_id` | uuid | updatable | - | ID del profesor |
| `año_escolar` | text | nullable, updatable | - | Año escolar |
| `periodo_escolar` | text | nullable, updatable | - | Formato: YYYY o NS-YYYY |
| `estado` | text | updatable | 'activo' | Estado: 'activo' o 'archivado' |
| `created_at` | timestamptz | updatable | now() | Fecha de creación |
| `updated_at` | timestamptz | updatable | now() | Fecha de actualización |

**Constraints**:
- FK: `materia_id` → `materias.id`
- FK: `profesor_id` → `profesores.id`
- CHECK: `estado IN ('activo', 'archivado')`

**RLS**: ✅ Habilitado
**Rows**: 21

---

## Estudiantes

### `estudiantes`
**Descripción**: Estudiantes del sistema

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | uuid_generate_v4() | ID del estudiante |
| `identificacion` | text | updatable, unique | - | Número de identificación |
| `nombres` | text | updatable | - | Nombres del estudiante |
| `apellidos` | text | updatable | - | Apellidos del estudiante |
| `email` | text | nullable, updatable | - | Email del estudiante |
| `created_at` | timestamptz | updatable | now() | Fecha de creación |
| `updated_at` | timestamptz | updatable | now() | Fecha de actualización |

**Constraints**:
- UNIQUE: `identificacion`

**RLS**: ✅ Habilitado
**Rows**: 405

---

### `estudiante_grupo`
**Descripción**: Relación N:M entre estudiantes y grupos

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | uuid_generate_v4() | ID de la relación |
| `estudiante_id` | uuid | updatable | - | ID del estudiante |
| `grupo_id` | uuid | updatable | - | ID del grupo |
| `created_at` | timestamptz | updatable | now() | Fecha de creación |
| `updated_at` | timestamptz | updatable | now() | Fecha de actualización |

**Constraints**:
- FK: `estudiante_id` → `estudiantes.id`
- FK: `grupo_id` → `grupos.id`

**RLS**: ✅ Habilitado
**Rows**: 454

---

## Exámenes

### `examenes`
**Descripción**: Exámenes creados por profesores

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | uuid_generate_v4() | ID del examen |
| `titulo` | text | updatable | - | Título del examen |
| `descripcion` | text | nullable, updatable | - | Descripción |
| `instrucciones` | text | nullable, updatable | - | Instrucciones |
| `materia_id` | uuid | updatable | - | ID de la materia |
| `profesor_id` | uuid | updatable | - | ID del profesor |
| `estado` | text | updatable | 'borrador' | Estado del examen |
| `fecha_creacion` | timestamptz | updatable | now() | Fecha de creación |
| `duracion_minutos` | int4 | nullable, updatable | - | Duración en minutos |
| `puntaje_total` | numeric | nullable, updatable | 100.0 | Puntaje total |
| `created_at` | timestamptz | updatable | now() | Timestamp creación |
| `updated_at` | timestamptz | updatable | now() | Timestamp actualización |

**Constraints**:
- FK: `materia_id` → `materias.id`
- FK: `profesor_id` → `profesores.id`

**RLS**: ✅ Habilitado
**Rows**: 32

---

### `tipos_pregunta`
**Descripción**: Tipos de preguntas (opción múltiple, verdadero/falso, etc.)

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | text | PK, updatable | - | ID del tipo |
| `nombre` | text | updatable | - | Nombre del tipo |
| `descripcion` | text | nullable, updatable | - | Descripción |

**RLS**: ✅ Habilitado
**Rows**: 3

---

### `preguntas`
**Descripción**: Preguntas de exámenes

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | uuid_generate_v4() | ID de la pregunta |
| `examen_id` | uuid | updatable | - | ID del examen |
| `texto` | text | updatable | - | Texto de la pregunta |
| `tipo_id` | text | updatable | - | ID del tipo de pregunta |
| `puntaje` | numeric | updatable | 1.0 | Puntaje de la pregunta |
| `dificultad` | text | nullable, updatable | - | Nivel de dificultad |
| `retroalimentacion` | text | nullable, updatable | - | Feedback |
| `orden` | int4 | updatable | 0 | Orden en el examen |
| `habilitada` | bool | updatable | true | Si está habilitada |
| `created_at` | timestamptz | updatable | now() | Fecha de creación |
| `updated_at` | timestamptz | updatable | now() | Fecha de actualización |

**Constraints**:
- FK: `examen_id` → `examenes.id`
- FK: `tipo_id` → `tipos_pregunta.id`

**RLS**: ✅ Habilitado
**Rows**: 686

---

### `opciones_respuesta`
**Descripción**: Opciones de respuesta para preguntas

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | uuid_generate_v4() | ID de la opción |
| `pregunta_id` | uuid | updatable | - | ID de la pregunta |
| `texto` | text | updatable | - | Texto de la opción |
| `es_correcta` | bool | updatable | false | Si es correcta |
| `orden` | int4 | updatable | 0 | Orden de la opción |
| `created_at` | timestamptz | updatable | now() | Fecha de creación |
| `updated_at` | timestamptz | updatable | now() | Fecha de actualización |

**Constraints**:
- FK: `pregunta_id` → `preguntas.id`

**RLS**: ✅ Habilitado
**Rows**: 2,700

---

### `versiones_examen`
**Descripción**: Versiones randomizadas de exámenes

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | uuid_generate_v4() | ID de la versión |
| `examen_id` | uuid | updatable | - | ID del examen |
| `codigo` | text | updatable | - | Código de la versión |
| `orden_preguntas` | jsonb | nullable, updatable | - | Orden de preguntas |
| `orden_opciones` | jsonb | nullable, updatable | - | Orden de opciones |
| `created_at` | timestamptz | updatable | now() | Fecha de creación |
| `updated_at` | timestamptz | updatable | now() | Fecha de actualización |

**Constraints**:
- FK: `examen_id` → `examenes.id`

**RLS**: ✅ Habilitado
**Rows**: 0

---

### `examen_grupo`
**Descripción**: Aplicaciones de exámenes a grupos

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | uuid_generate_v4() | ID de la aplicación |
| `examen_id` | uuid | updatable | - | ID del examen |
| `grupo_id` | uuid | updatable | - | ID del grupo |
| `fecha_aplicacion` | timestamptz | nullable, updatable | - | Fecha de aplicación |
| `duracion_minutos` | int4 | nullable, updatable | - | Duración |
| `estado` | varchar | nullable, updatable | 'programado' | Estado |
| `created_at` | timestamptz | nullable, updatable | now() | Fecha de creación |
| `updated_at` | timestamptz | nullable, updatable | now() | Fecha de actualización |

**Constraints**:
- FK: `examen_id` → `examenes.id`
- FK: `grupo_id` → `grupos.id`
- CHECK: `estado IN ('programado', 'en_progreso', 'completado', 'cancelado', 'borrador')`

**RLS**: ✅ Habilitado
**Rows**: 34

---

## Resultados y Respuestas

### `resultados_examen`
**Descripción**: Resultados de estudiantes en exámenes

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | uuid_generate_v4() | ID del resultado |
| `estudiante_id` | uuid | updatable | - | ID del estudiante |
| `examen_id` | uuid | updatable | - | ID del examen |
| `version_id` | uuid | nullable, updatable | - | ID de la versión |
| `puntaje_obtenido` | numeric | nullable, updatable | - | Puntaje obtenido |
| `porcentaje` | numeric | nullable, updatable | - | Porcentaje |
| `tiempo_utilizado` | int4 | nullable, updatable | - | Tiempo en minutos |
| `estado` | text | updatable | 'pendiente' | Estado |
| `fecha_calificacion` | timestamptz | nullable, updatable | - | Fecha de calificación |
| `created_at` | timestamptz | updatable | now() | Fecha de creación |
| `updated_at` | timestamptz | updatable | now() | Fecha de actualización |

**Constraints**:
- FK: `estudiante_id` → `estudiantes.id`
- FK: `examen_id` → `examenes.id`
- FK: `version_id` → `versiones_examen.id`

**RLS**: ✅ Habilitado
**Rows**: 665

---

### `respuestas_estudiante`
**Descripción**: Respuestas individuales de estudiantes

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | uuid_generate_v4() | ID de la respuesta |
| `resultado_id` | uuid | updatable | - | ID del resultado |
| `pregunta_id` | uuid | updatable | - | ID de la pregunta |
| `opcion_id` | uuid | nullable, updatable | - | ID de la opción elegida |
| `es_correcta` | bool | nullable, updatable | - | Si es correcta |
| `puntaje_obtenido` | numeric | nullable, updatable | - | Puntaje obtenido |
| `created_at` | timestamptz | updatable | now() | Fecha de creación |
| `updated_at` | timestamptz | updatable | now() | Fecha de actualización |

**Constraints**:
- FK: `resultado_id` → `resultados_examen.id`
- FK: `pregunta_id` → `preguntas.id`
- FK: `opcion_id` → `opciones_respuesta.id`

**RLS**: ✅ Habilitado
**Rows**: 17,713

---

### `examenes_escaneados`
**Descripción**: Registro de exámenes escaneados con la plataforma

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | uuid_generate_v4() | ID del escaneo |
| `profesor_id` | uuid | updatable | - | ID del profesor |
| `examen_id` | uuid | updatable | - | ID del examen |
| `resultado_id` | uuid | nullable, updatable | - | ID del resultado |
| `archivo_original` | text | updatable | - | Nombre archivo original |
| `archivo_procesado` | text | updatable | - | Nombre archivo procesado |
| `ruta_s3_original` | text | updatable | - | Ruta S3 original |
| `ruta_s3_procesado` | text | updatable | - | Ruta S3 procesado |
| `fecha_escaneo` | timestamptz | nullable, updatable | now() | Fecha del escaneo |
| `created_at` | timestamptz | nullable, updatable | now() | Fecha de creación |
| `updated_at` | timestamptz | nullable, updatable | now() | Fecha de actualización |

**Constraints**:
- FK: `profesor_id` → `profesores.id`
- FK: `examen_id` → `examenes.id`
- FK: `resultado_id` → `resultados_examen.id`

**RLS**: ✅ Habilitado
**Rows**: 658

---

### `exam_scans`
**Descripción**: Cola de procesamiento de escaneos (microservicio)

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | gen_random_uuid() | ID del job |
| `job_id` | text | updatable, unique | - | ID único del job |
| `image_path` | text | updatable | - | Ruta de la imagen |
| `exam_id` | uuid | nullable, updatable | - | ID del examen |
| `student_id` | uuid | nullable, updatable | - | ID del estudiante |
| `group_id` | uuid | nullable, updatable | - | ID del grupo |
| `status` | text | updatable | - | Estado del job |
| `result` | jsonb | nullable, updatable | - | Resultado JSON |
| `metadata` | jsonb | nullable, updatable | - | Metadata JSON |
| `created_at` | timestamptz | nullable, updatable | now() | Fecha de creación |
| `updated_at` | timestamptz | nullable, updatable | now() | Fecha de actualización |

**Constraints**:
- FK: `exam_id` → `examenes.id`
- FK: `student_id` → `estudiantes.id`
- FK: `group_id` → `grupos.id`
- CHECK: `status IN ('pending', 'in_queue', 'processing', 'completed', 'error')`
- UNIQUE: `job_id`

**Nota**: El microservicio debe usar service_role para omitir RLS

**RLS**: ✅ Habilitado
**Rows**: 0

---

## Grading Schemes

### `esquemas_calificacion`
**Descripción**: Esquemas de calificación para grupos

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | gen_random_uuid() | ID del esquema |
| `grupo_id` | uuid | updatable | - | ID del grupo |
| `nombre` | text | updatable | - | Nombre del esquema |
| `descripcion` | text | nullable, updatable | - | Descripción |
| `fecha_inicio` | date | updatable | - | Fecha de inicio |
| `fecha_fin` | date | updatable | - | Fecha de fin |
| `es_activo` | bool | nullable, updatable | true | Si está activo |
| `created_at` | timestamptz | nullable, updatable | now() | Fecha de creación |
| `updated_at` | timestamptz | nullable, updatable | now() | Fecha de actualización |

**Constraints**:
- FK: `grupo_id` → `grupos.id`

**RLS**: ✅ Habilitado
**Rows**: 13

---

### `periodos_calificacion`
**Descripción**: Periodos dentro de esquemas (ej: trimestres)

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | gen_random_uuid() | ID del periodo |
| `esquema_id` | uuid | updatable | - | ID del esquema |
| `nombre` | text | updatable | - | Nombre del periodo |
| `porcentaje` | numeric | updatable | - | Porcentaje (0-100) |
| `orden` | int4 | updatable | - | Orden |
| `fecha_inicio` | date | updatable | - | Fecha de inicio |
| `fecha_fin` | date | updatable | - | Fecha de fin |
| `created_at` | timestamptz | nullable, updatable | now() | Fecha de creación |
| `updated_at` | timestamptz | nullable, updatable | now() | Fecha de actualización |

**Constraints**:
- FK: `esquema_id` → `esquemas_calificacion.id`
- CHECK: `porcentaje >= 0 AND porcentaje <= 100`

**RLS**: ✅ Habilitado
**Rows**: 25

---

### `componentes_calificacion`
**Descripción**: Componentes de evaluación (exámenes, tareas, etc.)

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | gen_random_uuid() | ID del componente |
| `periodo_id` | uuid | updatable | - | ID del periodo |
| `nombre` | text | updatable | - | Nombre del componente |
| `porcentaje` | numeric | updatable | - | Porcentaje (0-100) |
| `tipo` | text | updatable | - | Tipo de componente |
| `created_at` | timestamptz | nullable, updatable | now() | Fecha de creación |
| `updated_at` | timestamptz | nullable, updatable | now() | Fecha de actualización |

**Constraints**:
- FK: `periodo_id` → `periodos_calificacion.id`
- CHECK: `porcentaje >= 0 AND porcentaje <= 100`

**RLS**: ✅ Habilitado
**Rows**: 44

---

### `calificaciones`
**Descripción**: Calificaciones individuales de estudiantes

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | gen_random_uuid() | ID de la calificación |
| `estudiante_id` | uuid | updatable | - | ID del estudiante |
| `componente_id` | uuid | updatable | - | ID del componente |
| `valor` | numeric | updatable | - | Valor (0-5) |
| `created_at` | timestamptz | updatable | timezone('utc', now()) | Fecha de creación |
| `updated_at` | timestamptz | updatable | timezone('utc', now()) | Fecha de actualización |

**Constraints**:
- FK: `estudiante_id` → `estudiantes.id`
- FK: `componente_id` → `componentes_calificacion.id`
- CHECK: `valor >= 0 AND valor <= 5`

**RLS**: ✅ Habilitado
**Rows**: 108

---

### `examenes_a_componentes_calificacion`
**Descripción**: Relación entre exámenes y componentes de calificación

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | uuid_generate_v4() | ID de la relación |
| `examen_id` | uuid | updatable | - | ID del examen |
| `componente_id` | uuid | updatable | - | ID del componente |
| `created_at` | timestamptz | updatable | now() | Fecha de creación |
| `updated_at` | timestamptz | updatable | now() | Fecha de actualización |

**Constraints**:
- FK: `examen_id` → `examenes.id`
- FK: `componente_id` → `componentes_calificacion.id`

**Nota**: Para asignar automáticamente notas de exámenes a componentes en el tabulado

**RLS**: ✅ Habilitado
**Rows**: 3

---

### `examenes_componente`
**Descripción**: Tabla legacy/alternativa de relación examen-componente

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | gen_random_uuid() | ID |
| `componente_id` | uuid | updatable | - | ID del componente |
| `examen_id` | uuid | updatable | - | ID del examen |
| `porcentaje` | numeric | updatable | - | Porcentaje (0-100) |
| `fecha_aplicacion` | date | updatable | - | Fecha de aplicación |
| `created_at` | timestamptz | nullable, updatable | now() | Fecha de creación |
| `updated_at` | timestamptz | nullable, updatable | now() | Fecha de actualización |

**Constraints**:
- FK: `componente_id` → `componentes_calificacion.id`
- FK: `examen_id` → `examenes.id`
- CHECK: `porcentaje >= 0 AND porcentaje <= 100`

**RLS**: ✅ Habilitado
**Rows**: 0

---

## Sistema de Tiers y Suscripciones

### `tier_limits`
**Descripción**: Configuración de límites por tier de suscripción

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | gen_random_uuid() | ID del tier |
| `tier` | text | unique, updatable | - | Nombre del tier |
| `ai_generations_per_month` | int4 | updatable | - | Generaciones IA por mes (-1 = ilimitado) |
| `scans_per_month` | int4 | updatable | - | Escaneos por mes (-1 = ilimitado) |
| `max_students` | int4 | updatable | - | Máximo de estudiantes (-1 = ilimitado) |
| `max_groups` | int4 | updatable | - | Máximo de grupos (-1 = ilimitado) |
| `features` | jsonb | updatable | '{}' | Features adicionales |
| `created_at` | timestamptz | updatable | now() | Fecha de creación |
| `updated_at` | timestamptz | updatable | now() | Fecha de actualización |

**Constraints**:
- UNIQUE: `tier`
- CHECK: `tier IN ('free', 'plus', 'admin', 'grandfathered')`

**Valores Actuales**:
- **free**: 1 generación IA, 50 escaneos, 100 estudiantes, 5 grupos
- **plus**: Ilimitado todo
- **admin**: Ilimitado todo
- **grandfathered**: Ilimitado todo (temporal)

**RLS**: ✅ Habilitado (SELECT público)
**Rows**: 4

---

### `usage_tracking`
**Descripción**: Tracking de uso mensual por profesor

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | gen_random_uuid() | ID del tracking |
| `profesor_id` | uuid | updatable | - | ID del profesor |
| `month_year` | text | updatable | - | Mes/año (YYYY-MM) |
| `ai_generations_used` | int4 | updatable | 0 | Generaciones IA usadas |
| `scans_used` | int4 | updatable | 0 | Escaneos usados |
| `cycle_start_date` | date | updatable | - | Inicio del ciclo |
| `cycle_end_date` | date | updatable | - | Fin del ciclo |
| `created_at` | timestamptz | updatable | now() | Fecha de creación |
| `updated_at` | timestamptz | updatable | now() | Fecha de actualización |

**Constraints**:
- FK: `profesor_id` → `profesores.id`
- UNIQUE: `(profesor_id, month_year)`

**Índices**:
- `idx_usage_tracking_profesor_month` ON `(profesor_id, month_year)`

**RLS**: ✅ Habilitado (SELECT/INSERT/UPDATE propios)
**Rows**: Variable

---

### Funciones SQL del Sistema de Tiers

#### `calculate_cycle_dates(cycle_start date)`
**Descripción**: Calcula fechas de inicio y fin del ciclo de facturación actual

**Returns**: `TABLE(cycle_start_date date, cycle_end_date date)`

**Ejemplo**:
```sql
SELECT * FROM calculate_cycle_dates('2025-01-15'::date);
-- Retorna el rango de fechas del ciclo actual
```

---

#### `get_or_create_usage_tracking(p_profesor_id uuid)`
**Descripción**: Obtiene o crea el registro de tracking para el ciclo actual

**Returns**: `uuid` (ID del registro de tracking)

**Ejemplo**:
```sql
SELECT get_or_create_usage_tracking('...');
-- Retorna el ID del registro de tracking del mes actual
```

---

#### `check_feature_limit(p_profesor_id uuid, p_feature text)`
**Descripción**: Verifica si el profesor puede usar una feature

**Returns**: `RECORD(can_use boolean, used integer, limit integer, remaining integer)`

**Features**: `'ai_generation'` | `'scan'`

**Ejemplo**:
```sql
SELECT * FROM check_feature_limit('...', 'ai_generation');
-- { can_use: true, used: 5, limit: 10, remaining: 5 }
```

---

#### `increment_feature_usage(p_profesor_id uuid, p_feature text)`
**Descripción**: Incrementa el contador de uso de una feature

**Returns**: `void`

**Ejemplo**:
```sql
SELECT increment_feature_usage('...', 'scan');
-- Incrementa scans_used en 1
```

---

## Procesos y Jobs

### `procesos_examen_similar`
**Descripción**: Jobs para generar exámenes similares con AI

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | gen_random_uuid() | ID del proceso |
| `user_id` | uuid | updatable | - | ID del usuario |
| `source_exam_id` | uuid | updatable | - | ID del examen origen |
| `draft_exam_id` | uuid | nullable, updatable | - | ID del examen generado |
| `status` | text | updatable | - | Estado del job |
| `step` | text | nullable, updatable | - | Paso actual |
| `seed` | int4 | nullable, updatable | - | Seed para randomización |
| `langchain_run_id` | text | nullable, updatable | - | ID de run de LangChain |
| `error_key` | text | nullable, updatable | - | Clave de error i18n |
| `error_meta` | jsonb | nullable, updatable | - | Metadata de error |
| `timings` | jsonb | updatable | '[]' | Tiempos de ejecución |
| `logs` | jsonb | updatable | '[]' | Logs del proceso |
| `created_at` | timestamptz | updatable | now() | Fecha de creación |
| `updated_at` | timestamptz | updatable | now() | Fecha de actualización |

**Constraints**:
- FK: `user_id` → `auth.users.id`
- FK: `source_exam_id` → `examenes.id`
- FK: `draft_exam_id` → `examenes.id`
- CHECK: `status IN ('queued', 'running', 'failed', 'completed')`
- CHECK: `step IN ('loadBlueprint', 'generate', 'validate', 'apply', 'randomize', 'finalize')`

**RLS**: ✅ Habilitado
**Rows**: 65

---

### `user_notifications`
**Descripción**: Notificaciones de usuarios

| Columna | Tipo | Opciones | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | PK, updatable | gen_random_uuid() | ID de la notificación |
| `user_id` | uuid | updatable | - | ID del usuario |
| `email` | text | updatable | - | Email del usuario |
| `notification_sent` | bool | nullable, updatable | false | Si fue enviada |
| `details` | jsonb | nullable, updatable | - | Detalles JSON |
| `error` | text | nullable, updatable | - | Mensaje de error |
| `created_at` | timestamptz | updatable | now() | Fecha de creación |

**RLS**: ✅ Habilitado
**Rows**: 57

---

## Relaciones Clave

### Jerarquía Principal
```
auth.users (Supabase Auth)
    ↓ 1:1
profesores
    ↓ 1:N
entidades_educativas
    ↓ 1:N
materias
    ↓ 1:N                    ↓ 1:N
grupos                   examenes
    ↓ N:M                    ↓ 1:N
estudiantes              preguntas
                             ↓ 1:N
                         opciones_respuesta
```

### Flow de Evaluación
```
examenes → examen_grupo → estudiantes
                ↓
        resultados_examen
                ↓
        respuestas_estudiante
                ↓
        examenes_escaneados (si fue escaneado)
```

### Grading Scheme
```
grupos
    ↓ 1:N
esquemas_calificacion
    ↓ 1:N
periodos_calificacion
    ↓ 1:N
componentes_calificacion
    ↓ 1:N                    ↓ N:M (via examenes_a_componentes)
calificaciones           examenes
```

### Sistema de Tiers
```
profesores
    ↓ (subscription_tier)
tier_limits (config)

profesores
    ↓ 1:N
usage_tracking (tracking mensual)
```

---

## Funciones RLS

### `is_profesor_of_grupo(grupo_id uuid)`
**Descripción**: Verifica si el usuario autenticado es el profesor del grupo

**Uso**: Políticas RLS para autorizar acceso a datos relacionados con grupos

---

## Índices Recomendados

```sql
-- Para queries de dashboard
CREATE INDEX IF NOT EXISTS idx_materias_profesor_id
  ON materias(profesor_id);

CREATE INDEX IF NOT EXISTS idx_grupos_profesor_id
  ON grupos(profesor_id);

CREATE INDEX IF NOT EXISTS idx_grupos_estado
  ON grupos(estado);

CREATE INDEX IF NOT EXISTS idx_examenes_profesor_id
  ON examenes(profesor_id);

CREATE INDEX IF NOT EXISTS idx_examenes_fecha_creacion
  ON examenes(fecha_creacion DESC);

CREATE INDEX IF NOT EXISTS idx_examenes_escaneados_profesor_id
  ON examenes_escaneados(profesor_id);

CREATE INDEX IF NOT EXISTS idx_estudiante_grupo_grupo_id
  ON estudiante_grupo(grupo_id);

CREATE INDEX IF NOT EXISTS idx_estudiante_grupo_estudiante_id
  ON estudiante_grupo(estudiante_id);
```

---

## Notas de Performance

1. **RLS Overhead**: Todas las queries pasan por RLS policies
2. **Joins Complejos**: Estudiantes únicos requieren join multi-tabla
3. **Conteos**: Usar `count: 'exact'` solo cuando necesario
4. **Materias Join**: `examenes` → `materias` es común para mostrar contexto

---

**Total Tablas**: 25 (23 originales + 2 sistema de tiers)
**Total Rows**: ~24,000 (aprox)
**RLS**: Habilitado en todas las tablas
**Auth**: Supabase Auth (schema `auth`)

---

## Cambios Recientes

### 2025-11-04: Sistema de Tiers y Suscripciones
- ✅ Agregados campos de subscription a tabla `profesores`
- ✅ Nueva tabla `tier_limits` (configuración de tiers)
- ✅ Nueva tabla `usage_tracking` (tracking de uso mensual)
- ✅ Funciones SQL: `calculate_cycle_dates`, `get_or_create_usage_tracking`, `check_feature_limit`, `increment_feature_usage`
- ✅ DEFAULT de `subscription_tier` cambiado a 'grandfathered'
- 📋 Tiers disponibles: free, plus, admin, grandfathered

---

**Última Actualización**: 2025-11-04
**Fuente**: Supabase MCP + Migraciones manuales
**Versión**: 1.1
