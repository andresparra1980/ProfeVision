# Security Architecture: RLS → Convex Functions

Documentación de la transformación de Row Level Security (RLS) de Supabase a Functions de Convex.

---

## Comparación de Modelos

### Supabase: RLS (Row Level Security)

```sql
-- Política SQL
CREATE POLICY "Los profesores pueden ver sus propios exámenes"
  ON public.examenes FOR SELECT
  USING (profesor_id = auth.uid());
```

**Características:**
- Seguridad definida en SQL
- Se ejecuta automáticamente en cada query
- Usa `auth.uid()` del usuario autenticado
- Políticas separadas por tabla y operación

### Convex: Functions (Queries/Mutations)

```typescript
// Query con validación de auth
export const getMyExams = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const teacher = await ctx.db
      .query("teachers")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!teacher) return [];

    return await ctx.db
      .query("exams")
      .withIndex("by_teacher", (q) => q.eq("teacherId", teacher._id))
      .collect();
  },
});
```

**Características:**
- Seguridad definida en TypeScript
- Se ejecuta en cada query/mutation
- Usa `ctx.auth.getUserIdentity()` del JWT de Clerk
- Validación programática más flexible

---

## Ventajas del Modelo de Convex

1. **Tipo-safe:** Validación de tipos en tiempo de compilación
2. **Programático:** Lógica más compleja es posible
3. **Auto-completado:** Mejor experiencia de desarrollo
4. **Testing:** Más fácil de testear que SQL
5. **Centralizado:** Auth helper reusable en todas las funciones
6. **Flexible:** Puede hacer lógica condicional compleja

---

## Helper Functions

### `getMe()` - Obtener usuario autenticado

```typescript
// convex/utils/auth.ts
import { QueryCtx, MutationCtx } from "./_generated/server";

export const getMe = async (
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"teachers"> | null> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query("teachers")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();
};
```

**Uso:**

```typescript
export const getMyExams = query({
  handler: async (ctx) => {
    const me = await getMe(ctx);
    if (!me) throw new Error("No autenticado");

    return await ctx.db
      .query("exams")
      .withIndex("by_teacher", (q) => q.eq("teacherId", me._id))
      .collect();
  },
});
```

---

## Mapeo de Políticas RLS a Convex

### Profesores

#### RLS Original

```sql
CREATE POLICY "Los profesores pueden ver su propio perfil"
  ON public.profesores FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Los profesores pueden actualizar su propio perfil"
  ON public.profesores FOR UPDATE
  USING (auth.uid() = id);
```

#### Convex Query/Mutation

```typescript
// Ver mi perfil
export const getMyProfile = query({
  handler: async (ctx) => {
    return await getMe(ctx);
  },
});

// Actualizar mi perfil
export const updateMyProfile = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const me = await getMe(ctx);
    if (!me) throw new Error("No autenticado");

    await ctx.db.patch(me._id, {
      ...args,
    });

    return me._id;
  },
});
```

---

### Materias

#### RLS Original

```sql
CREATE POLICY "Los profesores pueden ver sus propias materias"
  ON public.materias FOR SELECT
  USING (profesor_id = auth.uid());

CREATE POLICY "Los profesores pueden crear sus propias materias"
  ON public.materias FOR INSERT
  WITH CHECK (profesor_id = auth.uid());
```

#### Convex Query/Mutation

```typescript
// Ver mis materias
export const getMySubjects = query({
  handler: async (ctx) => {
    const me = await getMe(ctx);
    if (!me) return [];

    return await ctx.db
      .query("subjects")
      .withIndex("by_teacher", (q) => q.eq("teacherId", me._id))
      .collect();
  },
});

// Crear materia
export const createSubject = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    entityId: v.optional(v.id("educationalEntities")),
  },
  handler: async (ctx, args) => {
    const me = await getMe(ctx);
    if (!me) throw new Error("No autenticado");

    const subjectId = await ctx.db.insert("subjects", {
      ...args,
      teacherId: me._id,
    });

    return subjectId;
  },
});
```

---

### Grupos

#### RLS Original

