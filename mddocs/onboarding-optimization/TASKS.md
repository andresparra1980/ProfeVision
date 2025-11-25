# Tareas - Onboarding Optimizado

---

## Fase 1: Infraestructura

### 1.1 Base de Datos

> **IMPORTANTE**: Todas las migraciones deben ejecutarse via **MCP Supabase** (no manualmente ni con Supabase CLI local). Esto asegura sincronización con producción y evita conflictos.

**Estado actual descubierto**:
- Ya existe `first_login_completed` (boolean, default false) en `profesores`
- 52 usuarios existentes en la tabla
- Podemos usar `first_login_completed` para detectar usuarios legacy

**Tareas**:
- [x] Crear migración via MCP Supabase para agregar `onboarding_status` (JSONB, nullable, default NULL) a `profesores`
- [x] La migración debe incluir:
  - Columna nullable para no afectar usuarios existentes
  - Comentario SQL documentando estructura esperada del JSON
  - NO aplicar default a registros existentes (NULL = usuario legacy)
- [x] Estructura del JSON:
  ```json
  {
    "wizard_completed": boolean,
    "wizard_step": number,
    "wizard_started_at": timestamp,
    "wizard_completed_at": timestamp,
    "checklist_items": {
      "exam_created": boolean,
      "exam_published": boolean,
      "pdf_exported": boolean,
      "first_scan": boolean
    },
    "skipped": boolean,
    "skip_reason": string
  }
  ```
- [x] Crear función SQL `update_onboarding_status(user_id, status_json)` via MCP
- [x] Regenerar tipos TypeScript via `supabase gen types` después de migración

**Lógica de detección de usuario nuevo**:
```
IF onboarding_status IS NOT NULL THEN
  -- Usuario post-migración: usar onboarding_status
ELSIF first_login_completed = true THEN
  -- Usuario legacy que ya usó el sistema: NO mostrar wizard
ELSE
  -- Usuario legacy que nunca completó login: evaluar mostrar wizard
END IF
```

### 1.2 API Endpoints
- [x] `GET /api/onboarding/status` - obtener estado actual
- [x] `PATCH /api/onboarding/status` - actualizar estado
- [x] `POST /api/onboarding/complete-step` - marcar paso como completado

### 1.3 Context y Hooks
- [x] Crear `OnboardingContext` con estado global
- [x] Crear `useOnboarding` hook
- [x] Crear `useOnboardingStep` hook para pasos individuales
- [x] Implementar persistencia con Supabase

### 1.4 Detección de Usuario Nuevo
- [x] Modificar `middleware.ts` para detectar onboarding pendiente (via Context client-side)
- [x] Lógica para determinar si mostrar wizard
- [x] Flag para usuarios existentes (no mostrar wizard)

---

## Fase 2: Wizard Modal

### 2.1 Componente Base
- [x] Crear `OnboardingWizard.tsx` (modal multi-step)
- [x] Implementar navegación entre pasos (next/back)
- [x] Progress indicator (stepper visual)
- [x] Animaciones de transición entre pasos
- [x] Manejo de estado local del wizard

### 2.2 Paso: Bienvenida
- [x] Crear `WelcomeStep.tsx`
- [x] Mensaje de bienvenida personalizado (nombre del usuario si disponible)
- [x] Explicación del proceso (3 minutos, 5 pasos)
- [x] Ilustración/animación atractiva
- [x] Botón "Comenzar"

### 2.3 Paso: Institución
- [x] Crear `InstitutionStep.tsx`
- [x] Form con nombre (requerido)
- [x] Select de tipo (opcional): Colegio, Universidad, Instituto, Otro
- [ ] Upload de logo (opcional, con skip) - pendiente
- [x] Validación
- [x] Crear institución en DB al completar

### 2.4 Paso: Materia
- [x] Crear `SubjectStep.tsx`
- [x] Form con nombre (requerido)
- [x] Mostrar institución seleccionada (readonly)
- [ ] Nivel educativo (opcional) - pendiente
- [x] Validación
- [x] Crear materia asociada a institución

### 2.5 Paso: Grupo
- [x] Crear `GroupStep.tsx`
- [x] Form con nombre (requerido)
- [x] Mostrar materia seleccionada (readonly)
- [x] Campo de año/periodo (opcional)
- [x] Validación
- [x] Crear grupo asociado a materia

### 2.6 Paso: Estudiantes
- [x] Crear `StudentsStep.tsx`
- [x] Tabs o toggle: "Importar Excel" / "Agregar manual"
- [ ] Importador Excel simplificado (reusar `excel-import.tsx`) - placeholder
- [x] Form para agregar estudiante individual
- [x] Lista de estudiantes agregados (con opción de eliminar)
- [x] Mínimo 1 estudiante para continuar (o crear ficticios)
- [x] Botón "Agregar después" con advertencia

### 2.7 Paso: Opciones de Examen
- [x] Crear `ExamOptionsStep.tsx`
- [x] Card/botones para cada opción:
  - Crear con IA → redirect a chat
  - Importar existente → abrir ImportExamDialog
  - Crear manualmente → redirect a create
  - Explorar primero → cerrar wizard, ir a dashboard
- [x] Marcar wizard como completado
- [x] Tooltip explicando cada opción

### 2.8 Traducciones
- [x] Crear `i18n/locales/es/onboarding.json`
- [x] Crear `i18n/locales/en/onboarding.json`
- [x] Todos los textos del wizard traducidos

---

## Fase 3: Checklist Dashboard

