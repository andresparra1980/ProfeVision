# Plan de Internacionalización del Dashboard - ProfeVision

## 📊 Estado Actual del Dashboard

**Fecha de Creación:** 2 de enero de 2025  
**Prioridad:** ALTA - El dashboard es el core de la aplicación SaaS

### 🔍 Análisis de la Estructura Actual

```
app/dashboard/
├── page.tsx                    ← Dashboard principal con métricas
├── layout.tsx                  ← Layout del dashboard + sidebar
├── exams/                      ← Gestión de exámenes
│   ├── page.tsx               ← Lista de exámenes
│   ├── create/                ← Creación de exámenes
│   ├── create-with-ai/        ← Creación con IA
│   ├── components/            ← Componentes específicos
│   └── [id]/                  ← Detalles del examen
│       ├── page.tsx           ← Vista principal
│       ├── edit/              ← Edición
│       ├── assign/            ← Asignación
│       ├── responses/         ← Respuestas
│       ├── results/           ← Resultados
│       └── export/            ← Exportación
├── students/                   ← Gestión de estudiantes
│   └── page.tsx               ← Lista y CRUD de estudiantes
├── groups/                     ← Gestión de grupos
│   ├── page.tsx               ← Lista de grupos
│   └── [id]/                  ← Detalles del grupo
│       ├── students/          ← Estudiantes del grupo
│       ├── grades/            ← Calificaciones
│       └── grading-scheme/    ← Esquema de calificación
├── subjects/                   ← Gestión de materias
│   ├── page.tsx               ← Lista de materias
│   └── components/            ← Componentes específicos
├── reports/                    ← Reportes y análisis
│   └── page.tsx               ← Dashboard de reportes
├── settings/                   ← Configuración
│   └── page.tsx               ← Configuración del usuario
└── profile/                    ← Perfil del usuario
    └── page.tsx               ← Perfil y configuración
```

### 🎯 Elementos que Necesitan Traducción

#### 1. **Interfaz de Usuario (UI)**
- ✅ Títulos y encabezados
- ✅ Botones y acciones
- ✅ Labels de formularios
- ✅ Mensajes de validación
- ✅ Tooltips y ayuda contextual
- ✅ Placeholders de inputs
- ✅ Mensajes de estado (loading, error, success)

#### 2. **Navegación y Estructura**
- ✅ Sidebar navigation
- ✅ Breadcrumbs
- ✅ Tabs y pestañas
- ✅ Headers de páginas
- ✅ Menús contextuales

#### 3. **Funcionalidades Específicas**
- ✅ Creación de exámenes
- ✅ Gestión de estudiantes
- ✅ Calificaciones y reportes
- ✅ Configuración del sistema
- ✅ Notificaciones y alertas

---

## 🚀 Plan de Migración por Fases

### **Fase 1: Configuración Base (Estimado: 2-3 días)**

#### 1.1 Configuración de Routing
```typescript
// i18n/routing.ts - Expandir configuración
export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  pathnames: {
    // Dashboard rutas principales
    '/dashboard': '/dashboard',
    '/dashboard/exams': { 
      es: '/dashboard/examenes', 
      en: '/dashboard/exams' 
    },
    '/dashboard/exams/create': { 
      es: '/dashboard/examenes/crear', 
      en: '/dashboard/exams/create' 
    },
    '/dashboard/exams/create-with-ai': { 
      es: '/dashboard/examenes/crear-con-ia', 
      en: '/dashboard/exams/create-with-ai' 
    },
    '/dashboard/students': { 
      es: '/dashboard/estudiantes', 
      en: '/dashboard/students' 
    },
    '/dashboard/groups': { 
      es: '/dashboard/grupos', 
      en: '/dashboard/groups' 
    },
    '/dashboard/subjects': { 
      es: '/dashboard/materias', 
      en: '/dashboard/subjects' 
    },
    '/dashboard/reports': { 
      es: '/dashboard/reportes', 
      en: '/dashboard/reports' 
    },
    '/dashboard/settings': { 
      es: '/dashboard/configuracion', 
      en: '/dashboard/settings' 
    },
    '/dashboard/profile': { 
      es: '/dashboard/perfil', 
      en: '/dashboard/profile' 
    }
  }
});
```

#### 1.2 Migración de Estructura
```bash
# Crear nueva estructura
mkdir -p app/[locale]/dashboard
cp -r app/dashboard/* app/[locale]/dashboard/
```

