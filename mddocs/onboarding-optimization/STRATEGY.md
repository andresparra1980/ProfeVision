# Estrategia de Onboarding Optimizado

## Problema Actual

Los usuarios nuevos enfrentan demasiada fricción antes de llegar al "gotcha moment" de ProfeVision: **calificar exámenes de papel con OMR**. 

### Camino actual (orden de ejecución):
1. Crear Institución
2. Crear Materia
3. Crear Grupo
4. Importar estudiantes al grupo
5. Crear/importar examen
6. Publicar examen
7. Imprimir hojas de respuestas personalizadas (QR único por estudiante)
8. **Escanear y calificar** ← Gotcha moment

## Objetivo

Reducir time-to-value mediante un wizard guiado que lleve al usuario desde registro hasta tener un examen listo para imprimir en una sola sesión.

---

## Alternativas Evaluadas

### Alternativa A: Wizard Completo Post-Registro
**Descripción**: Wizard modal que aparece inmediatamente después del registro, guiando paso a paso.

**Flujo**:
```
Registro → Wizard Modal (5-6 pasos) → Dashboard con examen listo
```

**Pros**:
- Experiencia guiada y clara
- Usuario no se pierde
- Garantiza que llegue al gotcha moment
- Control total del flujo

**Contras**:
- Puede sentirse largo
- No permite exploración libre
- Usuarios impacientes pueden abandonar

---

### Alternativa B: Onboarding Progresivo con Checklist
**Descripción**: Checklist persistente en dashboard que indica pasos pendientes, sin forzar orden.

**Flujo**:
```
Registro → Dashboard → Checklist lateral (con progreso) → Completar pasos
```

**Pros**:
- Menos intrusivo
- Usuario puede explorar
- Más flexible

**Contras**:
- Usuario puede ignorar
- Menos guiado
- Mayor riesgo de abandono antes del gotcha moment

---

### Alternativa C: Híbrido (Recomendado)
**Descripción**: Wizard para pasos críticos + checklist para seguimiento.

**Flujo**:
```
Registro → Wizard Modal (Institución → Materia → Grupo → Importar estudiantes)
        → Dashboard con checklist (Crear examen → Publicar → Exportar PDFs)
```

**Pros**:
- Asegura creación de entidades base
- Permite exploración en creación de examen (proceso más complejo)
- Balance entre guía y flexibilidad
- Opción de "crear examen demo" para acelerar

**Contras**:
- Más complejidad de implementación

---

### Alternativa D: Demo Data + Tour
**Descripción**: Crear datos demo automáticamente, tour interactivo del producto.

**Flujo**:
```
Registro → Crear datos demo (1 institución, 1 materia, 1 grupo, 5 estudiantes ficticios)
        → Tour interactivo → Usuario prueba con datos demo
```

**Pros**:
- Time-to-value más rápido
- Usuario ve el producto funcionando inmediatamente
- Puede borrar datos demo después

**Contras**:
- Datos ficticios pueden confundir
- Usuario aún debe crear sus propios datos reales
- Doble trabajo potencial

---

## Decisión Recomendada: Alternativa C (Híbrido)

### Justificación:
1. Los pasos de setup (Institución → Materia → Grupo → Estudiantes) son rápidos y obligatorios
2. La creación de examen es más compleja y merece exploración
3. El wizard garantiza la estructura base necesaria
4. El checklist guía sin forzar el resto del proceso

### Variante con "Quick Start":
Ofrecer opción de "Crear examen de demostración" en el wizard para usuarios que quieren ver el producto funcionando rápidamente.

---

## Flujo Propuesto Detallado

### Fase 1: Wizard de Setup Inicial (Modal, obligatorio)

**Paso 1: Bienvenida**
- Mensaje de bienvenida personalizado
- Explicación breve: "En 3 minutos tendrás todo listo para crear tu primer examen"
- Botón: "Comenzar"

**Paso 2: Crear Institución**
- Nombre de la institución (requerido)
- Tipo (opcional): Colegio, Universidad, Instituto, Otro
- Logo (opcional, skip para después)

**Paso 3: Crear Materia**
- Nombre de la materia (requerido)
- Se asocia automáticamente a la institución creada

**Paso 4: Crear Grupo**
- Nombre del grupo (requerido)
- Nivel/Grado (opcional)
- Se asocia automáticamente a la materia creada

**Paso 5: Importar Estudiantes**
- Opción A: Importar desde Excel (template descargable)
- Opción B: Crear manualmente (formulario inline)
- Opción C: "Agregar después" (mínimo 1 estudiante para continuar, o crear 3 ficticios)
- Mostrar lista de estudiantes agregados

**Paso 6: Opciones de Examen (último paso del wizard)**
- Opción A: "Crear examen con IA" → Redirige a `/dashboard/exams/ai-exams-creation-chat`
- Opción B: "Importar examen existente" → Abre modal de importación
- Opción C: "Crear examen manualmente" → Redirige a `/dashboard/exams/create`
- Opción D: "Explorar primero" → Va al dashboard con checklist

### Fase 2: Checklist de Onboarding (Dashboard)

Mostrar checklist sticky/sidebar cuando el usuario no ha completado:
- [ ] Crear/importar examen
- [ ] Publicar examen en un grupo
- [ ] Descargar hojas de respuestas (PDF)
- [ ] Escanear primer examen

Cada item tiene:
- Estado (pendiente/completado)
- Botón de acción directa
- Tooltip explicativo

### Fase 3: Guía Contextual

- Tooltips/popovers en primera interacción con features clave
- Highlight de botones importantes
- Links a documentación/videos

---

## Métricas de Éxito

1. **Time to First Exam Created**: < 10 minutos desde registro
2. **Time to First Scan**: < 1 día desde registro
3. **Wizard Completion Rate**: > 80%
4. **Checklist Completion Rate**: > 50% en primera semana
5. **Abandono en Wizard**: < 20%

---

## Consideraciones Técnicas

### Estado de Onboarding
- Nuevo campo en `profesores`: `onboarding_status` (JSON)
- Track de pasos completados
- Persistencia entre sesiones

### Componentes Necesarios
- `OnboardingWizard` (modal multi-step)
- `OnboardingChecklist` (sidebar/banner)
- `StepIndicator` (progress)
- Hooks: `useOnboardingStatus`, `useOnboardingProgress`

### Rutas
- Posible `/dashboard/onboarding` para wizard standalone
- O modal que se monta sobre cualquier ruta del dashboard

---

## Preguntas Abiertas

1. ¿El wizard debe ser skippable para usuarios que migran de otro sistema y ya tienen datos?
2. ¿Crear estudiantes ficticios si el usuario no importa ninguno? (para que pueda probar)
3. ¿Examen de demo pre-creado o generado con IA al momento?
4. ¿Guardar progreso parcial del wizard si el usuario cierra el navegador?
5. ¿El wizard debe aparecer también para usuarios existentes que no han completado setup?
