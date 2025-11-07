# Dashboard Refactorización y Skeletons - Tareas de Implementación

**Feature Branch**: `feature/dashboard-refactoring-and-skeletons`
**Estado**: Fase 2 Completada - En Fase 3 (Testing)
**Creado**: 2025-11-06
**Última Actualización**: 2025-11-07
**Versión**: 1.2

---

## Organización de Tareas

Las tareas están organizadas en **3 fases** con dependencias claras:
- **Fase 1**: Refactorización (debe completarse antes de la Fase 2)
- **Fase 2**: Implementación de Skeletons (depende de la Fase 1)
- **Fase 3**: Pruebas y Validación (fase final)

---

## Fase 1: Refactorización de Páginas Legacy

### Etapa 1.1: Refactorización de Página `/students` (CRÍTICO - 3-4h)

**Por qué primero**: Página más larga (659 líneas), más compleja, mayor impacto

#### Tarea 1.1.1: Crear Estructura de Componentes
- [ ] Crear directorio `app/[locale]/dashboard/students/components/`
- [ ] Crear `index.ts` para barrel exports
- [ ] Configurar interfaces TypeScript en ubicación compartida

**Estimado**: 15 min

---

#### Tarea 1.1.2: Extraer StudentFormModal
- [ ] Crear `components/students/StudentFormModal.tsx`
- [ ] Mover JSX del formulario (líneas 514-625 de page.tsx)
- [ ] Mover gestión de estado del formulario (nombres, apellidos, identificacion, email, grupo_id)
- [ ] Mover lógica de validación del formulario
- [ ] Mover lógica de handleSubmit
- [ ] Agregar tipos TypeScript apropiados
- [ ] Probar: Flujo de creación de estudiante funciona

**Ubicación actual del código**: `app/[locale]/dashboard/students/page.tsx:514-625`

**Estructura del componente**:
```typescript
interface StudentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grupos: Grupo[];
  onSubmit: (data: FormData) => Promise<void>;
}

export function StudentFormModal({ ... }: StudentFormModalProps) {
  // Estado y lógica del formulario
}
```

**Estimado**: 1 hora

---

#### Tarea 1.1.3: Extraer StudentsTable
- [ ] Crear `components/students/StudentsTable.tsx`
- [ ] Mover JSX de la tabla (líneas 423-464)
- [ ] Mover lógica de búsqueda
- [ ] Mover lógica de filtrado
- [ ] Agregar tipos TypeScript apropiados
- [ ] Probar: La tabla muestra estudiantes correctamente
- [ ] Probar: La funcionalidad de búsqueda funciona

**Ubicación actual del código**: `app/[locale]/dashboard/students/page.tsx:423-464`

**Estructura del componente**:
```typescript
interface StudentsTableProps {
  students: Student[];
  searchQuery: string;
  loading: boolean;
  onViewDetails: (studentId: string) => void;
}

export function StudentsTable({ ... }: StudentsTableProps) {
  // Renderizado de la tabla
}
```

**Estimado**: 45 min

---

#### Tarea 1.1.4: Extraer StudentDetailsDialog
- [ ] Crear `components/students/StudentDetailsDialog.tsx`
- [ ] Mover JSX del diálogo de detalles (líneas 466-495)
- [ ] Mover lógica de fetch de detalles del estudiante
- [ ] Agregar tipos TypeScript apropiados
- [ ] Probar: El diálogo de detalles muestra grupos del estudiante

**Ubicación actual del código**: `app/[locale]/dashboard/students/page.tsx:466-495`

**Estructura del componente**:
```typescript
interface StudentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentDetails | null;
  loading: boolean;
}

export function StudentDetailsDialog({ ... }: StudentDetailsDialogProps) {
  // Visualización de detalles
}
```

**Estimado**: 30 min

---

#### Tarea 1.1.5: Extraer EmptyStudentsState
- [ ] Crear `components/students/EmptyStudentsState.tsx`
- [ ] Mover JSX del estado vacío (líneas 376-420)
- [ ] Agregar tipos TypeScript apropiados
- [ ] Probar: Los estados vacíos se renderizan correctamente (sin grupos, sin estudiantes)

**Ubicación actual del código**: `app/[locale]/dashboard/students/page.tsx:376-420`

**Estructura del componente**:
```typescript
interface EmptyStudentsStateProps {
  hasGroups: boolean;
  onCreateStudent: () => void;
  onManageGroups: () => void;
}

export function EmptyStudentsState({ ... }: EmptyStudentsStateProps) {
  // Visualización del estado vacío
}
```

