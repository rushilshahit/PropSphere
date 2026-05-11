# Phase 0 Prompt — Project Setup
# Paste _shared-context.md above this, then use this section.

---

## Phase Goal
Running monorepo. Local Supabase with all migrations applied. 10 Ahmedabad listings seeded. CI green. `pnpm dev` starts both apps.

## Session 0-A — Monorepo Scaffold + Packages

### Task
Scaffold the full monorepo skeleton. Create all package.json files, tsconfig files, Turborepo config, and the three shared packages with their type definitions.

### Deliver in this order

**1. Root config**
- `package.json` (pnpm workspace root, scripts: dev/build/lint/typecheck/test)
- `turbo.json` (pipeline: build→test→lint, dev parallel)
- `.gitignore`
- `pnpm-workspace.yaml`

**2. `packages/types/src/`** — create all interfaces
- `property.ts` — `PropertyType`, `ListingType`, `ListingStatus`, `SaleMethod`, `PropertySummary`, `PropertyDetail`, `PropertyMapPin`, `PropertyImage`
- `agent.ts` — `Agent`, `Agency`
- `suburb.ts` — `Suburb`, `SuburbStats`
- `user.ts` — `UserRole`, `Profile`
- `collection.ts` — `Collection`, `CollectionProperty`
- `enquiry.ts` — `Enquiry`, `EnquiryStatus`, `CreateEnquiryInput`
- `search.ts` — `SearchFilters`, `SearchResult<T>`, `BoundingBoxQuery`
- `index.ts` — re-export all
- `package.json` + `tsconfig.json`

**3. `packages/utils/src/`**
- `format-price.ts` — `formatPrice(amount: number): string` → "₹45 L" / "₹1.2 Cr"
- `format-address.ts` — `formatAddress(unit, street_number, street_name, suburb, state): string`
- `calc-repayment.ts` — `calcMonthlyRepayment(principal, annualRate, termYears): number`
- `calc-stamp-duty.ts` — `calcStampDuty(state: string, value: number): number` (Gujarat rate)
- `index.ts` — re-export all
- `package.json` + `tsconfig.json`

**4. `packages/config/src/`**
- `constants.ts` — `PAGE_SIZE = 24`, `MAX_NOTES_LENGTH = 500`, `MAX_SEARCH_HISTORY = 20`, `PROPERTY_IMAGE_BUCKET = 'property-media'`
- `env.schema.ts` — Zod schemas for frontend env and backend env
- `index.ts`
- `package.json` + `tsconfig.json`

### Reference
- `docs/database-schema.md` for exact column names and types
- `docs/folder-structure.md` for package.json paths and aliases

### End state check
`pnpm typecheck` passes across all packages with zero errors.

---

## Session 0-B — Frontend Scaffold

### Task
Scaffold `apps/web` with all config, install all dependencies, set up Tailwind with design tokens, global styles, and the app shell.

### Deliver in this order

**1. Vite + React setup**
- `apps/web/package.json` — all deps listed in execution plan Phase 0
- `apps/web/vite.config.ts` — path alias `@/` → `src/`, `@propsphere/*` → packages
- `apps/web/tsconfig.json` — strict mode, path aliases
- `apps/web/index.html` — Inter font from Bunny Fonts CDN
- `apps/web/src/main.tsx`

**2. Tailwind**
- `apps/web/tailwind.config.ts` — full token extension from `.claude/design.md`
- `apps/web/src/styles/globals.css` — base reset + shimmer keyframe + heart-pop keyframe

**3. App shell**
- `apps/web/src/App.tsx` — providers wrapper (QueryProvider, Redux, AuthProvider, ToastProvider, Router)
- `apps/web/src/router.tsx` — all route definitions with React.lazy imports (stubs for now):
  - `/` HomePage
  - `/buy` `/rent` `/sold` SearchResultsPage
  - `/:listingType/:id` ListingPage
  - `/map` MapView
  - `/suburb/:state/:slug` SuburbPage
  - `/agent/:slug` AgentPage
  - `/finance` FinancePage
  - `/account/*` AccountLayout (protected)
  - `/dashboard/*` DashboardLayout (protected, agent only)