```sql
CREATE POLICY "Los profesores pueden ver sus propios grupos"
  ON public.grupos FOR SELECT
  USING (profesor_id = auth.uid());

CREATE POLICY "Los profesores pueden crear sus propios grupos"
  ON public.grupos FOR INSERT
  WITH CHECK (profesor_id = auth.uid());
```

#### Convex Query/Mutation

```typescript
// Ver mis grupos
export const getMyGroups = query({
  handler: async (ctx) => {
    const me = await getMe(ctx);
    if (!me) return [];

    return await ctx.db
      .query("groups")
      .withIndex("by_teacher", (q) => q.eq("teacherId", me._id))
      .collect();
  },
});

// Crear grupo
export const createGroup = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    subjectId: v.id("subjects"),
    entityId: v.optional(v.id("educationalEntities")),
    schoolYear: v.optional(v.string()),
    schoolPeriod: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const me = await getMe(ctx);
    if (!me) throw new Error("No autenticado");

    const groupId = await ctx.db.insert("groups", {
      ...args,
      teacherId: me._id,
      status: "activo",
    });

    return groupId;
  },
});
```

---

### Estudiantes

#### RLS Original

```sql
CREATE POLICY "Los profesores pueden ver estudiantes de sus grupos"
  ON public.estudiantes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.estudiante_grupo eg
    JOIN public.grupos g ON eg.grupo_id = g.id
    WHERE eg.estudiante_id = public.estudiantes.id
    AND g.profesor_id = auth.uid()
  ));
```

#### Convex Query

```typescript
// Ver estudiantes de mis grupos
export const getMyStudents = query({
  handler: async (ctx) => {
    const me = await getMe(ctx);
    if (!me) return [];

    const myGroups = await ctx.db
      .query("groups")
      .withIndex("by_teacher", (q) => q.eq("teacherId", me._id))
      .collect();

    const groupIds = myGroups.map(g => g._id);

    const studentGroups = await ctx.db
      .query("studentGroups")
      .collect()
      .filter(sg => groupIds.includes(sg.groupId));

    const studentIds = studentGroups.map(sg => sg.studentId);

    const students = await ctx.db
      .query("students")
      .collect()
      .filter(s => studentIds.includes(s._id));

    return students;
  },
});
```

---

### Exámenes

#### RLS Original

```sql
CREATE POLICY "Los profesores pueden ver sus propios exámenes"
  ON public.examenes FOR SELECT
  USING (profesor_id = auth.uid());

CREATE POLICY "Los profesores pueden crear sus propios exámenes"
  ON public.examenes FOR INSERT
  WITH CHECK (profesor_id = auth.uid());
```

#### Convex Query/Mutation

```typescript
// Ver mis exámenes
export const getMyExams = query({
  handler: async (ctx) => {
    const me = await getMe(ctx);
    if (!me) return [];

    return await ctx.db
      .query("exams")
      .withIndex("by_teacher", (q) => q.eq("teacherId", me._id))
      .collect();
  },
});

// Crear examen
export const createExam = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    instructions: v.optional(v.string()),
    subjectId: v.id("subjects"),
    durationMinutes: v.optional(v.number()),
    totalScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const me = await getMe(ctx);
    if (!me) throw new Error("No autenticado");

    const examId = await ctx.db.insert("exams", {
      ...args,
      teacherId: me._id,
      status: "borrador",
      createdAt: Date.now(),
    });

    return examId;
  },
});
```

---

## Ejemplos con Relaciones

### Get Group with Students

```typescript
export const getGroupWithStudents = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const me = await getMe(ctx);
    if (!me) throw new Error("No autenticado");

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Grupo no encontrado");
    if (group.teacherId !== me._id) throw new Error("No autorizado");

    const studentGroups = await ctx.db
      .query("studentGroups")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const students = await Promise.all(
      studentGroups.map(sg => ctx.db.get(sg.studentId))
    );

    return {
      ...group,
      students: students.filter(Boolean),
    };
  },
});
```

### Get Exam with Questions and Options