**Estimado**: 20 min

---

#### Tarea 1.1.6: Simplificar Página Principal
- [ ] Refactorizar `page.tsx` para usar nuevos componentes
- [ ] Mantener solo: hooks, obtención de datos, manejadores de eventos
- [ ] Eliminar todo JSX inline (mover a componentes)
- [ ] Verificar que la página tenga ~150-200 líneas
- [ ] Probar: Toda la funcionalidad sigue funcionando
- [ ] Probar: Sin regresiones

**Estructura objetivo**:
```typescript
export default function StudentsPage() {
  // Hooks
  // Obtención de datos
  // Manejadores de eventos

  return (
    <div className="space-y-4">
      <TitleCardWithDepth {...headerProps} />
      <Card>
        <CardHeader>{/* Búsqueda */}</CardHeader>
        <CardContent>
          {renderStudentsList()} // Ahora usa componentes
        </CardContent>
      </Card>
      <StudentFormModal {...formProps} />
      <StudentDetailsDialog {...detailsProps} />
    </div>
  );
}
```

**Estimado**: 30 min

---

### Etapa 1.2: Refactorización de Página `/settings` (2-3h)

#### Tarea 1.2.1: Crear Estructura de Componentes
- [ ] Crear directorio `app/[locale]/dashboard/settings/components/`
- [ ] Crear `index.ts` para barrel exports

**Estimado**: 10 min

---

#### Tarea 1.2.2: Extraer ProfileForm
- [ ] Crear `components/settings/ProfileForm.tsx`
- [ ] Mover JSX del formulario de perfil (líneas 120-199)
- [ ] Mover estado del formulario (profileData)
- [ ] Mover lógica de handleSubmit
- [ ] Agregar tipos TypeScript apropiados
- [ ] Probar: La actualización de perfil funciona

**Ubicación actual del código**: `app/[locale]/dashboard/settings/page.tsx:120-199`

**Estimado**: 1 hora

---

#### Tarea 1.2.3: Extraer PasswordSection
- [ ] Crear `components/settings/PasswordSection.tsx`
- [ ] Mover JSX de la sección de contraseña (líneas 202-212)
- [ ] Agregar lógica de cambio de contraseña (placeholder por ahora)
- [ ] Probar: La sección se renderiza correctamente

**Ubicación actual del código**: `app/[locale]/dashboard/settings/page.tsx:202-212`

**Estimado**: 30 min

---

#### Tarea 1.2.4: Extraer NotificationsSection
- [ ] Crear `components/settings/NotificationsSection.tsx`
- [ ] Mover JSX de la sección de notificaciones (líneas 214-226)
- [ ] Agregar placeholder para futura lógica de notificaciones
- [ ] Probar: La sección se renderiza correctamente

**Ubicación actual del código**: `app/[locale]/dashboard/settings/page.tsx:214-226`

**Estimado**: 20 min

---

#### Tarea 1.2.5: Simplificar Página Principal
- [ ] Refactorizar `page.tsx` para usar nuevos componentes
- [ ] Mantener solo: hooks, obtención de datos
- [ ] Verificar que la página tenga ~80-100 líneas
- [ ] Probar: Toda la funcionalidad funciona

**Estimado**: 20 min

---

### Etapa 1.3: Refactorización de Página `/entities` (2h)

#### Tarea 1.3.1: Crear Estructura de Componentes
- [ ] Crear directorio `app/[locale]/dashboard/entities/components/`
- [ ] Crear `index.ts` para barrel exports

**Estimado**: 10 min

---

#### Tarea 1.3.2: Extraer EntityFormModal
- [ ] Crear `components/entities/EntityFormModal.tsx`
- [ ] Mover JSX del diálogo de formulario (líneas 181-235)
- [ ] Mover estado del formulario y lógica de submit
- [ ] Probar: Crear entidad funciona

**Ubicación actual del código**: `app/[locale]/dashboard/entities/page.tsx:181-235`

**Estimado**: 45 min

---

#### Tarea 1.3.3: Extraer EntitiesTable
- [ ] Crear `components/entities/EntitiesTable.tsx`
- [ ] Mover JSX de la tabla (líneas 277-293)
- [ ] Mover lógica de búsqueda/filtrado
- [ ] Probar: La tabla se muestra correctamente

**Ubicación actual del código**: `app/[locale]/dashboard/entities/page.tsx:277-293`

**Estimado**: 30 min

---