- `apps/web/src/store/index.ts` — Redux store with rootReducer stub
- `apps/web/src/lib/supabase.ts` — createClient with VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
- `apps/web/src/lib/queryClient.ts` — TanStack QueryClient config (staleTime 30s, retry 1)
- `apps/web/src/components/providers/` — QueryProvider, AuthProvider (stub), ToastProvider
- `apps/web/src/components/layout/AppShell.tsx` — Header + Outlet + Footer stub
- `apps/web/src/components/layout/Header.tsx` — logo + nav (Buy/Rent/Sold) + auth buttons
- `apps/web/.env.example`

### Reference
- `.claude/design.md` for exact Tailwind token values
- `docs/folder-structure.md` for all paths

### End state check
`pnpm dev --filter=web` runs without errors. Browser shows the app shell.

---

## Session 0-C — Backend Scaffold + DB Migrations

### Task
Scaffold `apps/api`, create all database migration files, create the seed script.

### Deliver in this order

**1. NestJS scaffold**
- `apps/api/package.json` — all deps
- `apps/api/tsconfig.json` — strict mode
- `apps/api/nest-cli.json`
- `apps/api/src/main.ts` — bootstrap with CORS, global pipe (ZodValidationPipe), rate limit, global exception filter
- `apps/api/src/app.module.ts` — import all modules
- `apps/api/src/config/configuration.ts` — ConfigService setup
- `apps/api/src/database/supabase.service.ts` — admin client
- `apps/api/src/common/guards/auth.guard.ts`
- `apps/api/src/common/decorators/current-user.decorator.ts`
- `apps/api/src/common/decorators/roles.decorator.ts`
- `apps/api/src/common/guards/roles.guard.ts`
- `apps/api/src/common/pipes/zod-validation.pipe.ts`
- `apps/api/src/common/filters/http-exception.filter.ts`
- `apps/api/src/common/interceptors/transform.interceptor.ts`
- `apps/api/.env.example`

**2. Database migrations** (in `scripts/migrations/`)
- `001_extensions.sql` — uuid-ossp, postgis
- `002_enums.sql` — all enum types from schema
- `003_functions.sql` — `set_updated_at()` function
- `004_tables.sql` — all 15 tables in dependency order (profiles first, then agencies, agents, suburbs, properties, ...)
- `005_triggers.sql` — `trg_properties_fts`, all `updated_at` triggers
- `006_indexes.sql` — all indexes
- `007_rls.sql` — all RLS policies
- `008_rpc.sql` — `search_properties_radius` RPC function

**3. Seed script**
- `scripts/seed.ts` using Faker.js + `@supabase/supabase-js`
- Creates: 1 agency, 2 agents, 10 suburbs (Ahmedabad areas), 10 properties (1 per suburb), 2–4 images per property, 1–2 inspections per property, 3 schools spread across suburbs
- All `created_at` backdated 1–30 days randomly
- Realistic INR prices: apartments ₹40L–₹1.5Cr, houses ₹80L–₹3Cr, land ₹25L–₹80L
- Run with: `npx ts-node scripts/seed.ts`

### Reference
- `docs/database-schema.md` — exact DDL

### End state check
`npx supabase db push` applies all migrations.
`npx ts-node scripts/seed.ts` inserts 10 properties.
`pnpm dev --filter=api` starts on port 3001.

---

## Session 0-D — CI + Lint Config

### Task
ESLint, Prettier, Husky, lint-staged, GitHub Actions CI.

### Deliver
- `.eslintrc.js` (root) — TS strict rules, React hooks rules, no-any rule
- `.prettierrc` — single quotes, no semi, 2 space indent, 100 char width
- `apps/web/.eslintrc.js` — extends root, React-specific
- `apps/api/.eslintrc.js` — extends root, NestJS-specific
- `.husky/pre-commit` — runs lint-staged
- `.lintstagedrc.js` — lint + typecheck on staged files
- `.github/workflows/ci.yml`:
  - Trigger: push to main/develop, PR to main/develop
  - Jobs: lint → typecheck → test (pnpm turbo for all three)
  - Node 20, pnpm 8 cache

### End state check
`pnpm lint` passes. `pnpm typecheck` passes. CI workflow file is valid YAML.
