# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PropSphere is a full-stack real estate marketplace (realestate.com.au clone) targeting Ahmedabad/India, built as a Turborepo + pnpm monorepo. The project is currently at **Phase 0 (greenfield)** — documentation is complete; code scaffolding has not started yet.

---

## Commands

```bash
# Install dependencies
pnpm install

# Start all apps in parallel
pnpm dev

# Run a single app
pnpm dev --filter=web
pnpm dev --filter=api

# Build
pnpm build

# Type checking
pnpm typecheck

# Lint
pnpm lint

# Tests
pnpm test
pnpm test --filter=@propsphere/utils   # single package

# Seed the database
pnpm seed
```

Test files: `*.spec.ts` (unit), `*.e2e-spec.ts` (end-to-end).

---

## Monorepo Structure

```
propsphere/
├── apps/
│   ├── web/          # React 18 + Vite SPA (public-facing site)
│   ├── api/          # NestJS 10 backend
│   └── admin/        # React 18 + Vite SPA (internal admin panel, role='admin' only)
├── packages/
│   ├── types/        # Shared TypeScript interfaces — import as @propsphere/types
│   ├── utils/        # Pure shared utilities — import as @propsphere/utils
│   └── config/       # Zod env schemas + shared constants — import as @propsphere/config
├── docs/             # PRD, schema, phase plans, standards
└── scripts/          # DB migrations and seed scripts
```

---

## Tech Stack (Locked)

| Concern | Choice |
|---|---|
| Frontend | React 18 + TypeScript strict + Vite (no SSR) |
| Styling | Tailwind CSS v3 only |
| Server state | TanStack Query v5 |
| UI state | Redux Toolkit |
| Forms | react-hook-form + Zod |
| Maps | MapLibre GL JS + react-map-gl v8 (tile provider: MapTiler, token: `VITE_MAPTILER_KEY`) |
| Backend | NestJS 10 |
| Database | PostgreSQL via Supabase (no FK constraints, 3NF) |
| Search | Postgres FTS — `tsvector` + GIN index (not Typesense) |
| Auth | Supabase Auth (email + Google OAuth) |
| Storage | Supabase Storage (WebP transforms) |
| Queue | BullMQ + Redis |
| Email | Resend |
| Push | Firebase FCM |
| Analytics | PostHog |
| Deploy | Vercel (web) + Railway (api) |

---

## Frontend Architecture (`apps/web/`)

State split: **TanStack Query for all server state; Redux for UI-only state** (filters, map viewport, modals, auth session).

Feature modules under `src/features/{feature}/` follow this layout:
```
features/{feature}/
├── components/
├── hooks/
├── pages/          # default export only; lazy-loaded from router.tsx
├── store/          # Redux slice, if needed
└── types.ts
```

Features: `search`, `listing`, `map`, `auth`, `collections`, `alerts`, `suburb`, `finance`, `agent`, `dashboard`.

Shared primitives live in `src/components/ui/`. API calls go through `src/api/*.ts` (never call Supabase directly from a component).

---

## Maps

MapLibre GL JS replaces Mapbox GL JS. Free, MIT licence.
Tile provider: MapTiler (100k loads/month free).
Token: `VITE_MAPTILER_KEY` (configured in MapTiler dashboard → API Keys → allowed URLs).
Map utils: `@/lib/map` (`apps/web/src/lib/map.ts`) — exports `MAP_STYLE_STREETS`, `MAP_STYLE_SATELLITE`, `DEFAULT_VIEWPORT`, `MAPTILER_KEY`.
Draw area: `maplibre-gl-draw` (replaces `@mapbox/mapbox-gl-draw` — identical API).
Import `Map` from `react-map-gl/maplibre` (not `react-map-gl`) — no `mapboxAccessToken` prop needed.

---

## Backend Architecture (`apps/api/`)

Module-per-domain structure. Controllers only route and validate; all business logic lives in services.

- DTOs use `ZodValidationPipe` at controller boundaries.
- All DB access goes through `SupabaseService` — never call Supabase from controllers.
- Throw NestJS HTTP exceptions (`NotFoundException`, `UnauthorizedException`, etc.) from services.
- Background jobs via BullMQ: `alert-matching`, `price-drop`, `suburb-stats` (nightly cron).

