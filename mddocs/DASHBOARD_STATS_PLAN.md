# Plan: Dashboard Estadísticas del Profesor

## Objetivo

Mostrar estadísticas en tiempo real del profesor en `/dashboard` con:
- Cantidad de Instituciones
- Cantidad de Materias
- Cantidad de Grupos (Activos/Inactivos en una sola card)
- Cantidad de Estudiantes en sus cursos
- Últimos 10 exámenes creados con opción de editar/ver resultados
- Conteo de exámenes calificados + tiempo ahorrado

---

## Arquitectura

### Flow de Datos
```
Dashboard Page (Client)
    ↓ useDashboardStats hook
API Route /api/dashboard/stats
    ↓ Supabase queries (paralelas)
PostgreSQL (Supabase)
```

---

## 1. API Endpoint

**Archivo**: `app/api/dashboard/stats/route.ts`

### Autenticación
- Obtener usuario del header Authorization
- Verificar sesión con Supabase Auth
- Obtener `profesor_id` del usuario autenticado

### Queries (Ejecutar en paralelo con Promise.all)

#### 1.1 Total Instituciones
```typescript
const { count: totalInstituciones } = await supabase
  .from('entidades_educativas')
  .select('*', { count: 'exact', head: true })
  .eq('profesor_id', profesorId);
```

#### 1.2 Total Materias
```typescript
const { count: totalMaterias } = await supabase
  .from('materias')
  .select('*', { count: 'exact', head: true })
  .eq('profesor_id', profesorId);
```

#### 1.3 Grupos por Estado
```typescript
const { data: gruposData } = await supabase
  .from('grupos')
  .select('estado')
  .eq('profesor_id', profesorId);

const gruposActivos = gruposData?.filter(g => g.estado === 'activo').length ?? 0;
const gruposArchivados = gruposData?.filter(g => g.estado === 'archivado').length ?? 0;
```

#### 1.4 Total Estudiantes Únicos
```typescript
const { data: estudiantesData } = await supabase
  .from('estudiante_grupo')
  .select('estudiante_id, grupos!inner(profesor_id)')
  .eq('grupos.profesor_id', profesorId);

const totalEstudiantes = new Set(
  estudiantesData?.map(e => e.estudiante_id) || []
).size;
```

#### 1.5 Últimos 10 Exámenes
```typescript
const { data: examenesRecientes } = await supabase
  .from('examenes')
  .select('id, titulo, estado, fecha_creacion, materias(nombre)')
  .eq('profesor_id', profesorId)
  .order('fecha_creacion', { ascending: false })
  .limit(10);
```

#### 1.6 Exámenes Calificados (Escaneados)
```typescript
const { count: examenesCalificados } = await supabase
  .from('examenes_escaneados')
  .select('*', { count: 'exact', head: true })
  .eq('profesor_id', profesorId);
```

### Response Schema
```typescript
{
  totalInstituciones: number;
  totalMaterias: number;
  gruposActivos: number;
  gruposArchivados: number;
  totalEstudiantes: number;
  examenesRecientes: Array<{
    id: string;
    titulo: string;
    estado: string;
    fecha_creacion: string;
    materia_nombre: string | null;
  }>;
  examenesCalificados: number;
  tiempoAhorradoSegundos: number; // examenesCalificados * 295
}
```

### Performance
- Cache: `export const revalidate = 300;` (5 minutos)
- Tiempo estimado: 300-500ms
- Índices existentes suficientes

---

## 2. Custom Hook

**Archivo**: `lib/hooks/use-dashboard-stats.ts`

```typescript
export interface DashboardStats {
  totalInstituciones: number;
  totalMaterias: number;
  gruposActivos: number;
  gruposArchivados: number;
  totalEstudiantes: number;
  examenesRecientes: Array<{
    id: string;
    titulo: string;
    estado: string;
    fecha_creacion: string;
    materia_nombre: string | null;
  }>;
  examenesCalificados: number;
  tiempoAhorradoSegundos: number;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Fetch de /api/dashboard/stats
    // Manejo de 401 → redirect a /auth/login
  }, []);

  return { stats, loading, error, refetch };
}
```

