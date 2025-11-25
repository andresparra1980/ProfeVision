# Plan: Admin Dashboard para ProfeVision

## Resumen

Dashboard de administrador para observabilidad global de la plataforma, accesible solo para usuarios con `subscription_tier = 'admin'`.

---

## Decisiones de Diseño

### Ubicación: `/dashboard/admin/` (dentro del dashboard existente)

**Razón**: Reutiliza layout existente (sidebar, header, auth), menor duplicación de código, admin puede alternar entre vistas.

### Verificación Admin

```
Middleware (session) → Dashboard Layout (user) → Admin Layout (tier check) → Admin Pages
```

---

## Archivos a Crear

### 1. Páginas Admin
```
app/[locale]/dashboard/admin/
├── layout.tsx          # Verificación de tier 'admin', redirect si no es admin
├── page.tsx            # Dashboard principal con stats globales
└── users/
    └── page.tsx        # Tabla de usuarios con filtros
```

### 2. APIs Admin
```
app/api/admin/
├── stats/route.ts      # GET: estadísticas globales
└── users/route.ts      # GET: lista de usuarios con paginación
```

### 3. Componentes Admin
```
components/admin/
├── admin-stats-overview.tsx      # Cards con stats globales
├── admin-users-table.tsx         # Tabla paginada de usuarios
└── admin-tier-distribution.tsx   # Distribución por tier
```

### 4. Hooks y Servicios
```
lib/hooks/use-admin-stats.ts      # Hook para fetch de stats admin
lib/services/admin-service.ts     # Verificación y queries admin
```

### 5. i18n
```
i18n/locales/es/admin.json
i18n/locales/en/admin.json
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `components/dashboard/dashboard-sidebar.tsx` | Link condicional a Admin (solo si tier='admin') |
| `app/[locale]/dashboard/layout.tsx` | Obtener y pasar `subscription_tier` al sidebar |
| `lib/services/tier-service.ts` | Agregar método `isAdmin()` |

---

## APIs

### GET `/api/admin/stats`

```typescript
{
  users: {
    total: number;
    new_this_month: number;
    by_tier: { free: number; plus: number; admin: number; grandfathered: number; }
  };
  exams: { total: number; created_this_month: number; with_results: number; };
  scans: { total: number; this_month: number; };
  institutions: { total: number; };
  groups: { total: number; active: number; };
  students: { total: number; };
  ai_jobs: { total: number; completed: number; failed: number; };
  trends: {
    users_by_month: Array<{ month: string; count: number; }>;
    exams_by_month: Array<{ month: string; count: number; }>;
    scans_by_month: Array<{ month: string; count: number; }>;
  }
}
```

### GET `/api/admin/users`

Query: `page`, `limit`, `search`, `tier`

```typescript
{
  users: Array<{
    id, email, nombres, apellidos, subscription_tier, created_at,
    stats: { entities, subjects, groups, exams, scans }
  }>;
  pagination: { page, limit, total, pages }
}
```

---

## SQL para Hacer Admin Manualmente

```sql
-- Hacer admin por email
UPDATE profesores p
SET subscription_tier = 'admin'
FROM auth.users u
WHERE p.id = u.id AND u.email = 'TU_EMAIL@example.com';

-- Verificar
SELECT u.email, p.subscription_tier
FROM profesores p
JOIN auth.users u ON p.id = u.id
WHERE p.subscription_tier = 'admin';
```

---

## Decisiones del Usuario

- **Acciones**: Solo observabilidad (cambios de tier via Supabase dashboard)
- **Gráficos**: Con tendencias temporales (usuarios nuevos, exámenes, escaneos por período)
- **Exportación**: No necesaria

---

## Dependencias a agregar

```bash
yarn add recharts
```

---

## Secuencia de Implementación

1. **Fase 1: Base** - isAdmin() en tier-service + APIs admin
2. **Fase 2: UI** - Layout admin + página principal + componentes + i18n
3. **Fase 3: Integración** - Link admin en sidebar + página usuarios