### 3.1 Componente Checklist
- [ ] Crear `OnboardingChecklist.tsx`
- [ ] Diseño: sidebar sticky o banner colapsable
- [ ] Lista de items con estado (pendiente/completado/en progreso)
- [ ] Icono y descripción por item
- [ ] Botón de acción directa por item
- [ ] Progress bar general
- [ ] Botón minimizar/expandir
- [ ] Botón "No mostrar más" (con confirmación)

### 3.2 Items del Checklist
- [ ] Item: Crear/importar examen
  - Detectar si existe al menos 1 examen
  - CTA: "Crear examen" o "Importar"
- [ ] Item: Publicar examen
  - Detectar si existe aplicación de examen
  - CTA: "Publicar en grupo"
- [ ] Item: Descargar hojas de respuestas
  - Detectar si usuario ha exportado PDF
  - CTA: "Exportar PDFs"
- [ ] Item: Escanear primer examen
  - Detectar si existe al menos 1 respuesta escaneada
  - CTA: "Escanear examen"

### 3.3 Integración en Dashboard
- [ ] Modificar `dashboard/layout.tsx` para incluir checklist
- [ ] Lógica condicional: mostrar solo si onboarding incompleto
- [ ] Posicionamiento responsive (sidebar en desktop, banner en mobile)
- [ ] Z-index y layering correcto

### 3.4 Tracking de Progreso
- [ ] Hook para calcular progreso checklist
- [ ] Listeners para detectar completación de items
- [ ] Actualizar DB cuando item se completa
- [ ] Celebración/confetti al completar todo

---

## Fase 4: Mejoras Post-Examen

### 4.1 Guía para Publicar Examen
- [ ] Tooltip/popover en página de examen creado
- [ ] Highlight del botón "Publicar"
- [ ] Mini-tutorial si es primera vez

### 4.2 Guía para Exportar PDFs
- [ ] Tooltip en página de exportación
- [ ] Explicar formato de hojas de respuestas
- [ ] Preview de cómo se ven los QR codes

### 4.3 CTA para Primer Escaneo
- [ ] Banner destacado post-exportación
- [ ] Link a app móvil o web scanner
- [ ] Video demo corto (opcional)

### 4.4 Tooltips Contextuales
- [ ] Sistema de tooltips "first-time"
- [ ] Persistencia de tooltips vistos
- [ ] Highlight visual de elementos nuevos

---

## Fase 5: Polish y Analytics

### 5.1 Animaciones
- [ ] Transiciones suaves entre pasos del wizard
- [ ] Animación de entrada del wizard
- [ ] Animación de items del checklist al completarse
- [ ] Micro-interacciones (hover, click)

### 5.2 Estados de Error
- [ ] Manejo de errores en cada paso
- [ ] Retry automático en fallos de red
- [ ] Mensajes de error amigables
- [ ] Fallback si wizard falla mid-proceso

### 5.3 Analytics
- [ ] Evento: wizard_started
- [ ] Evento: wizard_step_completed (con step_name)
- [ ] Evento: wizard_abandoned (con last_step)
- [ ] Evento: wizard_completed
- [ ] Evento: checklist_item_completed
- [ ] Evento: onboarding_fully_completed
- [ ] Dashboard de métricas (opcional, admin)

### 5.4 Testing
- [ ] Tests unitarios para hooks
- [ ] Tests de integración para wizard
- [ ] Test E2E del flujo completo
- [ ] Testing en diferentes breakpoints

### 5.5 Documentación
- [ ] Actualizar README con info de onboarding
- [ ] Documentar API de onboarding
- [ ] Guía para modificar/extender wizard

### 5.6 Cleanup
- [ ] Eliminar código comentado
- [ ] Optimizar imports
- [ ] Review de accesibilidad (a11y)
- [ ] Review de performance

---

## Backlog / Nice-to-Have

- [ ] Opción de "Crear examen demo" con preguntas pre-definidas
- [ ] Video tutorial embebido en paso de bienvenida
- [ ] Onboarding para features específicos (no solo inicial)
- [ ] A/B test de diferentes flujos
- [ ] Personalización del wizard según rol/institución
- [ ] Skip wizard para usuarios invitados por otro profesor
- [ ] Exportar datos del onboarding para análisis

---

## Fase 6: Re-engagement de Usuarios (Futuro)

> Esta fase es opcional y puede implementarse como feature separado después del onboarding.

### 6.1 Infraestructura de Correos
- [ ] Integrar servicio de email (Resend, SendGrid, etc.)
- [ ] Templates de correo con branding ProfeVision
- [ ] Sistema de tracking de correos enviados

### 6.2 Segmentación de Usuarios
- [ ] Query: usuarios sin email confirmado (`auth.users.email_confirmed_at IS NULL`)
- [ ] Query: usuarios con email confirmado pero `first_login_completed = false`
- [ ] Query: usuarios con `onboarding_status.wizard_completed = false`
- [ ] Query: usuarios con wizard completo pero sin primer escaneo

### 6.3 Campañas de Re-engagement
- [ ] Correo: "Confirma tu email para empezar" (día 1, 3, 7)
- [ ] Correo: "Te esperamos - completa tu registro" (día 2, 5)
- [ ] Correo: "Solo te faltan 2 pasos para tu primer examen" (día 3)
- [ ] Correo: "¿Necesitas ayuda? Tutorial de escaneo" (día 7)

### 6.4 Analytics de Campañas
- [ ] Tracking de apertura de correos
- [ ] Tracking de clicks en CTAs
- [ ] Dashboard de conversión por campaña
- [ ] Unsubscribe handling
