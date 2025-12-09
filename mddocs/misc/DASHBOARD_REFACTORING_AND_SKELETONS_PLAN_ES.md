# Plan de Refactorización del Dashboard e Implementación de Skeletons

**Feature Branch**: `feature/dashboard-refactoring-and-skeletons`
**Estado**: Planificado (No Iniciado)
**Prioridad**: Alta - Mejora de Calidad de Código y UX
**Creado**: 2025-11-06

---

## Resumen Ejecutivo

Este plan aborda dos mejoras críticas al dashboard de ProfeVision:

1. **Refactorización de páginas legacy** que fueron creadas rápidamente sin planificación arquitectónica
2. **Implementación de estados de carga skeleton** en todas las secciones del dashboard para mejor UX

El enfoque es **secuencial**: primero refactorizar y estandarizar la arquitectura, luego implementar skeletons consistentemente en todas las páginas.

---

## Análisis del Estado Actual

### Estado de las Páginas del Dashboard

| Página | Líneas | Estado | Estado de Carga | Componentes | Prioridad |
|--------|--------|--------|-----------------|-------------|-----------|
| `/subjects` | 260 | ✅ Bien Refactorizado | Spinner inline | 3 componentes | Baja |
| `/exams` | 364 | ✅ Bien Refactorizado | Delegado a hijo | 2 componentes | Baja |
| `/subscription` | 165 | ✅ Bien Refactorizado | LoadingSpinner | 3 componentes | Media |
| `/groups` | 584 | ⚠️ Parcialmente | Spinner inline | 2 componentes | Media |
| `/entities` | 300 | ⚠️ Parcialmente | Spinner inline | 1 componente | Alta |
| **`/students`** | **659** | ❌ **No Refactorizado** | Spinner inline | **0 componentes** | **Crítica** |
| `/settings` | 229 | ❌ No Refactorizado | Ninguno visible | 0 componentes | Alta |

### Hallazgos Clave

#### ✅ Páginas Bien Refactorizadas (Mantener como Referencia)

**`/subjects` (260 líneas)**
```typescript
// Buen patrón: Componentes separados
- SubjectCard (UI)
- SubjectFormModal (Form)
- DeleteConfirmationModal (Dialog)
- Componente de página limpio con código UI mínimo
```

**`/exams` (364 líneas)**
```typescript
// Patrón excelente: Delegación a componentes hijos
- ExamsTableMobile (maneja su propio estado de carga)
- ImportExamDialog (lógica aislada)
- Componente de página muy limpio
```

**`/subscription` (165 líneas)**
```typescript
// Buen patrón: Composición
- TierBadge (reutilizable)
- UsageIndicator (reutilizable)
- PricingCard (reutilizable)
- Usa LoadingSpinner (necesita cambio a skeleton)
```

#### ⚠️ Páginas Parcialmente Refactorizadas (Necesitan Limpieza)

**`/groups` (584 líneas - DEMASIADO LARGO)**
- ✅ Tiene: GroupCard, GroupFormModal
- ❌ Diálogo de confirmación de eliminación inline (líneas 501-582) - ¡82 líneas!
- ⚠️ Página muy larga, lógica mezclada con UI
- **Acción**: Extraer diálogo de eliminación a componente

**`/entities` (300 líneas)**
- ✅ Tiene: TitleCardWithDepth
- ❌ Diálogo de formulario completamente inline (líneas 181-235)
- ❌ Tabla inline (líneas 277-293)
- **Acción**: Extraer formulario y tabla a componentes

#### ❌ Páginas No Refactorizadas (URGENTE)

**`/students` (659 líneas - PÁGINA MÁS LARGA) 🚨 CRÍTICO**
- ❌ Formulario completo inline (líneas 514-625)
- ❌ Tabla completa inline (líneas 423-464)
- ❌ Diálogo de detalles inline (líneas 466-495)
- ❌ Función de renderizado inline (367-498)
- 🚨 **Más complejo, necesita refactorización completa**

**`/settings` (229 líneas)**
- ❌ Formulario completo inline (líneas 111-227)
- ❌ Sin componentes separados
- ⚠️ Sin estado de carga visible en UI
- **Acción**: Extraer formulario de perfil, sección de contraseña, sección de notificaciones

