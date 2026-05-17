# SHARED CONTEXT — Phase 2 (All Decisions Locked)
# Paste at TOP of every Phase 2 Claude session.

---

## Project
PropSphere — real estate marketplace (realestate.com.au clone).
GitHub: github.com/rushilshahit/PropSphere
Market: Indian / Ahmedabad · INR pricing · Vite SPA (no SSR).
Phase 1 complete. Phase 2 in progress.

## Monorepo Structure
```
apps/
  web/    React 18 + Vite + TS strict + Tailwind + Redux RTK + TanStack Query v5
  api/    NestJS 10 + Supabase (Postgres + Auth + Storage)
  admin/  Separate Vite SPA (port 3002), role=admin only
packages/
  types/  @propsphere/types
  utils/  @propsphere/utils
  config/ constants, Zod env schemas
docs/     all .md files
```

## Locked Decisions (Phase 2)

| Decision | Choice |
|---|---|
| Maps | MapLibre GL JS + MapTiler tiles (replaces Mapbox, free) |
| Map tiles | MapTiler — VITE_MAPTILER_KEY replaces VITE_MAPBOX_TOKEN |
| Agent approval | pending_agent → admin approves → agent |
| Virtual tour | URL embed (iframe, sandboxed) — YouTube/Matterport |
| Price history | Internal accumulation + seeded fake records for dev |
| Recently viewed | localStorage guests + sync to DB on login (last 20) |
| Offer management | Simple: {propertyId, amount, message, name, email} only |
| Agent reviews | OUT OF SCOPE — not in Phase 2 |

## Stack (Phase 2 map change)
Maps: react-map-gl (unchanged) + maplibre-gl (replaces mapbox-gl)
Map style: `https://api.maptiler.com/maps/streets/style.json?key=${VITE_MAPTILER_KEY}`
Satellite: `https://api.maptiler.com/maps/satellite/style.json?key=${VITE_MAPTILER_KEY}`
Draw area: maplibre-gl-draw (replaces @mapbox/mapbox-gl-draw)
Map utils: import from @/lib/map (NOT @/lib/mapbox — that file is deleted)

## Hard rules (unchanged)
- Zero `any` types
- No FK constraints in Postgres — plain UUID columns with comments
- Tailwind only — no inline styles, no CSS Modules
- Named exports only (except page components and main.tsx)
- No Supabase calls inside React components — use api/ layer
- No try/catch unless handling the error specifically
- TanStack Query = server state · Redux = UI state (filters, map viewport, modals)
- Read existing file before editing it — never rewrite what already works

## Token rule
If context window > 85%: STOP immediately.
Write: ## Session Summary (files created/edited) + ## Resume From (next task).
End the response. Start fresh next session.

## Git rule (see _git-workflow.md for full details)
Every session: `git checkout develop && git pull && git checkout -b feature/<branch-name>`.
Commit after each logical unit — one file or one feature, never bundle everything.
Stage specific files only: `git add <file>` — never `git add .`
End of session: print ## Git Summary block (commits made + PR title + files changed).

## Test rule (see _test-cases-phase2.md for full specs)
Every new function, component, and endpoint gets a test file alongside the source.
Frontend: Vitest + React Testing Library → `ComponentName.test.tsx`, `hook.test.ts`
Backend:  Jest → `service.spec.ts`, `controller.spec.ts`
E2E:      Playwright → `e2e/phase2/<feature>.spec.ts`
Run `pnpm test` before the ## Git Summary block. Fix failing tests before committing.
Coverage target: > 80% on all new Phase 2 code.

## Phase 2 DB additions (migration 010_phase2.sql — assume applied)
New columns on properties:
  virtual_tour_url TEXT, bhk_config TEXT, feature_order SMALLINT,
  sold_price_is_confidential BOOLEAN DEFAULT FALSE, under_contract_at TIMESTAMPTZ

listing_status enum now includes: 'under_contract'

New tables:
  property_price_history, offers, recently_viewed, agent_certifications

agents: + is_verified BOOLEAN, verified_at TIMESTAMPTZ, license_doc_url TEXT, slug TEXT
agencies: + slug TEXT
profiles: + pending_agent_since TIMESTAMPTZ

## Color system (REA — unchanged from Phase 1)
brand-primary: #E5001A · brand-secondary: #007A78
neutral-900: #1C1C1C · body: #444444 · secondary: #6F6F6F
border: #DDDDDD · page-bg: #F7F7F7 · card-bg: #FFFFFF
rounded-card: 8px · rounded-btn: 4px · rounded-badge: 4px

## Key paths
apps/web/src/features/sold/          NEW — sold search + sold detail
apps/web/src/features/agent-signup/  NEW — /become-an-agent wizard
apps/web/src/features/offers/        NEW — offer submit + history
apps/web/src/features/agency/        NEW — /agency/:slug profile
apps/web/src/features/suburb/        EXISTS — wire stub to real data
apps/web/src/features/dashboard/     EXISTS — wire all stubs

## Phase 2 new routes
/become-an-agent    agent self-signup wizard
/agent/:slug        agent profile (full — was stub)
/agency/:slug       agency profile (new)
/account/history    recently viewed properties
/account/enquiries  enquiry history
/account/offers     offer history (buyer)
/dashboard/offers   agent offer inbox
/dashboard/analytics agent performance analytics