---

## 3. Componentes UI

### 3.1 StatsOverview
**Archivo**: `components/dashboard/stats-overview.tsx`

Grid responsive con 8 cards:
1. **Instituciones** - Icon: Building2 - Color: blue
2. **Materias** - Icon: BookOpen - Color: purple
3. **Grupos Activos** - Icon: Users - Color: green (mostrar activos/archivados)
4. **Estudiantes** - Icon: UsersRound - Color: orange

**Layout**: `grid gap-4 md:grid-cols-2 lg:grid-cols-4`

### 3.2 RecentExamsList
**Archivo**: `components/dashboard/recent-exams-list.tsx`

Card con:
- Título: "Exámenes Recientes"
- Lista de últimos 10 exámenes
- Cada item muestra:
  - Nombre del examen
  - Materia
  - Fecha (formato relativo: "hace 2 días")
  - Badge de estado (borrador/publicado/archivado)
  - Botones: Editar, Ver Resultados

**Navegación**:
- Editar: `/[locale]/dashboard/exams/[id]/edit`
- Resultados: `/[locale]/dashboard/exams/[id]/results`

### 3.3 GradingStats
**Archivo**: `components/dashboard/grading-stats.tsx`

Card con 2 métricas grandes:
1. **Exámenes Calificados**: Total de `examenes_escaneados`
2. **Tiempo Ahorrado**: Calculado como `count × 295 segundos`

**Formato de Tiempo**:
```typescript
function formatTimeSaved(seconds: number): string {
  if (seconds < 3600) {
    // Menos de 1 hora
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  } else if (seconds < 86400) {
    // Menos de 1 día
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  } else {
    // 1 día o más
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  }
}
```

**Contexto Visual**:
- Mostrar "(5 min → 5s por examen)" como tooltip o texto secundario

---

## 4. Actualizar Dashboard Page

**Archivo**: `app/[locale]/dashboard/page.tsx`

### Cambios:
1. **Eliminar** `<DevelopmentOverlay>` de la sección de métricas
2. **Importar** nuevos componentes
3. **Actualizar** layout

### Nuevo Layout:
```tsx
<div className="space-y-6">
  {/* Título */}
  <TitleCardWithDepth
    title={t('main.title')}
    description={t('main.welcome')}
  />

  {/* Estadísticas Generales */}
  <StatsOverview />

  {/* Grid de 2 columnas */}
  <div className="grid gap-4 md:grid-cols-2">
    {/* Exámenes Recientes */}
    <RecentExamsList />

    {/* Stats de Calificación */}
    <GradingStats />
  </div>

  {/* Actividad Reciente y Próximos Exámenes - Mantener con DevelopmentOverlay por ahora */}
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
    <DevelopmentOverlay className="lg:col-span-4">
      {/* ... Actividad ... */}
    </DevelopmentOverlay>
    <DevelopmentOverlay className="lg:col-span-3">
      {/* ... Próximos ... */}
    </DevelopmentOverlay>
  </div>
</div>
```

---

## 5. Traducciones i18n

### 5.1 Español
**Archivo**: `i18n/locales/es/dashboard.json`

Agregar en `main`:
```json
{
  "main": {
    "stats": {
      "totalInstitutions": "Instituciones",
      "totalSubjects": "Materias",
      "activeGroups": "Grupos Activos",
      "archivedGroups": "Grupos Archivados",
      "totalStudents": "Estudiantes",
      "recentExams": "Exámenes Recientes",
      "gradedExams": "Exámenes Calificados",
      "timeSaved": "Tiempo Ahorrado",
      "timeSavedContext": "Sin ProfeVision: 5 min/examen • Con ProfeVision: 5 s/examen",
      "noExams": "No hay exámenes recientes",
      "examStatus": {
        "borrador": "Borrador",
        "publicado": "Publicado",
        "archivado": "Archivado"
      },
      "actions": {
        "edit": "Editar",
        "viewResults": "Ver Resultados"
      },
      "timeFormats": {
        "minutes": "{{count}} min",
        "hours": "{{hours}}h {{minutes}}min",
        "days": "{{days}}d {{hours}}h"
      }
    }
  }
}
```