#### 1.3 Archivos de Traducción
```typescript
// i18n/locales/es/dashboard.json
{
  "navigation": {
    "dashboard": "Dashboard",
    "exams": "Exámenes",
    "students": "Estudiantes",
    "groups": "Grupos",
    "subjects": "Materias",
    "reports": "Reportes",
    "settings": "Configuración",
    "profile": "Perfil"
  },
  "common": {
    "create": "Crear",
    "edit": "Editar",
    "delete": "Eliminar",
    "save": "Guardar",
    "cancel": "Cancelar",
    "confirm": "Confirmar",
    "loading": "Cargando...",
    "error": "Error",
    "success": "Éxito"
  }
}
```

### **Fase 2: Dashboard Principal (Estimado: 1-2 días)**

#### 2.1 Actualizar Dashboard Principal
```typescript
// app/[locale]/dashboard/page.tsx
'use client';

import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations('dashboard');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('main.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('main.welcome')}
        </p>
      </div>
      {/* ... resto del componente */}
    </div>
  );
}
```

#### 2.2 Traducir Métricas y Cards
```json
// dashboard.json - Sección main
{
  "main": {
    "title": "Dashboard",
    "welcome": "Bienvenido a ProfeVision, tu plataforma de gestión de exámenes.",
    "metrics": {
      "examsCreated": "Exámenes creados",
      "studentsEvaluated": "Estudiantes evaluados",
      "averageScore": "Promedio general",
      "completionRate": "Tasa de finalización"
    }
  }
}
```

### **Fase 3: Gestión de Exámenes (Estimado: 4-5 días)**

#### 3.1 Lista de Exámenes
```typescript
// app/[locale]/dashboard/exams/page.tsx
'use client';

import { useTranslations } from 'next-intl';

export default function ExamsPage() {
  const t = useTranslations('dashboard.exams');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <div className="flex gap-2">
          <Button>{t('actions.create')}</Button>
          <Button variant="outline">{t('actions.createWithAI')}</Button>
        </div>
      </div>
      {/* ... resto del componente */}
    </div>
  );
}
```

#### 3.2 Traducir Formularios de Exámenes
```json
// dashboard.json - Sección exams
{
  "exams": {
    "title": "Exámenes",
    "create": "Crear Examen",
    "createWithAI": "Crear con IA",
    "edit": "Editar Examen",
    "form": {
      "title": "Título del examen",
      "description": "Descripción",
      "subject": "Materia",
      "group": "Grupo",
      "duration": "Duración (minutos)",
      "totalScore": "Puntaje total"
    },
    "table": {
      "name": "Nombre",
      "subject": "Materia",
      "group": "Grupo",
      "students": "Estudiantes",
      "createdAt": "Creado",
      "actions": "Acciones"
    }
  }
}
```

### **Fase 4: Gestión de Estudiantes (Estimado: 3-4 días)**

#### 4.1 Lista y CRUD de Estudiantes
```typescript
// app/[locale]/dashboard/students/page.tsx
'use client';

import { useTranslations } from 'next-intl';

export default function StudentsPage() {
  const t = useTranslations('dashboard.students');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <Button>{t('actions.add')}</Button>
      </div>
      {/* ... resto del componente */}
    </div>
  );
}
```

#### 4.2 Traducir Formularios de Estudiantes
```json
// dashboard.json - Sección students
{
  "students": {
    "title": "Estudiantes",
    "add": "Agregar Estudiante",
    "edit": "Editar Estudiante",
    "form": {
      "firstName": "Nombres",
      "lastName": "Apellidos",
      "identification": "Identificación",
      "email": "Email",
      "group": "Grupo"
    },
    "table": {
      "name": "Nombre",
      "identification": "Identificación",
      "email": "Email",
      "group": "Grupo",
      "createdAt": "Creado",
      "actions": "Acciones"
    }
  }
}
```

### **Fase 5: Grupos y Materias (Estimado: 2-3 días)**

#### 5.1 Gestión de Grupos
```json
// dashboard.json - Sección groups
{
  "groups": {
    "title": "Grupos",
    "create": "Crear Grupo",
    "edit": "Editar Grupo",
    "form": {
      "name": "Nombre del grupo",
      "subject": "Materia",
      "description": "Descripción",
      "semester": "Semestre",
      "year": "Año"
    },
    "details": {
      "students": "Estudiantes",
      "grades": "Calificaciones",
      "gradingScheme": "Esquema de Calificación"
    }
  }
}
```

