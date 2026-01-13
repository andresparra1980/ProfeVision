# Schema Mapping: Español → Inglés

Documentación completa del mapeo de tablas y campos de Supabase (español) a Convex (inglés).

## Resumen

- **Total de tablas:** 25
- **Total de registros:** ~24,000
- **Cambio de naming:** snake_case (ES) → camelCase (EN)
- **IDs:** UUID → Convex autogenerados (`_id`)

## Mapeo de Colecciones

| Tabla Supabase (ES) | Colección Convex (EN) | Índices | Notas |
|---------------------|----------------------|---------|-------|
| `profesores` | `teachers` | `by_token` (auth) | + clerkId para Clerk |
| `entidades_educativas` | `educationalEntities` | | |
| `profesor_entidad` | `teacherEntities` | `by_teacher`, `by_entity` | Relación N:M |
| `materias` | `subjects` | `by_teacher` | |
| `grupos` | `groups` | `by_teacher` | |
| `estudiantes` | `students` | `by_id_number` | `idNumber` único |
| `estudiante_grupo` | `studentGroups` | `by_group`, `by_student` | Relación N:M |
| `examenes` | `exams` | `by_teacher` | |
| `tipos_pregunta` | `questionTypes` | | Datos estáticos |
| `preguntas` | `questions` | `by_exam` | |
| `opciones_respuesta` | `answerOptions` | `by_question` | |
| `versiones_examen` | `examVersions` | `by_exam` | |
| `examen_grupo` | `examApplications` | `by_exam`, `by_group` | |
| `resultados_examen` | `examResults` | `by_student`, `by_application` | |
| `respuestas_estudiante` | `studentAnswers` | `by_student`, `by_question` | |
| `examenes_escaneados` | `scannedExams` | `by_teacher`, `by_exam` | OMR |
| `exam_scans` | `examScans` | `by_job_id` | Queue OMR |
| `esquemas_calificacion` | `gradingSchemes` | `by_group` | |
| `periodos_calificacion` | `gradingPeriods` | `by_scheme` | |
| `componentes_calificacion` | `gradeComponents` | `by_period` | |
| `calificaciones` | `grades` | `by_student`, `by_component` | |
| `examenes_a_componentes_calificacion` | `examToGradeComponents` | `by_exam`, `by_component` | |
| `examenes_componente` | `examComponents` | | Legacy |
| `tier_limits` | `tierLimits` | `by_tier` | Configuración |
| `usage_tracking` | `usageTracking` | `by_teacher_month` | Tracking mensual |
| `procesos_examen_similar` | `examSimilarProcesses` | `by_user`, `by_status` | AI Jobs |
| `user_notifications` | `userNotifications` | `by_user` | |

---

## Diccionario de Campos (Español → Inglés)

### teachers (profesores)

| Campo ES | Campo EN | Tipo | Notas |
|----------|----------|------|-------|
| `id` | `_id` | Convex ID | Autogenerado |
| `nombres` | `firstName` | string | |
| `apellidos` | `lastName` | string | |
| `telefono` | `phone` | string | nullable |
| `cargo` | `jobTitle` | string | nullable |
| `biografia` | `bio` | string | nullable |
| `foto_url` | `photoUrl` | string | nullable |
| `first_login_completed` | `firstLoginCompleted` | boolean | nullable |
| `onboarding_status` | `onboardingStatus` | v.json() | nullable |
| `subscription_tier` | `subscriptionTier` | string | free, plus, admin, grandfathered |
| `subscription_status` | `subscriptionStatus` | string | active, cancelled, past_due |
| `subscription_cycle_start` | `subscriptionCycleStart` | number | timestamp (ms) |
| `polar_subscription_id` | `polarSubscriptionId` | string | nullable |
| `polar_customer_id` | `polarCustomerId` | string | nullable |
| `created_at` | `_creationTime` | number | Convex autogenerado |
| `updated_at` | - | - | Eliminar (usar Convex) |

**Nuevo campo para Clerk:**
- `clerkId` → `string` (para vincular con Clerk)

---

