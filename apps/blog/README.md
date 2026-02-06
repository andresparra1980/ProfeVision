# ProfeVision Blog

Blog app for blog.profevision.com built with Next.js 15 and Payload CMS 3.x.

## Setup

1. Copy `.env.local.example` to `.env.local` and fill in the values
2. Run `pnpm install` from the monorepo root
3. Run `pnpm payload migrate` to create the `blog_*` tables in Supabase
4. Run `pnpm dev` to start the dev server on port 3002

## Structure

```
src/
├── app/
│   ├── (frontend)/     # Public blog pages
│   ├── (payload)/      # Payload admin panel (/admin)
│   └── api/            # API routes
├── collections/        # Payload collections (Posts, Categories, Authors, Media)
└── lib/                # Utilities (Supabase auth, etc.)
```

## Features

- Multi-language (es, en, fr, pt) with AI auto-translation
- SEO optimized with Payload SEO plugin
- Media stored on Cloudflare R2
- Draft/Preview mode for editors
- Admin access via Supabase SSO (requires `subscription_tier='admin'`)