```typescript
export const getExamWithDetails = query({
  args: { examId: v.id("exams") },
  handler: async (ctx, args) => {
    const me = await getMe(ctx);
    if (!me) throw new Error("No autenticado");

    const exam = await ctx.db.get(args.examId);
    if (!exam) throw new Error("Examen no encontrado");
    if (exam.teacherId !== me._id) throw new Error("No autorizado");

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_exam", (q) => q.eq("examId", args.examId))
      .collect();

    const questionsWithOptions = await Promise.all(
      questions.map(async (q) => {
        const options = await ctx.db
          .query("answerOptions")
          .withIndex("by_question", (o) => o.eq("questionId", q._id))
          .collect();

        return {
          ...q,
          options,
        };
      })
    );

    return {
      ...exam,
      questions: questionsWithOptions,
    };
  },
});
```

---

## Migración de Triggers SQL

### Trigger: Crear profesor al registrarse

#### SQL Original

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profesores (id, nombres, apellidos)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### Convex Mutation + Clerk Webhook

```typescript
// convex/teachers.ts
export const createOnSignup = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verificar si ya existe
    const existing = await ctx.db
      .query("teachers")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.clerkId))
      .unique();

    if (existing) return existing._id;

    // Crear nuevo teacher
    const teacherId = await ctx.db.insert("teachers", {
      clerkId: args.clerkId,
      tokenIdentifier: args.clerkId,
      firstName: args.firstName || "Usuario",
      lastName: args.lastName || "",
      email: args.email,
      subscriptionTier: "free",
      subscriptionStatus: "active",
      firstLoginCompleted: false,
    });

    return teacherId;
  },
});
```

```typescript
// apps/web/app/api/webhooks/clerk/route.ts
import { clerkClient, WebhookEvent } from '@clerk/nextjs/api'
import { ConvexHttpClient } from 'convex/browser'

export async function POST(req: Request) {
  const evt = await webhook(req, CLERK_WEBHOOK_SECRET)

  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data

    const convex = new ConvexHttpClient(
      process.env.NEXT_PUBLIC_CONVEX_URL!,
      process.env.CONVEX_ADMIN_KEY!
    )

    await convex.mutation(api.teachers.createOnSignup, {
      clerkId: id,
      email: email_addresses[0].email_address,
      firstName: first_name,
      lastName: last_name,
    })
  }

  return new Response(null, { status: 200 })
}
```

---

## Tests de Seguridad

### Test: Usuario A no puede ver datos de usuario B

```typescript
import { testMutation, testQuery } from "convex/test";

describe("Security", () => {
  it("user A cannot see user B's exams", async () => {
    const ctx = await testMutation();

    // Crear usuario A
    const userA = await ctx.runMutation(api.teachers.createOnSignup, {
      clerkId: "user-a",
      email: "user-a@test.com",
      firstName: "User",
      lastName: "A",
    });

    // Crear usuario B
    const userB = await ctx.runMutation(api.teachers.createOnSignup, {
      clerkId: "user-b",
      email: "user-b@test.com",
      firstName: "User",
      lastName: "B",
    });

    // Crear examen como usuario B
    await ctx.runMutation(api.exams.create, {
      title: "Exam B",
      subjectId: "subject-id",
      teacherId: userB,
    });

    // Usuario A intenta ver exámenes (debería ver solo los suyos)
    const exams = await ctx.runQuery(api.exams.getMyExams, {}, {
      tokenIdentifier: "user-a",
    });

    expect(exams).toHaveLength(0);
  });
});
```

---

## Checklist de Migración

- [ ] Migrar todas las políticas RLS a Queries/Mutations
- [ ] Implementar helper `getMe()` reusable
- [ ] Validar auth en todas las functions
- [ ] Reemplazar triggers SQL con webhooks/mutations
- [ ] Migrar functions SQL RPC a Convex
- [ ] Escribir tests de seguridad para cada función
- [ ] Validar que no hay data leaks
- [ ] Documentar patrones de seguridad

---

## Recursos

- [Convex Auth Docs](https://docs.convex.dev/auth)
- [Clerk Webhooks](https://clerk.com/docs/integrations/webhooks)
- [Convex Security Guide](https://docs.convex.dev/production/security)