---

## Arquitectura Objetivo

### Estructura Estándar de Página

Basándonos en las páginas bien refactorizadas, establecemos esta estructura estándar:

```typescript
// app/[locale]/dashboard/[section]/page.tsx
"use client";

import { PageComponents } from "./components/[ComponentName]";

export default function SectionPage() {
  // 1. Hooks (traducciones, router, hooks personalizados)
  const t = useTranslations('dashboard.section');
  const [data, setData] = useState<Type[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. Lógica de obtención de datos (useCallback)
  const fetchData = useCallback(async () => {
    // Lógica de fetch
  }, [dependencies]);

  // 3. Effect hooks
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 4. Manejadores de eventos
  const handleAction = () => {
    // Lógica del manejador
  };

  // 5. Retornos tempranos (carga, errores)
  if (loading) {
    return <PageSkeleton />;
  }

  // 6. Renderizado principal (UI mínima, delegar a componentes)
  return (
    <div className="space-y-6">
      <TitleCardWithDepth
        title={t('title')}
        description={t('description')}
        actions={<ActionButtons />}
      />
      <MainContent data={data} onAction={handleAction} />
    </div>
  );
}
```

### Organización de Componentes

```
app/[locale]/dashboard/[section]/
├── page.tsx                    # Página principal (100-200 líneas máx)
├── components/
│   ├── [Section]Card.tsx       # Tarjeta de visualización
│   ├── [Section]FormModal.tsx  # Diálogo de formulario
│   ├── [Section]Table.tsx      # Tabla de datos
│   ├── [Section]Skeleton.tsx   # Skeleton de carga
│   └── index.ts                # Barrel export
```

### Patrón de Skeleton

Cada sección debe tener un skeleton dedicado que imite la estructura real:

```typescript
// components/[Section]Skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function SectionPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Skeleton del título */}
      <Skeleton className="h-10 w-64" />

      {/* Skeleton del contenido - imita la estructura real */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## Plan de Implementación

### Fase 1: Refactorización de Páginas Legacy

**Objetivo**: Llevar todas las páginas del dashboard al mismo estándar arquitectónico.

#### Prioridad 1: `/students` (Crítico - Más Complejo)

**Problemas Actuales**:
- 659 líneas (página más larga)
- Renderizado de tabla complejo inline
- Formulario completamente inline
- Diálogo de detalles inline
- Múltiples responsabilidades mezcladas

**Pasos de Refactorización**:
1. Crear directorio `components/students/`
2. Extraer componentes:
   - `StudentFormModal.tsx` (diálogo de formulario con validación)
   - `StudentsTable.tsx` (tabla con búsqueda y acciones)
   - `StudentDetailsDialog.tsx` (visualización de detalles)
   - `EmptyStudentsState.tsx` (estado vacío con CTAs)
3. Mover lógica de negocio a hooks personalizados:
   - `useStudents.ts` (fetch, crear, vincular a grupo)
4. Simplificar página principal a ~150-200 líneas

**Esfuerzo Estimado**: 3-4 horas

---

#### Prioridad 2: `/settings`

**Problemas Actuales**:
- 229 líneas
- Formulario completo inline
- Sin separación de componentes
- Sin estado de carga visible

**Pasos de Refactorización**:
1. Crear directorio `components/settings/`
2. Extraer componentes:
   - `ProfileForm.tsx` (formulario de edición de perfil)
   - `PasswordSection.tsx` (sección de cambio de contraseña)
   - `NotificationsSection.tsx` (preferencias de notificaciones)
3. Agregar skeleton de carga para fetch de perfil
4. Simplificar página principal a ~80-100 líneas

**Esfuerzo Estimado**: 2-3 horas

---

#### Prioridad 3: `/entities`

**Problemas Actuales**:
- 300 líneas
- Diálogo de formulario inline
- Tabla inline
- Responsabilidades mezcladas

**Pasos de Refactorización**:
1. Crear directorio `components/entities/`
2. Extraer componentes:
   - `EntityFormModal.tsx` (formulario crear/editar)
   - `EntitiesTable.tsx` (visualización de tabla)
   - `EmptyEntitiesState.tsx` (estado vacío)
3. Simplificar página principal a ~150 líneas

**Esfuerzo Estimado**: 2 horas

---

#### Prioridad 4: `/groups` (Limpieza)

**Problemas Actuales**:
- 584 líneas (demasiado largo)
- Diálogo de confirmación de eliminación inline (¡82 líneas!)
- Lógica mezclada con UI

**Pasos de Refactorización**:
1. Extraer `DeleteGroupDialog.tsx` del código inline
2. Considerar extraer lógica de gestión de grupos a hook personalizado
3. Reducir página a ~300-350 líneas

**Esfuerzo Estimado**: 1.5 horas

---

### Fase 2: Implementación de Skeletons

**Objetivo**: Reemplazar todos los spinners de carga con estados skeleton detallados.

#### Paso 1: Crear Biblioteca de Skeletons

Crear componentes skeleton reutilizables en `components/shared/skeletons/`:

```
components/shared/skeletons/
├── page-header-skeleton.tsx    # Título + descripción + acciones
├── card-skeleton.tsx            # Skeleton de tarjeta genérica
├── table-skeleton.tsx           # Skeleton de tabla con filas
├── stats-card-skeleton.tsx      # Tarjetas de estadísticas (ya bueno en dashboard)
├── form-skeleton.tsx            # Skeleton de campos de formulario
└── index.ts                     # Barrel export
```

**Esfuerzo Estimado**: 1.5 horas

---

#### Paso 2: Implementar Skeletons Específicos por Página

Para cada página del dashboard, crear un skeleton dedicado:

**`/subjects`** - Reemplazar spinner (líneas 222-225)
```typescript
// components/subjects/SubjectsPageSkeleton.tsx
export function SubjectsPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
```

**`/exams`** - Ya delegado a hijo (verificar que hijo tenga skeleton)

**`/subscription`** - Reemplazar LoadingSpinner (línea 26)
```typescript
// components/subscription/SubscriptionPageSkeleton.tsx
export function SubscriptionPageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
```

**`/groups`** - Reemplazar spinner (líneas 467-470)
```typescript
// Estructura similar a subjects
```

**`/entities`** - Reemplazar spinner (líneas 267-270)
```typescript
// components/entities/EntitiesPageSkeleton.tsx
export function EntitiesPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-10 w-full max-w-sm" />
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={5} />
        </CardContent>
      </Card>
    </div>
  );
}
```

**`/students`** - Reemplazar spinner (líneas 368-374)
```typescript
// components/students/StudentsPageSkeleton.tsx
// Similar a entities (basado en tabla)
```

**`/settings`** - Agregar skeleton (actualmente sin estado de carga)
```typescript
// components/settings/SettingsPageSkeleton.tsx
export function SettingsPageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-4 w-full max-w-md" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent>
          <FormSkeleton fields={5} />
        </CardContent>
      </Card>
    </div>
  );
}
```

**Esfuerzo Estimado por página**: 20-30 minutos
**Total para 7 páginas**: 2.5-3.5 horas

---

#### Paso 3: Actualizar Importaciones Dinámicas

Reemplazar `LoadingSpinner` en importaciones dinámicas con skeletons específicos:

**Ejemplo** (`/exams/[id]/results/page.tsx` líneas 24-37):
```typescript
// Antes
const QuestionAnalysisCard = dynamic(
  () => import('...'),
  { loading: () => <LoadingSpinner message="Loading..." /> }
);