---

## Shared Packages

**`packages/types/`** — source of truth for all interfaces. Key files: `property.ts`, `agent.ts`, `suburb.ts`, `user.ts`, `search.ts`, `collection.ts`, `enquiry.ts`.

**`packages/utils/`** — pure functions with JSDoc and unit tests. Includes `formatPrice` (₹45 L / ₹1.2 Cr), `formatAddress`, `calcMonthlyRepayment`, `calcBorrowCapacity`, `calcStampDuty` (Indian states).

**`packages/config/`** — `env.schema.ts` (Zod env validation), `constants.ts` (`PAGE_SIZE = 24`, `MAX_NOTES = 500`, `PROPERTY_IMAGE_BUCKET`, etc.).

---

## Hard Rules

1. **Zero `any` types** — use `unknown` and narrow, or fix the type.
2. **No Supabase calls in React** — use `src/api/` with TanStack Query.
3. **Tailwind only** — no inline styles, no CSS Modules, no styled-components.
4. **No FK constraints** in Postgres.
5. **Named exports everywhere** except page components and `main.tsx`.
6. **No try/catch** unless you are specifically handling the error; let global handlers catch the rest.
7. **No refactoring outside current task scope.**
8. **Context window rule:** if usage exceeds 85%, stop — write a `## Session Summary` (files changed) and `## Resume From` (next task), then end the response.

---

## Code Style

- Enums: `const` objects + union types (not TypeScript `enum` keyword).
- `as` type assertions only when interfacing with untyped third-party libs; add a comment explaining why.
- Functions with more than 4 params take a params object.
- No nested ternaries.
- Event handlers named `handleX`; prop names use `onX`.
- File max ~300 lines — extract logic into a custom hook if a component mixes complex state and heavy JSX.
- Constants in `packages/config/src/constants.ts` if shared, top of module file if local.

---

## Git Standards

Branch model: `main` (production) → `develop` (staging) → `feature/*`, `fix/*`, `chore/*`, `hotfix/*`.

Commits follow Conventional Commits: `feat(search): add radius filter`.  
Valid types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `perf`, `ci`.  
Scopes match module names: `search`, `listing`, `map`, `auth`, `collections`, `alerts`, `suburb`, `finance`, `agents`, `dashboard`, `api`, `types`, `config`.

PRs: squash-merge into `develop`; one feature/fix per PR; minimum 1 approval.

---

## Phase 2 (In Progress)

### All decisions locked — see docs/DECISIONS-LOCKED.md

### Map change
MapLibre GL JS replaces Mapbox GL JS.
VITE_MAPTILER_KEY (MapTiler, free) replaces VITE_MAPBOX_TOKEN.
Import from @/lib/map, NOT @/lib/mapbox (deleted).

### New DB tables (migration 010_phase2.sql)
property_price_history, offers, recently_viewed, agent_certifications

### New routes
/become-an-agent, /agent/:slug (full), /agency/:slug (new),
/account/history, /account/enquiries, /account/offers,
/dashboard/offers, /dashboard/analytics

### Agent approval flow
pending_agent → admin panel "Approve" → agent
POST /agents/apply creates agent row + sets profile.role = 'pending_agent'
PATCH /admin/agents/:id/approve flips to 'agent' + sends email

---

## Key Reference Docs

| Doc | Contents |
|---|---|
| `docs/SKILL.md` | What Claude can do in this repo — read before starting any task |
| `docs/PRD.md` | Product requirements |
| `docs/database-schema.md` | Full PostgreSQL schema with enums and RLS |
| `docs/folder-structure.md` | Complete directory tree |
| `docs/task.md` | Task queue across all 10 phases |
| `docs/phase-0-setup.md` … `docs/phase-5-to-10.md` | Session-by-session work breakdown |
| `docs/design.md` | Design tokens (colors, spacing, typography, shadows) |
| `docs/naming-conventions.md` | File, variable, and route naming rules |
| `docs/coding-standards.md` | Full code standards with examples |
| `docs/git-standards.md` | Branch, commit, and PR rules |
