# SHARED CONTEXT BLOCK
# Paste this at the TOP of every phase prompt before the phase-specific section.
# Keep it as-is. Do not expand it.

---

## Project
PropSphere — real estate marketplace (realestate.com.au clone).
Indian market · Ahmedabad seed data · INR pricing · SPA (Vite, no SSR).

## Stack (locked)
Frontend: React 18 · TS strict · Vite · Tailwind v3 · Redux RTK · TanStack Query v5
          React Router v6 · Mapbox GL JS · react-hook-form + Zod · Recharts · lucide-react
Backend:  NestJS 10 · TS strict · Supabase (Postgres + Auth + Storage) · Postgres FTS
          BullMQ + Redis · Resend · Firebase FCM · PostHog
Monorepo: Turborepo + pnpm

## Hard rules
- Zero `any` types
- No FK constraints in Postgres
- Tailwind only (no inline styles, no CSS Modules)
- Named exports only (except page components)
- No Supabase calls inside React components — use api/ layer
- No try/catch unless handling the error specifically
- No refactoring outside current task scope
- State: TanStack Query = server state · Redux = UI state (filters, viewport, modals)

## Key paths
apps/web/src/features/{feature}/{components,hooks,pages,store}/
apps/web/src/api/           ← TanStack Query hooks
apps/web/src/components/ui/ ← shared primitives
apps/api/src/modules/{module}/{controller,service,dto}/
packages/types/src/         ← shared interfaces (import @propsphere/types)
packages/utils/src/         ← pure functions (import @propsphere/utils)

## Token rule
If context usage > 85%: stop, write Session Summary + Resume From, end response.

## Design tokens (Tailwind extensions)
brand-primary #1A56DB · brand-secondary #0E9F6E · brand-accent #FF6B35
shadow-card · shadow-card-hover · shadow-modal
rounded-card 12px · rounded-btn 8px · rounded-badge 100px
Full design: .claude/design.md