// Después
const QuestionAnalysisCard = dynamic(
  () => import('...'),
  { loading: () => <QuestionAnalysisSkeleton /> }
);
```

**Esfuerzo Estimado**: 1 hora

---

### Fase 3: Pruebas y Validación

**Checklist**:
- [ ] Todas las páginas usan estructura de componentes consistente
- [ ] Ninguna página excede 300 líneas (excepto complejas con justificación)
- [ ] Todos los componentes están en directorios `components/[section]/`
- [ ] Todos los estados de carga usan skeletons (sin spinners)
- [ ] Los skeletons imitan con precisión la estructura del contenido real
- [ ] Sin regresiones en funcionalidad
- [ ] Responsive móvil (probar skeletons en pantallas pequeñas)
- [ ] Compatible con modo oscuro (probar skeletons en modo oscuro)

**Esfuerzo Estimado**: 2 horas

---

## Cronograma y Estimación de Esfuerzo

### Fase 1: Refactorización (8.5-10.5 horas)
- Refactorización de `/students`: 3-4 horas
- Refactorización de `/settings`: 2-3 horas
- Refactorización de `/entities`: 2 horas
- Limpieza de `/groups`: 1.5 horas

### Fase 2: Skeletons (5-6 horas)
- Biblioteca de skeletons: 1.5 horas
- Skeletons específicos por página: 2.5-3.5 horas
- Actualización de importaciones dinámicas: 1 hora

### Fase 3: Pruebas (2 horas)
- Pruebas manuales
- Validación responsive y modo oscuro
- Pruebas de regresión

**Esfuerzo Total Estimado**: 15.5-18.5 horas (~2-3 días)

---

## Beneficios

### Calidad del Código
- ✅ Arquitectura consistente en todas las páginas del dashboard
- ✅ Complejidad de página reducida (de 659 a ~200 líneas máx)
- ✅ Mejor separación de responsabilidades
- ✅ Más fácil de mantener y extender

### Experiencia del Usuario
- ✅ Estados de carga skeleton profesionales (estándar de la industria)
- ✅ Mejor percepción del rendimiento
- ✅ Indicación clara de la estructura del contenido mientras carga
- ✅ Sin transiciones bruscas de spinner

### Experiencia del Desarrollador
- ✅ Más fácil entender la estructura de la página
- ✅ Componentes reutilizables para futuras funcionalidades
- ✅ Patrones estándar para nuevas páginas
- ✅ Carga cognitiva reducida al navegar el código

---

## Mitigación de Riesgos

### Riesgos Potenciales

1. **Romper funcionalidad existente durante la refactorización**
   - Mitigación: Pruebas exhaustivas después de cada refactorización de página
   - Probar flujos de usuario: crear, editar, eliminar, ver

2. **Skeleton no coincide con estructura de contenido real**
   - Mitigación: Comparación lado a lado durante el desarrollo
   - Usar datos reales para diseño de skeleton

3. **Regresión de rendimiento por lazy loading**
   - Mitigación: Medir tamaño de bundle antes/después
   - Usar importaciones dinámicas de Next.js estratégicamente

4. **Aumento del tamaño inicial del bundle**
   - Mitigación: Mantener componentes skeleton pequeños
   - Usar clases de Tailwind (sin CSS adicional)

---

## Criterios de Éxito

### Debe Tener
- [ ] Todas las 7 páginas del dashboard refactorizadas a estructura estándar
- [ ] Todos los estados de carga reemplazados con skeletons
- [ ] Sin regresiones de funcionalidad
- [ ] Revisión de código aprobada

### Debería Tener
- [ ] Ninguna página excede 300 líneas
- [ ] Todos los skeletons probados en modo oscuro
- [ ] Skeletons responsive móvil
- [ ] Documentación actualizada

### Sería Bueno Tener
- [ ] Historias de Storybook para skeletons
- [ ] Benchmarks de rendimiento (antes/después)
- [ ] Comparaciones de capturas de pantalla (spinner vs skeleton)

---

## Próximos Pasos

1. Crear feature branch: `feature/dashboard-refactoring-and-skeletons`
2. Comenzar con Fase 1 (Refactorización)
3. Completar cada página en orden de prioridad
4. Probar después de completar cada página
5. Pasar a Fase 2 (Skeletons)
6. Pruebas finales y validación
7. Merge a main

---

## Referencias

- [Mejores Prácticas de Skeleton UI](https://uxdesign.cc/what-you-should-know-about-skeleton-screens-a820c45a571a)
- [Componente Skeleton de Shadcn/UI](https://ui.shadcn.com/docs/components/skeleton)
- [Importaciones Dinámicas de Next.js](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)

---

**Versión del Documento**: 1.0
**Última Actualización**: 2025-11-06
**Estado**: Listo para Implementación