#### 5.2 Gestión de Materias
```json
// dashboard.json - Sección subjects
{
  "subjects": {
    "title": "Materias",
    "create": "Crear Materia",
    "edit": "Editar Materia",
    "form": {
      "name": "Nombre de la materia",
      "code": "Código",
      "description": "Descripción",
      "credits": "Créditos"
    }
  }
}
```

### **Fase 6: Reportes y Análisis (Estimado: 3-4 días)**

#### 6.1 Dashboard de Reportes
```json
// dashboard.json - Sección reports
{
  "reports": {
    "title": "Reportes",
    "overview": "Resumen General",
    "performance": "Rendimiento",
    "analytics": "Análisis",
    "export": "Exportar",
    "filters": {
      "period": "Período",
      "subject": "Materia",
      "group": "Grupo"
    },
    "charts": {
      "scoreDistribution": "Distribución de Puntajes",
      "performanceOverTime": "Rendimiento en el Tiempo",
      "questionAnalysis": "Análisis de Preguntas"
    }
  }
}
```

### **Fase 7: Configuración y Perfil (Estimado: 2-3 días)**

#### 7.1 Configuración del Sistema
```json
// dashboard.json - Sección settings
{
  "settings": {
    "title": "Configuración",
    "account": "Cuenta",
    "preferences": "Preferencias",
    "notifications": "Notificaciones",
    "security": "Seguridad",
    "form": {
      "language": "Idioma",
      "timezone": "Zona horaria",
      "emailNotifications": "Notificaciones por email",
      "theme": "Tema"
    }
  }
}
```

#### 7.2 Perfil del Usuario
```json
// dashboard.json - Sección profile
{
  "profile": {
    "title": "Perfil",
    "personalInfo": "Información Personal",
    "professionalInfo": "Información Profesional",
    "form": {
      "firstName": "Nombre",
      "lastName": "Apellido",
      "email": "Email",
      "phone": "Teléfono",
      "institution": "Institución",
      "department": "Departamento",
      "position": "Cargo"
    }
  }
}
```

---

## 📋 Estructura de Traducciones

### **Archivos de Traducción**

```
i18n/locales/
├── es/
│   ├── common.json           ← Traducciones del website (existente)
│   ├── auth.json             ← Traducciones de autenticación (existente)
│   └── dashboard.json        ← Traducciones del dashboard (nuevo)
└── en/
    ├── common.json           ← Traducciones del website (existente)
    ├── auth.json             ← Traducciones de autenticación (existente)
    └── dashboard.json        ← Traducciones del dashboard (nuevo)
```

### **Estructura del dashboard.json**

```json
{
  "navigation": { ... },
  "common": { ... },
  "main": { ... },
  "exams": {
    "title": "...",
    "create": "...",
    "form": { ... },
    "table": { ... },
    "actions": { ... },
    "validation": { ... }
  },
  "students": { ... },
  "groups": { ... },
  "subjects": { ... },
  "reports": { ... },
  "settings": { ... },
  "profile": { ... }
}
```

---

## 🎨 Componentes a Actualizar

### **Componentes del Dashboard**

#### 1. **Layout y Navegación**
```typescript
// components/dashboard/dashboard-sidebar.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function DashboardSidebar() {
  const t = useTranslations('dashboard.navigation');

  return (
    <nav>
      <Link href="/dashboard">{t('dashboard')}</Link>
      <Link href="/dashboard/exams">{t('exams')}</Link>
      <Link href="/dashboard/students">{t('students')}</Link>
      {/* ... más links */}
    </nav>
  );
}
```

#### 2. **Componentes de Exámenes**
```typescript
// components/exam/exam-form.tsx
'use client';

import { useTranslations } from 'next-intl';

export default function ExamForm() {
  const t = useTranslations('dashboard.exams.form');

  return (
    <form>
      <Label>{t('title')}</Label>
      <Input placeholder={t('titlePlaceholder')} />
      {/* ... más campos */}
    </form>
  );
}
```

#### 3. **Tablas y Listas**
```typescript
// components/dashboard/data-table.tsx
'use client';

import { useTranslations } from 'next-intl';

export default function DataTable({ section }: { section: string }) {
  const t = useTranslations(`dashboard.${section}.table`);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('name')}</TableHead>
          <TableHead>{t('createdAt')}</TableHead>
          <TableHead>{t('actions')}</TableHead>
        </TableRow>
      </TableHeader>
      {/* ... resto de la tabla */}
    </Table>
  );
}
```