#### Tarea 1.3.4: Extraer EmptyEntitiesState
- [ ] Crear `components/entities/EmptyEntitiesState.tsx`
- [ ] Mover JSX del estado vacío (líneas 239-248)
- [ ] Probar: El estado vacío se renderiza correctamente

**Ubicación actual del código**: `app/[locale]/dashboard/entities/page.tsx:239-248`

**Estimado**: 15 min

---

#### Tarea 1.3.5: Simplificar Página Principal
- [ ] Refactorizar `page.tsx` para usar nuevos componentes
- [ ] Verificar que la página tenga ~150 líneas
- [ ] Probar: Toda la funcionalidad funciona

**Estimado**: 20 min

---

### Etapa 1.4: Limpieza de Página `/groups` (1.5h)

#### Tarea 1.4.1: Extraer DeleteGroupDialog
- [ ] Crear `components/groups/DeleteGroupDialog.tsx`
- [ ] Mover JSX del diálogo de eliminación (líneas 501-582) - ¡82 líneas!
- [ ] Mover lógica de confirmación de eliminación
- [ ] Agregar tipos TypeScript apropiados
- [ ] Probar: La confirmación de eliminación funciona

**Ubicación actual del código**: `app/[locale]/dashboard/groups/page.tsx:501-582`

**Estimado**: 1 hora

---

#### Tarea 1.4.2: Limpiar Página Principal
- [ ] Eliminar código de diálogo inline
- [ ] Usar nuevo componente DeleteGroupDialog
- [ ] Verificar que la página se reduzca a ~300-350 líneas
- [ ] Probar: Toda la funcionalidad funciona

**Estimado**: 30 min

---

## Fase 2: Implementación de Skeletons

### Etapa 2.1: Crear Biblioteca de Skeletons (1.5h)

#### Tarea 2.1.1: Crear Directorio Base de Skeletons
- [ ] Crear directorio `components/shared/skeletons/`
- [ ] Crear `index.ts` para barrel exports

**Estimado**: 5 min

---

#### Tarea 2.1.2: PageHeaderSkeleton
- [ ] Crear `components/shared/skeletons/page-header-skeleton.tsx`
- [ ] Implementar skeleton de título + descripción + acciones
- [ ] Probar: Coincide con estructura de TitleCardWithDepth

**Estructura**:
```typescript
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-64" /> {/* Título */}
      <Skeleton className="h-4 w-full max-w-md" /> {/* Descripción */}
    </div>
  );
}
```

**Estimado**: 15 min

---

#### Tarea 2.1.3: CardSkeleton
- [ ] Crear `components/shared/skeletons/card-skeleton.tsx`
- [ ] Implementar skeleton de tarjeta genérica
- [ ] Hacer configurable (header, content, footer)
- [ ] Probar: Funciona con varios diseños de tarjetas

**Estimado**: 20 min

---

#### Tarea 2.1.4: TableSkeleton
- [ ] Crear `components/shared/skeletons/table-skeleton.tsx`
- [ ] Implementar tabla con filas configurables
- [ ] Incluir fila de encabezado
- [ ] Probar: Coincide con estructura de tabla

**Estructura**:
```typescript
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  // Skeleton de tabla con filas
}
```

**Estimado**: 25 min

---

#### Tarea 2.1.5: FormSkeleton
- [ ] Crear `components/shared/skeletons/form-skeleton.tsx`
- [ ] Implementar skeleton de campos de formulario
- [ ] Hacer configurable (número de campos)
- [ ] Probar: Coincide con estructura de formulario

**Estimado**: 20 min

---

#### Tarea 2.1.6: Actualizar Barrel Export
- [ ] Exportar todos los skeletons desde `index.ts`
- [ ] Agregar comentarios JSDoc
- [ ] Probar: Todos los skeletons son importables

**Estimado**: 5 min

---

### Etapa 2.2: Implementar Skeletons Específicos por Página (2.5-3.5h)

#### Tarea 2.2.1: SubjectsPageSkeleton
- [ ] Crear `components/subjects/SubjectsPageSkeleton.tsx`
- [ ] Implementar grid de skeletons de tarjetas
- [ ] Reemplazar spinner (page.tsx:222-225)
- [ ] Probar: Coincide con estructura de página de subjects
- [ ] Probar: Compatible con modo oscuro

**Estimado**: 25 min

---

#### Tarea 2.2.2: ExamsPageSkeleton
- [ ] Verificar que `ExamsTableMobile` tenga skeleton
- [ ] Si no, crear `components/exams/ExamsTableSkeleton.tsx`
- [ ] Probar: El estado de carga funciona