### educationalEntities (entidades_educativas)

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `nombre` | `name` | string |
| `tipo` | `type` | string |
| `ciudad` | `city` | string | nullable |
| `direccion` | `address` | string | nullable |
| `telefono` | `phone` | string | nullable |
| `pais` | `country` | string | nullable |
| `email` | `email` | string | nullable |
| `website` | `website` | string | nullable |
| `logo_url` | `logoUrl` | string | nullable |
| `profesor_id` | `teacherId` | v.id("teachers") |
| `created_at` | `_creationTime` | Convex |

---

### teacherEntities (profesor_entidad)

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `profesor_id` | `teacherId` | v.id("teachers") |
| `entidad_id` | `entityId` | v.id("educationalEntities") |
| `rol` | `role` | string |
| `departamento` | `department` | string | nullable |
| `fecha_inicio` | `startDate` | number | timestamp |
| `fecha_fin` | `endDate` | number | timestamp | nullable |
| `created_at` | `_creationTime` | Convex |

---

### subjects (materias)

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `nombre` | `name` | string |
| `descripcion` | `description` | string | nullable |
| `profesor_id` | `teacherId` | v.id("teachers") |
| `entidad_id` | `entityId` | v.id("educationalEntities") | nullable |
| `created_at` | `_creationTime` | Convex |

---

### groups (grupos)

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `nombre` | `name` | string |
| `descripcion` | `description` | string | nullable |
| `materia_id` | `subjectId` | v.id("subjects") |
| `profesor_id` | `teacherId` | v.id("teachers") |
| `entidad_id` | `entityId` | v.id("educationalEntities") | nullable |
| `estado` | `status` | string | activo, archivado |
| `año_escolar` | `schoolYear` | string | nullable |
| `periodo_escolar` | `schoolPeriod` | string | nullable |
| `created_at` | `_creationTime` | Convex |

---

### students (estudiantes)

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `nombres` | `firstName` | string |
| `apellidos` | `lastName` | string |
| `identificacion` | `idNumber` | string | único |
| `email` | `email` | string | nullable |
| `created_at` | `_creationTime` | Convex |

---

### studentGroups (estudiante_grupo)

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `estudiante_id` | `studentId` | v.id("students") |
| `grupo_id` | `groupId` | v.id("groups") |
| `created_at` | `_creationTime` | Convex |

---

### exams (examenes)

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `titulo` | `title` | string |
| `descripcion` | `description` | string | nullable |
| `instrucciones` | `instructions` | string | nullable |
| `materia_id` | `subjectId` | v.id("subjects") |
| `profesor_id` | `teacherId` | v.id("teachers") |
| `estado` | `status` | string | borrador, publicado |
| `fecha_creacion` | `createdAt` | number | timestamp |
| `duracion_minutos` | `durationMinutes` | number | nullable |
| `puntaje_total` | `totalScore` | number | nullable |
| `created_at` | `_creationTime` | Convex |

---

### questionTypes (tipos_pregunta)

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `nombre` | `name` | string |
| `descripcion` | `description` | string | nullable |

---

### questions (preguntas)

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `examen_id` | `examId` | v.id("exams") |
| `texto` | `text` | string |
| `tipo_id` | `typeId` | v.id("questionTypes") |
| `puntaje` | `score` | number |
| `dificultad` | `difficulty` | string | nullable |
| `retroalimentacion` | `feedback` | string | nullable |
| `orden` | `order` | number |
| `habilitada` | `isEnabled` | boolean |
| `created_at` | `_creationTime` | Convex |

---

### answerOptions (opciones_respuesta)

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `pregunta_id` | `questionId` | v.id("questions") |
| `texto` | `text` | string |
| `es_correcta` | `isCorrect` | boolean |
| `orden` | `order` | number |
| `created_at` | `_creationTime` | Convex |

---

### examVersions (versiones_examen)

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `examen_id` | `examId` | v.id("exams") |
| `codigo` | `code` | string | nullable |
| `orden_preguntas` | `questionOrder` | v.array(v.id("questions")) | nullable |
| `orden_opciones` | `optionOrder` | v.object() | nullable |
| `created_at` | `_creationTime` | Convex |

---

