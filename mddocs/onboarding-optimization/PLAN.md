# Plan de Trabajo - Onboarding Optimizado

## Resumen

Implementar sistema de onboarding híbrido: wizard obligatorio para setup inicial + checklist para completar flujo hasta primer escaneo.

---

## Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                      Nuevo Usuario                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   OnboardingWizard (Modal)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │Bienvenida│→│Institución│→│ Materia  │→│  Grupo   │→│Estudian││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘│
│                                                          │      │
│                                              ┌───────────┘      │
│                                              ▼                  │
│                                    ┌─────────────────────┐     │
│                                    │ Opciones de Examen  │     │
│                                    │ • Crear con IA      │     │
│                                    │ • Importar          │     │
│                                    │ • Manual            │     │
│                                    │ • Explorar          │     │
│                                    └─────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Dashboard                                  │
│  ┌────────────────────┐                                         │
│  │ OnboardingChecklist│  ← Sticky sidebar/banner                │
│  │ □ Crear examen     │                                         │
│  │ □ Publicar examen  │                                         │
│  │ □ Descargar PDFs   │                                         │
│  │ □ Escanear examen  │                                         │
│  └────────────────────┘                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Dependencias Técnicas

### Base de Datos

> **IMPORTANTE**: Migraciones via **MCP Supabase** únicamente.

- Agregar columna `onboarding_status` a tabla `profesores` (JSONB, nullable)
- NULL = usuario legacy (no mostrar wizard)
- Posible tabla `onboarding_events` para analytics (fase 5)

### Componentes UI
- Modal multi-step (basado en Dialog de shadcn)
- Stepper/Progress indicator
- Formularios inline para cada entidad
- Import de estudiantes simplificado

### Estado Global
- Context o Zustand para estado de onboarding
- Sincronización con Supabase

### Rutas/Navegación
- Middleware para verificar si usuario necesita onboarding
- Redirección condicional post-login

---

## Fases de Implementación

### Fase 1: Infraestructura
- Schema de onboarding en DB
- Context/hooks de onboarding
- Lógica de detección de usuario nuevo

### Fase 2: Wizard Modal
- Componente base multi-step
- Paso de Institución
- Paso de Materia
- Paso de Grupo
- Paso de Estudiantes
- Paso de opciones de examen

### Fase 3: Checklist Dashboard
- Componente Checklist
- Integración en layout del dashboard
- Lógica de tracking de progreso
- Acciones directas desde checklist

### Fase 4: Mejoras Post-Examen
- Guía para publicar examen
- Guía para exportar PDFs
- CTA para primer escaneo

### Fase 5: Polish y Analytics
- Animaciones y transiciones
- Tracking de eventos
- A/B testing setup
- Documentación

---

## Estimación de Esfuerzo

| Fase | Complejidad | Dependencias |
|------|-------------|--------------|
| Fase 1 | Media | Ninguna |
| Fase 2 | Alta | Fase 1 |
| Fase 3 | Media | Fase 1, Fase 2 |
| Fase 4 | Media | Fase 2, Fase 3 |
| Fase 5 | Baja | Todas |

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Wizard muy largo, abandono | Media | Alto | Hacer pasos muy cortos, mostrar progreso claro |
| Usuarios existentes afectados | Baja | Medio | Flag para usuarios pre-existentes |
| Importación de estudiantes falla | Media | Alto | Fallback a creación manual simple |
| Estado de onboarding desincronizado | Baja | Medio | Single source of truth en DB |

---

## Criterios de Aceptación

### Wizard
- [ ] Flujo completo en < 3 minutos
- [ ] Cada paso validado antes de continuar
- [ ] Progress indicator visible
- [ ] Botón "atrás" funcional
- [ ] Datos persisten si usuario cierra y vuelve
- [ ] Responsive (mobile-friendly)

### Checklist
- [ ] Visible en todas las páginas del dashboard hasta completar
- [ ] Se puede minimizar/ocultar temporalmente
- [ ] Links directos a acciones
- [ ] Estado actualizado en tiempo real
- [ ] Desaparece al completar todos los pasos

### Integración
- [ ] No afecta usuarios existentes
- [ ] No rompe flujos actuales
- [ ] Performance sin degradación notable

---

## Archivos Clave a Crear/Modificar

### Nuevos
```
components/onboarding/
├── OnboardingWizard.tsx
├── OnboardingChecklist.tsx
├── steps/
│   ├── WelcomeStep.tsx
│   ├── InstitutionStep.tsx
│   ├── SubjectStep.tsx
│   ├── GroupStep.tsx
│   ├── StudentsStep.tsx
│   └── ExamOptionsStep.tsx
├── hooks/
│   └── useOnboarding.ts
└── contexts/
    └── OnboardingContext.tsx

lib/onboarding/
├── types.ts
├── utils.ts
└── api.ts
```

### Modificados
```
app/[locale]/dashboard/layout.tsx    # Integrar checklist
app/[locale]/dashboard/page.tsx      # Trigger wizard si necesario
middleware.ts                         # Detección de onboarding pendiente
lib/types/database.ts                # Tipos para onboarding_status
supabase/migrations/                 # Nueva migración para schema
i18n/locales/*/onboarding.json       # Traducciones
```