**Estimado**: 20 min

---

#### Tarea 2.2.3: SubscriptionPageSkeleton
- [ ] Crear `components/subscription/SubscriptionPageSkeleton.tsx`
- [ ] Reemplazar LoadingSpinner (page.tsx:26)
- [ ] Imitar: header + tarjeta de uso + tarjetas de precios
- [ ] Probar: Coincide con estructura de subscription
- [ ] Probar: Compatible con modo oscuro

**Estimado**: 30 min

---

#### Tarea 2.2.4: GroupsPageSkeleton
- [ ] Crear `components/groups/GroupsPageSkeleton.tsx`
- [ ] Implementar grid de skeletons de tarjetas
- [ ] Reemplazar spinner (page.tsx:467-470)
- [ ] Probar: Coincide con estructura de página de groups

**Estimado**: 25 min

---

#### Tarea 2.2.5: EntitiesPageSkeleton
- [ ] Crear `components/entities/EntitiesPageSkeleton.tsx`
- [ ] Implementar skeleton de tabla
- [ ] Reemplazar spinner (page.tsx:267-270)
- [ ] Probar: Coincide con estructura de tabla de entities

**Estimado**: 25 min

---

#### Tarea 2.2.6: StudentsPageSkeleton
- [ ] Crear `components/students/StudentsPageSkeleton.tsx`
- [ ] Implementar skeleton de tabla
- [ ] Reemplazar spinner (page.tsx:368-374)
- [ ] Probar: Coincide con estructura de tabla de students

**Estimado**: 25 min

---

#### Tarea 2.2.7: SettingsPageSkeleton
- [ ] Crear `components/settings/SettingsPageSkeleton.tsx`
- [ ] Implementar skeleton de formulario
- [ ] Agregar a la página (actualmente sin estado de carga)
- [ ] Probar: Se muestra mientras se obtiene el perfil

**Estimado**: 30 min

---

### Etapa 2.3: Actualizar Importaciones Dinámicas (1h)

#### Tarea 2.3.1: Auditar Importaciones Dinámicas
- [ ] Encontrar todas las llamadas `dynamic()` en el dashboard
- [ ] Listar archivos que usan `LoadingSpinner` en prop loading
- [ ] Crear lista de tareas para cada archivo

**Estimado**: 15 min

---

#### Tarea 2.3.2: Actualizar Importaciones Dinámicas de Página de Resultados
- [ ] Actualizar `app/[locale]/dashboard/exams/[id]/results/page.tsx`
- [ ] Reemplazar LoadingSpinner con skeletons específicos
- [ ] Crear skeletons para cada componente lazy-loaded si es necesario
- [ ] Probar: La carga dinámica funciona con skeletons

**Ubicación actual**: Líneas 24-37

**Estimado**: 30 min

---

#### Tarea 2.3.3: Actualizar Otras Importaciones Dinámicas
- [ ] Aplicar el mismo patrón a cualquier otra importación dinámica encontrada
- [ ] Probar cada una individualmente

**Estimado**: 15 min

---

## Fase 3: Pruebas y Validación (2h)

### Etapa 3.1: Pruebas de Componentes

#### Tarea 3.1.1: Probar Páginas Refactorizadas
- [ ] `/students` - Probar todas las operaciones CRUD
- [ ] `/settings` - Probar actualización de perfil
- [ ] `/entities` - Probar crear/ver entidades
- [ ] `/groups` - Probar confirmación de eliminación
- [ ] Verificar que no haya regresiones

**Estimado**: 45 min

---

#### Tarea 3.1.2: Probar Estados de Carga
- [ ] Limitar red en DevTools
- [ ] Cargar cada página del dashboard
- [ ] Verificar que aparezca el skeleton
- [ ] Verificar que el skeleton coincida con la estructura del contenido final
- [ ] Probar las 7 páginas

**Estimado**: 30 min

---

### Etapa 3.2: Pruebas Visuales y de Accesibilidad

#### Tarea 3.2.1: Pruebas de Modo Oscuro
- [ ] Probar todos los skeletons en modo oscuro
- [ ] Verificar contraste apropiado
- [ ] Verificar que no haya fallas visuales
- [ ] Corregir cualquier problema

**Estimado**: 20 min

---

#### Tarea 3.2.2: Pruebas Responsive
- [ ] Probar todas las páginas en móvil (375px)
- [ ] Probar todas las páginas en tablet (768px)
- [ ] Probar todas las páginas en desktop (1920px)
- [ ] Verificar que los skeletons sean responsive
- [ ] Corregir cualquier problema de diseño