### examApplications (examen_grupo)

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `examen_id` | `examId` | v.id("exams") |
| `grupo_id` | `groupId` | v.id("groups") |
| `fecha_aplicacion` | `examDate` | number | timestamp | nullable |
| `duracion_minutos` | `durationMinutes` | number | nullable |
| `estado` | `status` | string | programado, en_progreso, completado |
| `created_at` | `_creationTime` | Convex |

---

### examResults (resultados_examen)

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `estudiante_id` | `studentId` | v.id("students") |
| `examen_id` | `examId` | v.id("exams") |
| `version_id` | `versionId` | v.id("examVersions") | nullable |
| `aplicacion_id` | `applicationId` | v.id("examApplications") | nullable |
| `puntaje_obtenido` | `scoreObtained` | number | nullable |
| `porcentaje` | `percentage` | number | nullable |
| `tiempo_utilizado` | `timeUsed` | number | minutos | nullable |
| `estado` | `status` | string | pendiente, completado |
| `fecha_calificacion` | `gradeDate` | number | timestamp | nullable |
| `created_at` | `_creationTime` | Convex |

---

### studentAnswers (respuestas_estudiante)

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `resultado_id` | `resultId` | v.id("examResults") |
| `aplicacion_id` | `applicationId` | v.id("examApplications") |
| `estudiante_id` | `studentId` | v.id("students") |
| `pregunta_id` | `questionId` | v.id("questions") |
| `opcion_id` | `optionId` | v.id("answerOptions") | nullable |
| `es_correcta` | `isCorrect` | boolean | nullable |
| `puntaje_obtenido` | `scoreObtained` | number | nullable |
| `created_at` | `_creationTime` | Convex |

---

### scannedExams (examenes_escaneados)

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `profesor_id` | `teacherId` | v.id("teachers") |
| `examen_id` | `examId` | v.id("exams") |
| `resultado_id` | `resultId` | v.id("examResults") | nullable |
| `archivo_original` | `originalFilename` | string |
| `archivo_procesado` | `processedFilename` | string |
| `ruta_s3_original` | `originalS3Path` | string |
| `ruta_s3_procesado` | `processedS3Path` | string |
| `fecha_escaneo` | `scanDate` | number | timestamp |
| `created_at` | `_creationTime` | Convex |

---

### examScans (exam_scans) - Queue de OMR

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `job_id` | `jobId` | string | único |
| `image_path` | `imagePath` | string |
| `exam_id` | `examId` | v.id("exams") | nullable |
| `student_id` | `studentId` | v.id("students") | nullable |
| `group_id` | `groupId` | v.id("groups") | nullable |
| `status` | `status` | string | pending, in_queue, processing, completed, error |
| `result` | `result` | v.json() | nullable |
| `metadata` | `metadata` | v.json() | nullable |
| `created_at` | `_creationTime` | Convex |

---

### gradingSchemes (esquemas_calificacion)

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `grupo_id` | `groupId` | v.id("groups") |
| `nombre` | `name` | string |
| `descripcion` | `description` | string | nullable |
| `fecha_inicio` | `startDate` | number | timestamp |
| `fecha_fin` | `endDate` | number | timestamp | nullable |
| `es_activo` | `isActive` | boolean |
| `created_at` | `_creationTime` | Convex |

---

### gradingPeriods (periodos_calificacion)

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `esquema_id` | `schemeId` | v.id("gradingSchemes") |
| `nombre` | `name` | string |
| `porcentaje` | `percentage` | number | 0-100 |
| `orden` | `order` | number |
| `fecha_inicio` | `startDate` | number | timestamp |
| `fecha_fin` | `endDate` | number | timestamp | nullable |
| `created_at` | `_creationTime` | Convex |

---

### gradeComponents (componentes_calificacion)

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `periodo_id` | `periodId` | v.id("gradingPeriods") |
| `nombre` | `name` | string |
| `porcentaje` | `percentage` | number | 0-100 |
| `tipo` | `type` | string |
| `created_at` | `_creationTime` | Convex |

---

### grades (calificaciones)

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `estudiante_id` | `studentId` | v.id("students") |
| `componente_id` | `componentId` | v.id("gradeComponents") |
| `valor` | `value` | number | 0-5 |
| `created_at` | `_creationTime` | Convex |

---

