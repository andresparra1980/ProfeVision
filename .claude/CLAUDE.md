# ProfeVision - Monorepo

## Overview

Educational platform for teachers: AI exam creation, automatic grading via smartphone scanning, analytics.

**Stack**: Next.js 15, React 19, TypeScript, Supabase, Tailwind, Turborepo
**Languages**: Spanish (primary), English

## Monorepo Structure

```
ProfeVision/
├── apps/
│   ├── web/                 # Next.js 15 App Router
│   └── mobile/              # Expo React Native (planned)
├── services/
│   ├── latex-service/       # LaTeX PDF compilation (FastAPI)
│   ├── omr-service/         # OMR processing (FastAPI)
│   └── omr-service-direct/  # Direct OMR API
├── supabase/
│   ├── migrations/          # DB migrations
│   └── functions/           # Edge functions
├── scripts/                 # Utility scripts
├── mddocs/                  # Documentation
├── turbo.json               # Turborepo config
├── pnpm-workspace.yaml      # Workspace config
└── package.json             # Root package
```

## Commands

```bash
# Development
pnpm dev                              # All workspaces
pnpm --filter @profevision/web dev    # Web only
pnpm --filter @profevision/web dev:clean  # Web with clean cache

# Build
pnpm build                            # All (uses Vercel Remote Cache)

# Lint
pnpm --filter @profevision/web lint
```

## Web App Structure (apps/web/)

```
apps/web/
├── app/
│   ├── [locale]/            # i18n routes (es, en)
│   │   ├── (website)/       # Public pages
│   │   ├── auth/            # Auth pages
│   │   └── dashboard/       # Protected dashboard
│   └── api/                 # API routes
├── components/
│   ├── ui/                  # Shadcn components
│   ├── exam/                # Exam components
│   ├── dashboard/           # Dashboard components
│   └── shared/              # Shared components
├── lib/
│   ├── ai/                  # AI integrations
│   ├── supabase/            # Supabase clients
│   ├── hooks/               # Custom hooks
│   ├── services/            # Business logic
│   └── utils/               # Utilities
└── i18n/                    # Translations
```

## Code Standards

### TypeScript
- Strict mode enabled
- No `any` - use `unknown` if needed
- Prefix unused vars with `_`

### Components
- Functional components only
- Props interface at top of file
- Order: types → constants → component → hooks → helpers → effects → render

### Imports Order
1. React/Next.js
2. External libraries
3. Internal components
4. Hooks, utils, types
5. Styles

### Naming
- Components: PascalCase
- Files: kebab-case for utils, PascalCase for components
- Variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Booleans: is/has/should prefix

### Error Handling
- Use centralized logger (`lib/utils/logger.ts`)
- Try/catch for async operations
- Typed errors with Zod validation
- Toast notifications via `sonner`

### Component Patterns
- Props extend native HTML attrs when applicable (`React.ButtonHTMLAttributes`)
- Variants via `class-variance-authority` (CVA)
- State: useState (local), Context API (global), custom hooks (complex logic)
- Hydration safety: `suppressHydrationWarning`, `mounted` state pattern
- Forms: react-hook-form + zodResolver
- DB types: `Database['public']['Tables']['tablename']['Row']`

### Common Imports
- UI: `@/components/ui/*` (Shadcn)
- Supabase: `@/lib/supabase/client`
- Icons: `lucide-react`
- Toast: `sonner`
- i18n: `useTranslations` from `next-intl`

## Testing
- No tests yet (planned)

## Key Technologies

| Category | Tech |
|----------|------|
| Framework | Next.js 15 (App Router) |
| UI | Tailwind, Shadcn/UI, Radix |
| DB | Supabase (PostgreSQL, Auth, Storage) |
| AI | OpenRouter, LangChain, Vercel AI SDK |
| Monorepo | Turborepo, pnpm workspaces |
| PDF | @react-pdf/renderer, LaTeX service |
| Scanning | OpenCV.js, jsQR |

## AI Models
- Primary: `google/gemini-3-flash-preview`
- Fallback: `mistralai/ministral-8b`

## Environment Variables

Required in `apps/web/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=
```

## Database

- **Schema reference**: `mddocs/DATABASE_SCHEMA.md`
- **Types**: `apps/web/lib/supabase/database.types.ts`
- RLS enabled on all tables
- **No local Supabase** - develop against prod DB
- Migrations via Supabase GUI (manual, careful analysis)

## Git Workflow

- Branch naming: `feature/`, `bugfix/`, `hotfix/`
- Commits: Conventional Commits format
- No push without explicit approval

## External Services

| Service | Purpose |
|---------|---------|
| Vercel | Web hosting, Remote Cache |
| Supabase | Database, Auth, Storage |
| OpenRouter | AI API |
| LangSmith | AI observability |

## Performance

- Turbo Remote Cache enabled
- Code splitting with dynamic imports
- Image optimization with next/image

## Documentation

Detailed docs in `mddocs/`:
- `DATABASE_SCHEMA.md` - Full schema
- `misc/CODE_QUALITY.md` - Quality guidelines
- `misc/CODE_STYLE.md` - Style guide
- Feature-specific docs in subdirectories