**Estimado**: 25 min

---

### Etapa 3.3: Calidad del Código

#### Tarea 3.3.1: Preparación para Revisión de Código
- [ ] Verificar que todos los archivos sigan la estructura estándar
- [ ] Revisar cualquier comentario TODO restante
- [ ] Verificar que TypeScript no tenga errores
- [ ] Ejecutar ESLint y corregir problemas
- [ ] Formatear código con Prettier

**Estimado**: 15 min

---

#### Tarea 3.3.2: Documentación
- [ ] Actualizar este archivo de tareas con estado de completado
- [ ] Marcar plan como "Completado"
- [ ] Agregar cualquier aprendizaje o nota
- [ ] Actualizar README principal si es necesario

**Estimado**: 10 min

---

## Resumen de Tareas

### Fase 1: Refactorización (8.5-10.5h)
- Etapa 1.1: `/students` - 3-4h
- Etapa 1.2: `/settings` - 2-3h
- Etapa 1.3: `/entities` - 2h
- Etapa 1.4: `/groups` - 1.5h

### Fase 2: Skeletons (5-6h)
- Etapa 2.1: Biblioteca de skeletons - 1.5h
- Etapa 2.2: Skeletons de página - 2.5-3.5h
- Etapa 2.3: Importaciones dinámicas - 1h

### Fase 3: Pruebas (2h)
- Etapa 3.1: Pruebas de componentes - 1.25h
- Etapa 3.2: Pruebas visuales - 45min
- Etapa 3.3: Calidad de código - 25min

**Total**: 15.5-18.5 horas (~2-3 días laborales)

---

## Seguimiento de Progreso

### Fase 1: Refactorización ✅ COMPLETADA
- [x] Etapa 1.1: `/students` (6/6 tareas) - Completada 2025-11-07
  - Reducción: 659 → 272 líneas (~59%)
  - Componentes: StudentFormModal, StudentsTable, StudentDetailsDialog, EmptyStudentsState
- [x] Etapa 1.2: `/settings` (5/5 tareas) - Completada 2025-11-07
  - Reducción: 229 → 94 líneas (~59%)
  - Componentes: ProfileForm, PasswordSection, NotificationsSection
- [x] Etapa 1.3: `/entities` (5/5 tareas) - Completada 2025-11-07
  - Reducción: 300 → 153 líneas (~49%)
  - Componentes: EntityFormModal, EntitiesTable, EmptyEntitiesState
- [x] Etapa 1.4: `/groups` (2/2 tareas) - Completada 2025-11-07
  - Reducción: 584 → 492 líneas (~15%)
  - Componentes: DeleteGroupDialog

### Fase 2: Skeletons 🔄 EN PROGRESO
- [ ] Etapa 2.1: Biblioteca (0/6 tareas)
- [ ] Etapa 2.2: Skeletons de página (0/7 tareas)
- [ ] Etapa 2.3: Importaciones dinámicas (0/3 tareas)

### Fase 3: Pruebas
- [ ] Etapa 3.1: Pruebas de componentes (0/2 tareas)
- [ ] Etapa 3.2: Pruebas visuales (0/2 tareas)
- [ ] Etapa 3.3: Calidad de código (0/2 tareas)

---

## Notas para la Implementación

### Mejores Prácticas
1. **Completar una etapa antes de pasar a la siguiente**
2. **Probar después de cada extracción de componente**
3. **Hacer commit después de completar cada etapa**
4. **Mantener componentes pequeños y enfocados**
5. **Usar TypeScript estrictamente**
6. **Seguir convenciones de nomenclatura existentes**

### Formato de Mensaje de Commit
```
feat(dashboard): refactorizar [página] - extraer [NombreComponente]

- Extraer componente [NombreComponente]
- Mover [lógica específica] al componente
- Reducir complejidad de página de X a Y líneas
- Prueba: [qué se probó]

Parte de la iniciativa de refactorización del dashboard
```

### Checklist de Pruebas (Por Componente)
- [ ] El componente se renderiza correctamente
- [ ] Los props están tipados correctamente
- [ ] Todas las interacciones del usuario funcionan
- [ ] Sin errores en consola
- [ ] Modo oscuro funciona
- [ ] Responsive móvil

---

**Versión del Documento**: 1.1
**Última Actualización**: 2025-11-07
**Estado**: Fase 1 Completada - Fase 2 En Progreso