### examToGradeComponents (examenes_a_componentes_calificacion)

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `examen_id` | `examId` | v.id("exams") |
| `componente_id` | `componentId` | v.id("gradeComponents") |
| `created_at` | `_creationTime` | Convex |

---

### examComponents (examenes_componente) - Legacy

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `componente_id` | `componentId` | v.id("gradeComponents") |
| `examen_id` | `examId` | v.id("exams") |
| `porcentaje` | `percentage` | number |
| `fecha_aplicacion` | `applicationDate` | number | timestamp |
| `created_at` | `_creationTime` | Convex |

---

### tierLimits

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `tier` | `tier` | string | free, plus, admin, grandfathered |
| `ai_generations_per_month` | `aiGenerationsPerMonth` | number | -1 = ilimitado |
| `scans_per_month` | `scansPerMonth` | number | -1 = ilimitado |
| `max_students` | `maxStudents` | number | -1 = ilimitado |
| `max_groups` | `maxGroups` | number | -1 = ilimitado |
| `features` | `features` | v.json() | |
| `created_at` | `_creationTime` | Convex |

---

### usageTracking

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `profesor_id` | `teacherId` | v.id("teachers") |
| `month_year` | `monthYear` | string | YYYY-MM |
| `ai_generations_used` | `aiGenerationsUsed` | number |
| `scans_used` | `scansUsed` | number |
| `cycle_start_date` | `cycleStartDate` | number | timestamp |
| `cycle_end_date` | `cycleEndDate` | number | timestamp |
| `created_at` | `_creationTime` | Convex |

---

### examSimilarProcesses (procesos_examen_similar)

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `user_id` | `userId` | v.id("teachers") |
| `source_exam_id` | `sourceExamId` | v.id("exams") |
| `draft_exam_id` | `draftExamId` | v.id("exams") | nullable |
| `status` | `status` | string | queued, running, failed, completed |
| `step` | `step` | string | nullable |
| `seed` | `seed` | number | nullable |
| `langchain_run_id` | `langchainRunId` | string | nullable |
| `error_key` | `errorKey` | string | nullable |
| `error_meta` | `errorMeta` | v.json() | nullable |
| `timings` | `timings` | v.array(v.json()) | |
| `logs` | `logs` | v.array(v.json()) | |
| `created_at` | `_creationTime` | Convex |

---

### userNotifications

| Campo ES | Campo EN | Tipo |
|----------|----------|------|
| `id` | `_id` | Convex ID |
| `user_id` | `userId` | v.id("teachers") |
| `email` | `email` | string |
| `notification_sent` | `notificationSent` | boolean | nullable |
| `details` | `details` | v.json() | nullable |
| `error` | `error` | string | nullable |
| `created_at` | `_creationTime` | Convex |

---

## Migración de Funciones SQL a Convex

Las siguientes funciones SQL deben migrarse a Convex Queries/Mutations/Actions:

### Sistema de Tiers

| Función SQL | Tipo Convex | Descripción |
|-------------|--------------|-------------|
| `calculate_cycle_dates()` | Query | Retorna rango de fechas del ciclo actual |
| `get_or_create_usage_tracking()` | Mutation | Obtiene/crea registro de tracking mensual |
| `check_feature_limit()` | Query | Verifica si usuario puede usar feature |
| `increment_feature_usage()` | Mutation | Incrementa contador de uso |

### Onboarding

| Función SQL | Tipo Convex | Descripción |
|-------------|--------------|-------------|
| `update_onboarding_status()` | Mutation | Actualiza onboarding_status con deep merge |
| `is_profesor_of_grupo()` | Helper (interna) | Verifica ownership en queries |

### Notas de Migración de Funciones
- Eliminar `SECURITY DEFINER` → usar validación de auth en Convex
- `v.json()` para campos JSON en schema
- Deep merge implementado en TypeScript directamente

---

## Estadísticas de Datos

| Colección | Filas Aprox |
|-----------|-------------|
| teachers | 30 |
| students | 405 |
| studentGroups | 454 |
| exams | 32 |
| questions | 686 |
| answerOptions | 2,700 |
| examResults | 665 |
| studentAnswers | 17,713 |
| scannedExams | 658 |
| **Total** | **~24,000** |
