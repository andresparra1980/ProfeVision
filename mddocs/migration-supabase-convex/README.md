# Migración: Supabase → Convex + Clerk

## Visión General

Migrar el stack actual de backend de Supabase a Convex con Clerk como proveedor de autenticación. Esto permitirá acceso directo y seguro desde clientes Web (Next.js) y Mobile sin depender de Vercel como intermediario.

### Objetivos de la Migración

1. **Arquitectura:** Reemplazar Supabase + RLS por Convex + Functions
2. **Auth:** Migrar de Supabase Auth a Clerk
3. **Internacionalización del Schema:** Renombrar tablas y campos de español a inglés para mejorar la accesibilidad del código para desarrolladores que no hablen español
4. **Real-time:** Implementar reactividad nativa sin Postgres Changes
5. **Simplicidad:** Eliminar dependencia de Vercel para lógica de datos
6. **Testing:** Implementar suite de tests progresivamente tras completar migración, enfocándose en caminos críticos

## Stack Actual vs Stack Nuevo

| Componente | Actual | Nuevo |
|-----------|--------|-------|
| **BaaS** | Supabase (PostgreSQL) | Convex (Document-store relacional) |
| **Auth** | Supabase Auth | Clerk |
| **Seguridad** | RLS (Row Level Security) | Convex Functions (middleware) |
| **Backend Logic** | Edge Functions, Triggers, RPC | Queries, Mutations, Actions |
| **Real-time** | Postgres Changes | Convex Reactivity (WebSockets nativos) |
| **Webhooks** | Vercel API Routes | Convex Actions / Vercel API Routes |

## Documentación

- [01. Schema Mapping (ES→EN)](./01-schema-mapping.md) - Diccionario completo de mapeo de tablas y campos
- [02. Migration Phases](./02-migration-phases.md) - Fases detalladas de ejecución de la migración
- [03. Critical Paths Testing](./03-critical-paths-testing.md) - Suite de tests de caminos críticos del sistema
- [04. Security Architecture](./04-security-architecture.md) - Transformación de RLS a Convex Functions

## Ventajas de la Migración

1. **Arquitectura Simplificada:** Vercel solo sirve la UI, toda la lógica de datos está en Convex
2. **Tipo de Seguridad:** No hay necesidad de RLS complejo, todo es código TypeScript
3. **Real-time Nativo:** Updates automáticos sin Postgres Changes
4. **React Native Soporte:** Mismo código para Web y Mobile
5. **Menos Latencia:** Cliente Convex → Convex directo, sin Vercel como intermediario para datos
6. **Código Internacionalizado:** Schema en inglés permite onboarding más rápido de desarrolladores
7. **Testing:** Suite de tests para asegurar calidad y prevenir regresiones

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Pérdida de datos durante migración | Backup completo de Supabase antes de empezar |
| Diferencias en modelo de datos | Probar import en dev environment primero |
| Cambios en lógica de auth | Documentar diferencias para equipo mobile |
| Polar webhook desincronización | Monitoreo de eventos durante primera semana |
| Performance con grandes datasets | Usar Convex pagination y índices optimizados |
| Bugs por renombrado de campos | Testing exhaustivo y validación de tipos en TS |
| Confusión durante transición | Documentar diccionario ES→EN para equipo existente |

## Recursos

- [Convex Docs](https://docs.convex.dev)
- [Clerk Docs](https://clerk.com/docs)
- [Convex + Clerk Integration](https://docs.convex.dev/auth/clerk)
- [Convex Schema Reference](https://docs.convex.dev/database/schemas)
- [Convex Testing Guide](https://docs.convex.dev/testing)

## Preguntas Abiertas

- ¿Cuántos usuarios/registros migrar?
- ¿Preferir webhooks Polar en Convex Actions o mantener en Vercel?
- ¿Requerir downtime durante migración?
- ¿Estrategia de rollback si falla migración?
- ¿Período de soporte para nombres en español durante transición?

## Notas

- Storage ya se migrará a CDN externo (fuera de alcance)
- Mobile app ya existe → probar Convex React Native client
- Considerar Convex Auth como alternativa a Clerk (evaluar pros/contras)
- La internacionalización del schema requiere actualización masiva de código frontend
- Recomendado crear script de migración automática para transformar nombres de campos
- Testing se implementará progresivamente después de completar migración y pruebas manuales