### 5.2 Inglés
**Archivo**: `i18n/locales/en/dashboard.json`

```json
{
  "main": {
    "stats": {
      "totalInstitutions": "Institutions",
      "totalSubjects": "Subjects",
      "activeGroups": "Active Groups",
      "archivedGroups": "Archived Groups",
      "totalStudents": "Students",
      "recentExams": "Recent Exams",
      "gradedExams": "Graded Exams",
      "timeSaved": "Time Saved",
      "timeSavedContext": "Without ProfeVision: 5 min/exam • With ProfeVision: 5 s/exam",
      "noExams": "No recent exams",
      "examStatus": {
        "borrador": "Draft",
        "publicado": "Published",
        "archivado": "Archived"
      },
      "actions": {
        "edit": "Edit",
        "viewResults": "View Results"
      },
      "timeFormats": {
        "minutes": "{{count}} min",
        "hours": "{{hours}}h {{minutes}}min",
        "days": "{{days}}d {{hours}}h"
      }
    }
  }
}
```

---

## 6. Orden de Implementación

1. ✅ Crear API endpoint `/api/dashboard/stats/route.ts`
2. ✅ Crear custom hook `use-dashboard-stats.ts`
3. ✅ Crear componente `StatsOverview`
4. ✅ Crear componente `RecentExamsList`
5. ✅ Crear componente `GradingStats`
6. ✅ Actualizar página dashboard
7. ✅ Agregar traducciones (es/en)
8. ✅ Testing manual

---

## 7. Testing Checklist

### Funcional
- [ ] API endpoint responde correctamente con usuario autenticado
- [ ] API endpoint retorna 401 sin autenticación
- [ ] Todas las estadísticas muestran datos correctos vs DB
- [ ] Grupos activos/archivados se cuentan correctamente
- [ ] Estudiantes únicos se calculan bien (sin duplicados)
- [ ] Últimos 10 exámenes ordenados por fecha descendente
- [ ] Links de editar/resultados navegan correctamente
- [ ] Tiempo ahorrado se calcula y formatea bien

### UI/UX
- [ ] Loading states funcionan en todos los componentes
- [ ] Error handling muestra mensajes apropiados
- [ ] Skeleton loaders se ven bien
- [ ] Cards responsive en mobile/tablet/desktop
- [ ] Iconos y colores consistentes
- [ ] Badges de estado se ven correctos

### i18n
- [ ] Traducciones español funcionan
- [ ] Traducciones inglés funcionan
- [ ] Fechas relativas en idioma correcto
- [ ] Formatos de tiempo en idioma correcto

### Performance
- [ ] API responde en < 500ms
- [ ] Cache de 5 minutos funciona
- [ ] No hay N+1 queries
- [ ] Queries en paralelo funcionan

---

## 8. Notas Técnicas

### Estados de Examen
Según schema DB: `borrador`, `publicado`, (probablemente `archivado`)

### Estados de Grupo
Según schema DB: `activo`, `archivado`

### Tabla examenes_escaneados
- Contiene `profesor_id` directamente
- Cada registro = 1 examen escaneado
- Usar para contar exámenes calificados con la plataforma

### Tiempo de Grading
- Sin ProfeVision: 5 minutos (300 segundos) por examen
- Con ProfeVision: 5 segundos por examen
- Ahorro: 295 segundos por examen
- Fórmula: `total_examenes_escaneados × 295 segundos`

---

## 9. Consideraciones Futuras

### Filtros por Periodo
- Agregar dropdown para filtrar por año escolar
- Permitir ver stats de periodos anteriores

### Más Métricas
- Promedio de calificaciones de sus estudiantes
- Distribución de estados de exámenes
- Gráficas de tendencias temporales

### Exportación
- Botón para exportar estadísticas a PDF/Excel
- Incluir gráficos y tablas

### Realtime Updates
- Usar Supabase Realtime para actualizar stats sin refrescar
- Notificar cuando se completa un escaneo

---

**Fecha de Creación**: 2025-10-28
**Autor**: Claude Code
**Status**: ✅ Plan Aprobado - Listo para Implementación
