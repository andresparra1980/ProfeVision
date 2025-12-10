# ProfeVision Monorepo Setup

## Requisitos

- Node.js 18+ (recomendado 20 LTS)
- pnpm 9.15.9+
- Git

## Instalacion

```bash
# 1. Clonar repo
git clone <repo-url>
cd profevision

# 2. Instalar pnpm (si no lo tienes)
corepack enable
corepack prepare pnpm@9.15.9 --activate

# 3. Instalar dependencias (desde raiz)
pnpm install
```

## Estructura

```
profevision/
├── apps/
│   └── web/      # Next.js app
├── services/     # Python microservices
├── supabase/     # DB migrations
└── mddocs/       # Documentacion
```

> **Nota:** La app mobile se movio a un repo separado: `profevision-mobile-app`

## Comandos

```bash
# Desde raiz del monorepo:

pnpm dev          # Dev todos los apps
pnpm dev:web      # Solo web (Next.js)
pnpm build        # Build produccion
pnpm lint         # Linting
pnpm typecheck    # TypeScript check
pnpm clean        # Limpiar builds
```

## Variables de Entorno

Crear `apps/web/.env.local` con:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# AI (OpenRouter)
OPENROUTER_API_KEY=

# OMR Service
OMR_SERVICE_URL=
OMR_SERVICE_API_KEY=

# Otros segun necesidad...
```

Pedir archivo `.env` completo a otro dev del equipo.

## Notas

- **NO** hacer `npm install` ni `yarn` - solo `pnpm`
- **NO** instalar deps dentro de `apps/*` directamente
- Siempre ejecutar comandos desde la **raiz** del monorepo
- Los `node_modules` estan en `.gitignore` - nunca commitearlos

## Troubleshooting

```bash
# Si hay problemas con deps:
pnpm clean
rm -rf node_modules apps/*/node_modules
pnpm install

# Si turbo cache da problemas:
rm -rf .turbo
pnpm dev
```