---

## 🔧 Configuración Técnica

### **Middleware Update**
```typescript
// middleware.ts - Agregar rutas del dashboard
export default createI18nMiddleware({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'as-needed'
});

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
    '/dashboard/:path*',  // Incluir rutas del dashboard
    '/([\\w-]+)?/users/(.+)'
  ]
};
```

### **Next.js Configuration**
```typescript
// next.config.ts
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración existente
};

export default withNextIntl(nextConfig);
```

---

## 📊 Estimación de Trabajo

### **Tiempo Estimado Total: 18-25 días**

| Fase | Componente | Estimado | Complejidad |
|------|------------|----------|-------------|
| 1 | Configuración Base | 2-3 días | Media |
| 2 | Dashboard Principal | 1-2 días | Baja |
| 3 | Gestión de Exámenes | 4-5 días | Alta |
| 4 | Gestión de Estudiantes | 3-4 días | Media |
| 5 | Grupos y Materias | 2-3 días | Media |
| 6 | Reportes y Análisis | 3-4 días | Alta |
| 7 | Configuración y Perfil | 2-3 días | Baja |
| 8 | Testing y Pulido | 2-3 días | Media |

### **Factores de Complejidad**
- **Alta**: Formularios complejos, validación, lógica de negocio
- **Media**: CRUD básico, tablas, navegación
- **Baja**: Páginas estáticas, configuración, textos simples

---

## 🎯 Prioridades de Implementación

### **🔴 Prioridad 1 (Crítica)**
1. **Configuración Base** - Sin esto no funciona nada
2. **Dashboard Principal** - Primera impresión del usuario
3. **Gestión de Exámenes** - Funcionalidad core del SaaS

### **🟡 Prioridad 2 (Alta)**
4. **Gestión de Estudiantes** - Funcionalidad importante
5. **Grupos y Materias** - Organización del contenido

### **🟢 Prioridad 3 (Media)**
6. **Reportes y Análisis** - Valor agregado
7. **Configuración y Perfil** - Personalización

---

## 🧪 Plan de Testing

### **Testing por Fase**
1. **Funcionalidad**: Cada componente funciona en ambos idiomas
2. **Navegación**: Links y rutas funcionan correctamente
3. **Formularios**: Validación y mensajes en idioma correcto
4. **Responsive**: UI se adapta en ambos idiomas
5. **Performance**: Carga de traducciones optimizada

### **Checklist de Testing**
- [ ] Todas las páginas cargan en ES/EN
- [ ] Navegación funciona en ambos idiomas
- [ ] Formularios validan en idioma correcto
- [ ] Mensajes de error/éxito se muestran correctamente
- [ ] Tablas y listas se formatean bien
- [ ] Fechas y números se localizan apropiadamente

---

## 📝 Notas Importantes

### **Consideraciones Especiales**
1. **Fechas y Formatos**: Usar `Intl.DateTimeFormat` para fechas
2. **Números**: Usar `Intl.NumberFormat` para números y monedas
3. **Pluralización**: Considerar reglas de plural en ambos idiomas
4. **RTL Support**: Aunque no es necesario ahora, considerar para futuro
5. **Fallbacks**: Siempre tener fallback al español si falta traducción

### **Challenges Esperados**
1. **Componentes Complejos**: Formularios con validación dinámica
2. **Estados de Carga**: Mensajes de loading/error consistentes
3. **Tablas Dinámicas**: Headers y datos que cambian dinámicamente
4. **Modales y Dialogs**: Contenido dinámico en diferentes idiomas

---

## 🚀 Próximos Pasos

### **Immediate Actions**
1. **Aprobar este plan** y ajustar si es necesario
2. **Comenzar Fase 1**: Configuración base y routing
3. **Preparar traducciones**: Crear estructura inicial de archivos JSON
4. **Setup ambiente**: Configurar herramientas de desarrollo

### **Success Metrics**
- ✅ 100% de las páginas del dashboard funcionan en ambos idiomas
- ✅ Navegación fluida entre páginas localizadas
- ✅ Formularios y validación correcta en ambos idiomas
- ✅ Performance mantenida o mejorada
- ✅ Experiencia de usuario consistente

---

*Este documento será actualizado conforme avance la implementación y se identifiquen nuevos requerimientos o challenges.* 