# Memula — AI-Powered Note Manager

## Tech Stack
- Next.js 16 (App Router) + Tailwind CSS 4
- Supabase (PostgreSQL + pgvector, Auth, Storage)
- TypeScript strict mode
- Zod for validation

## Project Structure
- `src/app/` — Pages and API routes (App Router)
- `src/components/` — React components
- `src/lib/` — Utilities, Supabase clients, schemas
- `src/types/` — TypeScript types
- `supabase/migrations/` — SQL migrations
- `tests/` — Test files

## Coding Standards
- Server Components by default, Client Components only when needed
- Zod for all external data validation
- All text in Czech (UI), code in English
- Environment variables via .env.local (never commit)

## Spec
See `docs/superpowers/specs/2026-03-28-memula-design.md`
