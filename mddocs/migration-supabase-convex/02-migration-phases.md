# Migration Phases

Fases detalladas para ejecutar la migración de Supabase a Convex + Clerk.

## Fase 1: Preparación

### Objetivo
Configurar todos los servicios y herramientas necesarios antes de empezar la migración.

### Checklist

- [ ] **Crear proyecto Convex**
  - Instalar CLI: `npm install -D convex`
  - Inicializar proyecto: `npx convex dev`
  - Obtener deployment URL y keys

- [ ] **Crear proyecto Clerk**
  - Crear cuenta en Clerk
  - Crear nuevo application
  - Configurar JWT template para Convex

- [ ] **Configurar JWT Template en Clerk**
  - Ir a Dashboard → JWT Templates
  - Crear template "Convex"
  - Configurar claims: `https://convex.dev/customClaim`, `sub`, `iat`, `exp`

- [ ] **Exportar usuarios de Supabase**
  ```bash
  # Desde Supabase dashboard o CLI
  supabase db dump --data-only -t auth.users > users.sql
  # Exportar también datos de profesores
  ```

- [ ] **Importar usuarios en Clerk**
  - Usar Clerk User Import API
  - Mapear: `id` → `external_id`, `email`, `metadata`
  - Verificar importación exitosa

### Tiempo estimado
2-3 días

---

## Fase 2: Schema Convex

### Objetivo
Definir el esquema completo de Convex en inglés, basado en DATABASE_SCHEMA.md.

### Checklist

- [ ] **Crear `convex/schema.ts`**
  - Definir todas las 25 colecciones
  - Usar nombres en inglés
  - Configurar tipos (v.string(), v.number(), v.json(), etc.)
  - Crear índices necesarios

- [ ] **Crear índices**
  ```typescript
  // Ejemplos
  teachers: defineTable({...}).index("by_token", ["tokenIdentifier"])
  exams: defineTable({...}).index("by_teacher", ["teacherId"])
  students: defineTable({...}).index("by_id_number", ["idNumber"])
  ```

- [ ] **Validar tipos con Convex CLI**
  ```bash
  npx convex dev
  npx convex typecheck
  ```

- [ ] **Crear helper `getMe()`**
  ```typescript
  // convex/utils.ts
  export const getMe = async (ctx: QueryCtx | MutationCtx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("teachers")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
  };
  ```

- [ ] **Migrar funciones SQL a Convex**
  - Sistema de tiers: Queries/Mutations
  - Onboarding: Mutation con deep merge
  - Verificar comportamiento

### Tiempo estimado
3-4 días

---

## Fase 3: Auth Integration

### Objetivo
Reemplazar Supabase Auth con Clerk en la aplicación web.

### Checklist

- [ ] **Instalar dependencias**
  ```bash
  npm install @clerk/nextjs convex
  ```

- [ ] **Configurar Clerk en Next.js**
  - Crear `middleware.ts` con ClerkMiddleware
  - Configurar `.env` variables (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY)

- [ ] **Reemplazar `SessionProvider` → `ClerkProvider`**
  ```typescript
  // app/layout.tsx
  import { ClerkProvider } from '@clerk/nextjs'
  // Eliminar Supabase AuthProvider
  ```

- [ ] **Configurar `ConvexProviderWithClerk`**
  ```typescript
  // app/providers.tsx
  import { ConvexProviderWithClerk } from 'convex/react-clerk'
  import { useAuth } from '@clerk/nextjs'

  export default function Providers({ children }) {
    return (
      <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
        {children}
      </ConvexProviderWithClerk>
    )
  }
  ```

- [ ] **Actualizar componentes de auth**
  - Login con ClerkSignInButton
  - Logout con ClerkSignOutButton
  - User info con useUser()

### Tiempo estimado
2-3 días

---

## Fase 4: Lógica de Acceso

### Objetivo
Reemplazar todas las llamadas a Supabase con Convex Queries y Mutations.

### Checklist

- [ ] **Reemplazar queries `supabase.from().select()` → `useQuery()`**
  ```typescript
  // Antes
  const { data } = await supabase.from('examenes').select('*')

  // Después
  const exams = useQuery(api.exams.getMyExams)
  ```

- [ ] **Reemplazar mutations `supabase.from().insert()` → `useMutation()`**
  ```typescript
  // Antes
  await supabase.from('examenes').insert({ titulo: '...' })

  // Después
  const createExam = useMutation(api.exams.create)
  await createExam({ title: '...' })
  ```

- [ ] **Mover validaciones RLS a lógica de funciones**
  - Cada query/mutation valida identity
  - Usar `getMe()` helper para obtener usuario

- [ ] **Crear script de migración automática de campos**
  ```typescript
  // scripts/migrate-field-names.ts
  // Buscar y reemplazar nombres de campos ES→EN
  ```

- [ ] **Actualizar tipos en `apps/web/lib/types/database.ts`**
  - Mapeo completo ES→EN
  - Usar con Convex types

- [ ] **Actualizar componentes React**
  - Reemplazar referencias a propiedades
  - Ej: `profesor.nombre` → `teacher.firstName`

- [ ] **Actualizar hooks personalizados**
  - `useExams`, `useStudents`, etc.
  - Usar `useQuery` de Convex

- [ ] **Actualizar API routes**
  - Webhooks de Polar
  - Webhooks de AI
  - Usar ConvexHttpClient

### Tiempo estimado
5-7 días

---

