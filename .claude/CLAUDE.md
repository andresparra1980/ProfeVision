# ProfeVision - Project Documentation

## Executive Summary

**ProfeVision** is a comprehensive educational platform designed to transform how teachers create, manage, and grade exams. The platform leverages AI to assist in exam creation, supports multiple exam formats (digital and paper-based), enables automatic grading via smartphone scanning, and provides detailed analytics on student performance.

**Current Status**: Active development, MVP targeting Q1 2024
**Version**: 0.1.0
**Language**: Spanish (primary), English (secondary) - Full i18n support
**License**: MIT

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Code Quality & Standards](#code-quality--standards)
5. [Project Structure](#project-structure)
6. [Key Features](#key-features)
7. [Development Workflow](#development-workflow)
8. [Database Schema](#database-schema)
9. [AI Integration](#ai-integration)
10. [Testing & Quality Assurance](#testing--quality-assurance)
11. [Deployment](#deployment)
12. [Contributing](#contributing)

---

## Project Overview

### What is ProfeVision?

ProfeVision is an all-in-one platform that enables educators to:

- **Design Exams**: Create multiple-choice exams with an intuitive interface or AI assistance
- **AI-Powered Generation**: Generate exam questions using AI based on documents, topics, or context
- **Generate Multiple Versions**: Automatically create unique exam versions for each student
- **Automatic Grading**: Scan and grade paper exams using smartphone cameras with QR code and OMR technology
- **Analytics & Insights**: Access detailed performance analytics and student progress reports
- **Institutional Management**: Manage educational entities, subjects, groups, and students
- **Grading Schemes**: Create and manage flexible grading schemes with multiple periods and components

### Target Users

- **Primary**: K-12 and higher education teachers
- **Secondary**: Educational institutions and administrators
- **Geographic Focus**: Latin America (Spanish-speaking countries), with English support

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.2.3 | React framework with App Router, SSR, and API routes |
| **React** | 19.0.0 | UI library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 3.3.0 | Utility-first CSS framework |
| **Shadcn/UI** | Latest | Reusable UI component library |
| **Radix UI** | Various | Accessible component primitives |
| **TipTap** | 2.11.7 | Rich text editor for exam content |
| **React Hook Form** | 7.51.2 | Form state management |
| **Zod** | 3.25.76 | Schema validation |

### Backend & Infrastructure

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | 15.2.3 | Backend API endpoints |
| **Supabase** | 2.39.8 | Backend-as-a-Service |
| - PostgreSQL | Latest | Relational database |
| - Auth | Latest | Authentication & authorization |
| - Storage | Latest | File storage |
| - Edge Functions | Latest | Serverless functions |
| - Realtime | Latest | Real-time subscriptions |

### AI & Machine Learning

| Technology | Version | Purpose |
|------------|---------|---------|
| **OpenRouter API** | Latest | AI model orchestration |
| **LangChain** | 0.3.77 | AI application framework |
| **LangSmith** | 0.3.72 | AI observability and tracing |
| **Vercel AI SDK** | 5.0.51 | AI integration utilities |
| **OpenAI Models** | Via OpenRouter | Primary: `google/gemini-2.5-flash-lite` |
|  |  | Fallback: `mistralai/ministral-8b` |

### Document Processing

| Technology | Version | Purpose |
|------------|---------|---------|
| **Mammoth** | 1.9.0 | DOCX to HTML conversion |
| **unpdf** | 1.2.1 | PDF text extraction |
| **XLSX** | 0.18.5 | Excel file processing |
| **React Markdown** | 10.1.0 | Markdown rendering |
| **KaTeX** | 0.16.22 | LaTeX math rendering |

### Image Processing & Scanning

| Technology | Version | Purpose |
|------------|---------|---------|
| **OpenCV.js** | 4.10.0 | Computer vision for image processing |
| **jsQR** | 1.4.0 | QR code detection and decoding |
| **Sharp** | 0.33.5 | Server-side image optimization |

### PDF Generation

| Technology | Version | Purpose |
|------------|---------|---------|
| **@react-pdf/renderer** | 4.3.0 | PDF generation from React components |

### Internationalization

| Technology | Version | Purpose |
|------------|---------|---------|
| **next-intl** | 4.3.4 | i18n for Next.js App Router |

### Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | 9.x | Code linting |
| **TypeScript ESLint** | 8.29.1 | TypeScript-specific linting |
| **Prettier** (via ESLint) | Latest | Code formatting |
| **Supabase CLI** | 2.19.7 | Database migrations & local dev |

---

## Architecture

### Application Architecture

ProfeVision follows a **modern full-stack architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (Next.js App Router + React 19 + TypeScript)               │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Website    │  │  Dashboard   │  │     Auth     │      │
│  │  (Marketing) │  │   (Teacher   │  │   (Login/    │      │
│  │              │  │   Platform)  │  │   Register)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│              (Next.js API Routes)                            │
│                                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│  │  Exams API │ │   AI API   │ │  Auth API  │             │
│  └────────────┘ └────────────┘ └────────────┘             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│  │ Groups API │ │ Students   │ │  Grading   │             │
│  └────────────┘ └────────────┘ └────────────┘             │
└─────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Supabase   │  │  OpenRouter │  │  LangSmith  │
│  (Database, │  │     AI      │  │ (AI Tracing)│
│   Auth,     │  │   Models    │  │             │
│   Storage)  │  │             │  │             │
└─────────────┘  └─────────────┘  └─────────────┘
```

### Routing Architecture

**Next.js App Router with i18n:**

```
app/
├── [locale]/                    # Localized routes (es, en)
│   ├── (website)/              # Public marketing pages
│   │   ├── page.tsx            # Homepage
│   │   ├── pricing/
│   │   ├── how-it-works/
│   │   └── ...
│   ├── auth/                   # Authentication pages
│   │   ├── login/
│   │   ├── register/
│   │   └── ...
│   └── dashboard/              # Protected teacher dashboard
│       ├── exams/
│       ├── students/
│       ├── groups/
│       └── ...
└── api/                        # API routes (not localized)
    ├── chat/
    ├── exams/
    ├── documents/
    └── ...
```

### Middleware Flow

```
Request → Middleware → i18n → Auth → Route Handler → Response
```

**Middleware responsibilities** (`middleware.ts:1`):
1. **i18n**: Locale detection and path rewriting
2. **Auth**: Session verification with Supabase
3. **Redirects**: Protect dashboard routes, redirect authenticated users from auth pages
4. **Non-localized routes**: Skip i18n for `/auth/callback`, `/api/*`

### Data Flow

**1. Authentication Flow:**
```
User → Login Form → Supabase Auth → Session Cookie → Middleware → Dashboard
```

**2. Exam Creation Flow (AI-Assisted):**
```
Teacher → Upload Documents → Document Processing API →
AI Summarization → Chat Interface → AI Exam Generation →
Save to Database → Export to PDF/LaTeX
```

**3. Exam Grading Flow (Paper-based):**
```
Teacher Scans Exam → Camera Capture → QR Detection →
Image Processing (OpenCV) → OMR Bubble Detection →
Answer Extraction → Auto-grading → Save Results →
Sync with Grading Components
```

---

## Code Quality & Standards

### TypeScript Configuration

**Strict Mode Enabled** (`tsconfig.json:7`)
- All TypeScript strict checks enabled
- Path aliases: `@/*` maps to project root
- Module resolution: `bundler` (Next.js 15+)
- Target: ES5 for broad compatibility

### ESLint Configuration

**Modern Flat Config** (`eslint.config.mjs:1`)
- Base: `@eslint/js` recommended
- TypeScript: `typescript-eslint` recommended
- Next.js: `@next/eslint-plugin-next` core-web-vitals
- React Hooks: Rules of hooks + exhaustive deps

**Custom Rules:**
- Unused vars allowed with `_` prefix
- `@typescript-eslint/no-explicit-any`: Warning (not error)
- Consistent naming conventions enforced

### Code Standards

**1. Logging (`lib/utils/logger.ts:1`)**
- Centralized logging utility
- Development-only by default
- Sanitized logging for auth in production
- Methods: `log`, `warn`, `error`, `perf`, `api`, `auth`

**2. Error Handling**
- Consistent error responses in API routes
- Typed error objects with Zod
- User-friendly error messages with i18n keys

**3. Type Safety**
- Database types auto-generated from Supabase schema
- Zod schemas for runtime validation
- No `any` types except where explicitly needed

**4. File Organization**
```
lib/
├── ai/                  # AI-related logic
├── auth/                # Authentication utilities
├── contexts/            # React contexts
├── document-processor/  # Document parsing
├── hooks/               # Custom React hooks
├── services/            # Business logic
├── supabase/            # Supabase clients
├── types/               # TypeScript types
└── utils/               # Utility functions
```

**5. Component Organization**
```
components/
├── ui/                  # Reusable UI components (Shadcn)
├── shared/              # Shared business components
├── exam/                # Exam-specific components
├── dashboard/           # Dashboard components
├── ai/                  # AI-related UI components
└── ...
```

### Best Practices Observed

1. **Separation of Concerns**: API logic separate from UI components
2. **Modular Code**: Small, focused functions and components
3. **DRY Principle**: Shared utilities and helpers
4. **Accessibility**: Radix UI primitives ensure WCAG compliance
5. **Performance**: Code splitting, lazy loading, optimized images
6. **Security**: Server-side auth checks, input validation, sanitization

---

## Project Structure

```
ProfeVision/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # Localized routes
│   │   ├── (website)/            # Public pages
│   │   ├── auth/                 # Auth pages
│   │   └── dashboard/            # Protected dashboard
│   ├── api/                      # API routes
│   │   ├── chat/                 # AI chat endpoint
│   │   ├── documents/            # Document processing
│   │   ├── exams/                # Exam CRUD + AI
│   │   ├── groups/               # Groups management
│   │   ├── students/             # Students management
│   │   ├── latex/                # LaTeX compilation
│   │   └── ...
│   └── layout.tsx                # Root layout
│
├── components/                   # React components
│   ├── ai/                       # AI UI components
│   ├── ai-elements/              # Chat UI primitives
│   ├── dashboard/                # Dashboard components
│   ├── exam/                     # Exam components
│   ├── grades/                   # Grading components
│   ├── grading/                  # Grading schemes
│   ├── shared/                   # Shared components
│   ├── students/                 # Student components
│   ├── ui/                       # Shadcn UI components
│   └── magicui/                  # Animated UI components
│
├── lib/                          # Business logic & utilities
│   ├── ai/                       # AI integrations
│   │   ├── chat/                 # Chat AI logic
│   │   ├── document-summarize/   # Document summarization
│   │   └── similar-exam/         # Exam generation pipeline
│   ├── auth/                     # Auth utilities
│   ├── document-processor/       # Document parsing
│   ├── hooks/                    # Custom React hooks
│   ├── services/                 # Business services
│   ├── supabase/                 # Supabase clients
│   ├── types/                    # TypeScript types
│   └── utils/                    # Utilities
│
├── i18n/                         # Internationalization
│   ├── locales/                  # Translation files (es, en)
│   ├── routing.ts                # i18n route configuration
│   └── request.ts                # i18n request handler
│
├── public/                       # Static assets
│   ├── images/                   # Images
│   ├── uploads/                  # User uploads
│   └── fonts/                    # Custom fonts
│
├── scripts/                      # Utility scripts
│   ├── ocr/                      # OCR scripts
│   └── omr/                      # OMR scripts
│
├── supabase/                     # Supabase configuration
│   ├── migrations/               # Database migrations
│   └── functions/                # Edge functions
│
├── styles/                       # Global styles
├── types/                        # Global TypeScript types
├── worker/                       # Background job workers
├── middleware.ts                 # Next.js middleware
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
├── eslint.config.mjs             # ESLint configuration
└── package.json                  # Dependencies
```

---

## Key Features

### 1. AI-Powered Exam Creation

**Location**: `app/api/chat/route.ts:1`, `app/[locale]/dashboard/exams/ai-exams-creation-chat/`

**Features:**
- Chat-based exam generation interface
- Context-aware question generation
- Document upload and summarization
- Multiple AI model support via OpenRouter
- Real-time question editing
- Draft saving and loading

**AI Models Used:**
- Primary: `google/gemini-2.5-flash-lite` (fast, cost-effective)
- Fallback: `mistralai/ministral-8b`
- Alternative: `openai/gpt-4`, `anthropic/claude-3-opus`

**AI Observability:**
- LangSmith integration for tracing
- Cost tracking per generation
- Token usage analytics
- Performance monitoring

### 2. Similar Exam Generation

**Location**: `app/api/exams/similar/stream/route.ts:1`, `lib/ai/similar-exam/`

**Features:**
- Generate similar exams from existing templates
- Maintain question structure and difficulty
- Randomize questions and answers
- Real-time progress tracking via SSE (Server-Sent Events)
- Supabase Realtime integration
- Background job processing

**Pipeline Steps:**
1. Load blueprint (source exam)
2. Generate similar questions
3. Validate output
4. Apply to exam structure
5. Randomize order
6. Finalize and save

### 3. Document Processing

**Location**: `app/api/documents/`, `lib/document-processor/`

**Supported Formats:**
- DOCX (via Mammoth.js)
- PDF (via unpdf)
- Excel (via XLSX)
- Plain text

**Features:**
- Text extraction
- Automatic summarization
- Chunking for AI processing
- Background processing with progress tracking

### 4. Exam Scanning & Grading

**Location**: `components/exam/exam-scanner.tsx`, `components/exam/scan-wizard.tsx`

**Features:**
- QR code-based exam identification
- OMR (Optical Mark Recognition) for bubble sheets
- Computer vision with OpenCV.js
- Mobile-first camera interface
- Real-time answer detection
- Automatic grading
- Manual correction interface

**Technical Details:**
- Corner marker detection for alignment
- Perspective transformation
- Bubble detection with threshold analysis
- Multi-answer support

### 5. Grading Schemes

**Location**: `components/grading/grading-scheme-editor.tsx`, `app/[locale]/dashboard/groups/[id]/grading-scheme/`

**Features:**
- Multi-period grading schemes
- Weighted components within periods
- Flexible grade calculations
- Link exams to grading components
- Excel export/import for grades

### 6. Multi-Language Support

**Location**: `i18n/`, `middleware.ts:1`

**Features:**
- Spanish (default) and English
- Localized routes (e.g., `/es/examenes` → `/en/exams`)
- Translation files for all UI text
- SEO-friendly URLs
- Automatic language detection (disabled to prevent unwanted redirects)

### 7. PDF Export

**Location**: `components/exam/pdf-generator.tsx`, `components/exam/exam-pdf.tsx`

**Features:**
- Generate exam PDFs with multiple versions
- QR codes for automatic grading
- OMR bubble sheets
- Custom styling
- Math rendering (KaTeX)

### 8. LaTeX Support

**Location**: `app/api/latex/compile/`, `lib/latex/`

**Features:**
- LaTeX exam generation
- Server-side compilation
- Math and science notation support

---

## Development Workflow

### Getting Started

```bash
# Clone repository
git clone https://github.com/andresparra1980/profevision.git
cd profevision

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
yarn dev

# Start with Turbopack (faster)
yarn dev

# Start with Webpack
yarn dev:webpack

# Fresh start (clear cache)
yarn dev:fresh
```

### Environment Variables

**Required:**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenRouter (AI)
OPENROUTER_API_KEY=your_openrouter_api_key
OPENAI_MODEL=google/gemini-2.5-flash-lite
OPENAI_FALLBACK_MODEL=mistralai/ministral-8b
```

**Optional (Observability):**
```env
# LangSmith (AI Tracing)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_api_key
LANGCHAIN_PROJECT=ProfeVision
```

### Available Scripts

```bash
yarn dev              # Start development server
yarn build            # Build for production
yarn start            # Start production server
yarn lint             # Run ESLint
yarn clean            # Clean build artifacts
yarn dev:fresh        # Fresh dev start (clear cache)
```

### Database Migrations

```bash
# Run Supabase locally
supabase start

# Create migration
supabase migration new migration_name

# Apply migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > lib/types/supabase.d.ts
```

---

## Database Schema

**Location**: `lib/types/database.ts:1`, Supabase PostgreSQL

### Core Tables

**1. Educational Entities**
- `entidades_educativas`: Schools, universities, institutions
- `profesores`: Teacher profiles (linked to auth.users)
- `materias`: Subjects/courses
- `grupos`: Class groups
- `estudiantes`: Student records
- `estudiante_grupo`: Many-to-many student-group relationship

**2. Exams**
- `examenes`: Exam metadata
- `preguntas`: Exam questions
- `opciones_respuesta`: Multiple-choice options
- `versiones_examen`: Exam versions for randomization

**3. Exam Applications**
- `aplicaciones_examen`: Exam sessions assigned to groups
- `respuestas_estudiante`: Student answers
- `resultados_examen`: Grading results

**4. Grading Schemes**
- `esquemas_calificacion`: Grading scheme definitions
- `periodos_calificacion`: Grading periods (e.g., quarters)
- `componentes_calificacion`: Grade components (e.g., exams, homework)
- `calificaciones`: Individual grades

**5. Background Jobs**
- `procesos_examen_similar`: Similar exam generation jobs

### Key Relationships

```
entidades_educativas (1) → (N) materias
materias (1) → (N) grupos
materias (1) → (N) examenes
grupos (1) → (N) aplicaciones_examen
grupos (N) → (N) estudiantes (via estudiante_grupo)
examenes (1) → (N) preguntas
preguntas (1) → (N) opciones_respuesta
aplicaciones_examen (1) → (N) respuestas_estudiante
aplicaciones_examen (1) → (N) resultados_examen
```

### Row-Level Security (RLS)

- Enabled on all tables
- Teachers can only access their own data
- Custom function: `is_profesor_of_grupo(grupo_id)` for authorization

---

## AI Integration

### Architecture

**1. Chat-based Exam Generation**
- **Endpoint**: `POST /api/chat`
- **Model**: ChatOpenAI (via OpenRouter)
- **Framework**: LangChain
- **Tracing**: LangSmith
- **Input**: User messages, context (documents, existing exam, settings)
- **Output**: JSON exam structure with questions and answers

**2. Document Summarization**
- **Endpoint**: `POST /api/documents/summarize`
- **Purpose**: Extract key topics from uploaded documents
- **Output**: Topic summaries for AI context

**3. Similar Exam Generation**
- **Endpoint**: `GET /api/exams/similar/stream` (SSE)
- **Purpose**: Generate a similar exam from an existing one
- **Pipeline**: Multi-step process with progress tracking

### AI Prompt Engineering

**System Prompt** (`lib/ai/chat/prompts.ts`):
- Role: Expert exam creator
- Language: Configurable (Spanish/English)
- Output format: Structured JSON
- Quality criteria: Clear, unambiguous, age-appropriate

**User Instruction**:
- Number of questions
- Question types (multiple choice, true/false)
- Difficulty level
- Topic/subject
- Document context (if provided)
- Existing exam (for modifications)

### Cost Optimization

- **Primary model**: `google/gemini-2.5-flash-lite` (low cost, fast)
- **Fallback model**: `mistralai/ministral-8b`
- **Cost tracking**: Real-time cost metadata in LangSmith
- **Token usage**: Monitored per request

### AI Observability (LangSmith)

**Metrics Tracked:**
- Request/response latency
- Token usage (prompt + completion)
- Cost per generation
- Model performance
- Error rates
- User context (language, question count, difficulty)

**Trace Hierarchy:**
```
chat_exam_generation (root)
├── ChatOpenAI (LLM call)
└── openrouter_cost (cost tracking node)
```

---

## Testing & Quality Assurance

### Current State

- **Unit Tests**: Not yet implemented
- **Integration Tests**: Not yet implemented
- **E2E Tests**: Not yet implemented

### Quality Assurance Methods

1. **TypeScript**: Compile-time type checking
2. **ESLint**: Static code analysis
3. **Manual Testing**: Active development testing
4. **Code Reviews**: Via pull requests

### Future Testing Strategy

- [ ] Jest for unit tests
- [ ] React Testing Library for component tests
- [ ] Playwright for E2E tests
- [ ] Supabase test database for integration tests

---

## Deployment

### Platform

**Recommended**: Vercel (Next.js creators)
- Automatic deployments from Git
- Preview deployments for PRs
- Edge network for global performance
- Built-in analytics

### Build Configuration

**Next.js Config** (`next.config.ts:1`):
- Turbopack support (faster builds)
- Image optimization
- Custom headers for caching
- Webpack configuration for browser compatibility

**Environment Variables**:
- Set in Vercel dashboard or `.env.production`
- Never commit `.env` files to Git

### Database

**Supabase Cloud**:
- Hosted PostgreSQL
- Automatic backups
- Global CDN for Storage
- Built-in auth

### Monitoring

- **Vercel Analytics**: Performance metrics
- **LangSmith**: AI observability
- **Supabase Dashboard**: Database metrics

---

## Contributing

### Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Commit Message Convention

```
type(scope): subject

Examples:
feat(exams): add AI question generation
fix(grading): resolve calculation error
refactor(auth): migrate to Supabase Auth
docs(readme): update installation steps
style(ui): fix button alignment
```

### Code Style

- Follow ESLint rules
- Use TypeScript strict mode
- Write self-documenting code
- Add comments for complex logic
- Keep functions small and focused

---

## Additional Resources

### Documentation

- [README.md](./README.md) - Quick start guide
- [LANGSMITH_QUICKSTART.md](./LANGSMITH_QUICKSTART.md) - AI observability setup
- [CODE_QUALITY.md](./CODE_QUALITY.md) - Code quality standards (if exists)

### External Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [LangChain Documentation](https://js.langchain.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn/UI Documentation](https://ui.shadcn.com)

---

## Contact & Support

**Project Repository**: https://github.com/andresparra1980/profevision
**Issues**: https://github.com/andresparra1980/profevision/issues
**License**: MIT

---

**Last Updated**: 2025-10-15
**Project Version**: 0.1.0
**Documentation Version**: 1.0.0