## Fase 5: Importación de Datos

### Objetivo
Migrar todos los datos de Supabase a Convex.

### Checklist

- [ ] **Exportar datos de Supabase (JSON/CSV)**
  ```bash
  # Usar Supabase CLI o script personalizado
  # Exportar todas las tablas
  ```

- [ ] **Transformar IDs (UUID → Convex IDs)**
  - Crear script para mantener referencias
  - Mapeo UUID → Convex ID temporal

- [ ] **Transformar nombres de campos (ES → EN)**
  ```typescript
  // Ejemplo de transformación
  const teacher = {
    _id: newId("teachers"), // Convex ID
    clerkId: original.id, // Usar UUID como clerkId
    firstName: original.nombres,
    lastName: original.apellidos,
    // ...
  }
  ```

- [ ] **Importar en Convex via CLI**
  ```bash
  npx convex import --file data.json
  ```

- [ ] **Validar integridad referencial**
  - Verificar foreign keys
  - Verificar count de registros
  - Verificar datos de testing

### Tiempo estimado
2-3 días

---

## Fase 6: Migración de Funcionalidades

### Objetivo
Migrar Edge Functions, Triggers y RPC functions a Convex.

### Checklist

- [ ] **Migrar Edge Functions a Actions**
  - `send-email` → `emails:send` (Convex Action)
  - `sincronizar-calificaciones` → `grades:synchronize`
  - `examen_similar:generate` → `exams:generateSimilar`

- [ ] **Mover webhooks a Convex Actions (opcional)**
  - Evaluar si usar Convex HTTP Actions o mantener en Vercel
  - Migrar si aplica

- [ ] **Migrar triggers SQL a lógica en mutations**
  - Trigger: `on_auth_user_created` → Mutation: `teachers:createOnSignup`
  - Llamar desde Clerk webhook (user.created)

- [ ] **Actualizar nombres de funciones a inglés**
  - Migrar todas las funciones
  - Actualizar llamadas en frontend

### Tiempo estimado
3-4 días

---

## Fase 7: Polar.sh Integration

### Objetivo
Actualizar integración con Polar.sh para usar Convex.

### Checklist

- [ ] **Actualizar webhook handler**
  ```typescript
  // apps/web/app/api/webhooks/polar/route.ts
  // Usar ConvexHttpClient
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!, process.env.CONVEX_ADMIN_KEY!)
  await convex.mutation(api.teachers.updateSubscription, { ... })
  ```

- [ ] **Vincular `polar_customer_id` con nuevo ID**
  - Usar `clerkId` para identificar teacher
  - Mapear customer_id → teacher._id

- [ ] **Probar actualización de subscription tier**
  - Simular eventos de Polar
  - Verificar updates en Convex
  - Verificar límites aplicados

- [ ] **Actualizar URL de webhook en Polar dashboard**
  - Cambiar a nueva URL si cambió el endpoint
  - Verificar conectividad

### Tiempo estimado
1-2 días

---

## Fase 8: Testing y Cleanup

### Objetivo
Validar migración completa y limpiar dependencias de Supabase.

### Checklist

- [ ] **Testing end-to-end en Web**
  - Flujo completo de onboarding
  - Creación de examen
  - Importación de estudiantes
  - Generación de PDF
  - Escaneo OMR
  - Verificación de calificaciones

- [ ] **Testing en Mobile (React Native)**
  - Login con Clerk
  - Listado de exámenes
  - Navegación básica
  - Verificar sincronización

- [ ] **Eliminación de dependencias de Supabase**
  ```bash
  npm uninstall @supabase/supabase-js @supabase/ssr
  ```

- [ ] **Remover Edge Functions**
  - Eliminar `supabase/functions/`
  - Remover configuración de Edge Functions

- [ ] **Eliminar tablas de Supabase (backup previo)**
  - Crear backup completo
  - Eliminar tablas de producción
  - Mantener proyecto Supabase por 30 días

### Tiempo estimado
3-4 días

---

## Fase 9: Implementación de Tests

### Objetivo
Implementar suite de tests progresivamente tras completar migración.

**Ver:** [03. Critical Paths Testing](./03-critical-paths-testing.md)

### Tiempo estimado
4 semanas (4 sprints de 1 semana)

---

## Resumen de Tiempos

| Fase | Días | Semanas |
|------|------|---------|
| Fase 1: Preparación | 2-3 | 0.5 |
| Fase 2: Schema Convex | 3-4 | 0.75 |
| Fase 3: Auth Integration | 2-3 | 0.5 |
| Fase 4: Lógica de Acceso | 5-7 | 1.25 |
| Fase 5: Importación de Datos | 2-3 | 0.5 |
| Fase 6: Migración de Funcionalidades | 3-4 | 0.75 |
| Fase 7: Polar.sh Integration | 1-2 | 0.25 |
| Fase 8: Testing y Cleanup | 3-4 | 0.75 |
| Fase 9: Implementación de Tests | 20 | 4 |
| **Total** | **41-49 días** | **8.5-10 semanas** |

---

## Comandos Útiles

### Convex
```bash
npx convex dev              # Iniciar dev
npx convex deploy           # Deploy a producción
npx convex typecheck        # Validar tipos
npx convex import --file data.json  # Importar datos
```

### Clerk
```bash
npx clerk publish           # Deploy changes
```

### Supabase (solo backup)
```bash
supabase db dump > backup.sql
supabase db reset          # Reset local dev
```
