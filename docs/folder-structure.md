# Folder Structure

> This file describes the structure as it actually exists in the repo. If you add/remove/move a folder, update this file in the same PR.

## Monorepo Root

```
propsphere/
├── apps/
│   ├── web/                    # React frontend (Vite + React 18) — public-facing site
│   ├── api/                    # NestJS backend
│   └── admin/                  # React frontend (Vite + React 18) — internal admin panel
├── packages/
│   ├── types/                  # Shared TypeScript interfaces
│   ├── utils/                  # Shared pure utility functions
│   └── config/                 # Shared Zod schemas, constants, env validation
├── docs/                       # Project documentation (MD files) + docs/assets/ (brand/logo files)
├── scripts/                    # DB migrations (NNN_description.sql) + seed.js/migrate.js
├── .claudeignore
├── .gitignore
├── package.json                # Workspace root
├── turbo.json                  # Turborepo config
└── CLAUDE.md                   # Main project context for Claude (repo root)
```

`docs/SKILL.md` is what tells Claude what it's capable of doing in this repo — read it before starting any task. There is no separate `.claude/` directory; all AI-tooling docs (`SKILL.md`, `coding-standards.md`, `naming-conventions.md`, `git-standards.md`, `vibe-coding.md`, `token-saving.md`, `design.md`, `task.md`) live directly under `docs/`.

---

## Frontend: `apps/web/`

Feature modules follow this shape (not every feature uses every subfolder — most have `components/` + `pages/`; only some need `store/` or a feature-local `utils/`):
```
features/{feature}/
├── components/
├── hooks/
├── store/          # only if the feature owns Redux UI state
├── utils/          # only if the feature has feature-local pure helpers
├── pages/          # default export only; lazy-loaded from router.tsx
├── types.ts
└── index.ts
```

**Feature folders under `src/features/` (17):**

| Feature | Purpose | Has `store/` |
|---|---|---|
| `home` | Landing page | |
| `search` | Search results, filters, map/list toggle | ✓ (+ `utils/`) |
| `listing` | Property detail page, enquiry, commute calculator | |
| `map` | Map view, markers, clustering, layer toggles | ✓ |
| `sold` | Sold-property search (separate from live search) | |
| `suburb` | Suburb profile pages (price trends, demographics, schools) | |
| `collections` | Saved properties, compare drawer | ✓ |
| `auth` | Login, register, forgot/reset password | ✓ |
| `agent` | Public agent profile pages | |
| `agency` | Public agency profile pages (separate from `agent`) | |
| `agent-signup` | "Become an agent" multi-step wizard (`AgentSignupStepper`) | |
| `owner-listing` | Owner "post a property" flow — create/edit listing, invite an agent | |
| `offers` | `OfferModal` (buyer-side offer submission) | |
| `account` | Signed-in user pages: recently viewed, enquiry history, offer history, my listings | |
| `alerts` | Saved-search alerts, notification centre | |
| `finance` | Repayment, borrow-capacity, stamp-duty calculators (client-side only) | |
| `dashboard` | Agent/seller dashboard — listing management, analytics, enquiries inbox | |

**`src/components/`:**
```
components/
├── ui/                 # Primitives — Badge, Button, Dropdown, Input, RangeSlider,
│                        # Skeleton, Spinner, Tabs, index.ts (barrel)
├── layout/              # AppShell, Header, Footer, ProtectedRoute
├── providers/            # AuthProvider, QueryProvider, ToastProvider
└── ErrorBoundary.tsx
```

**`src/lib/`** (third-party client wrappers):
```
lib/
├── supabase.ts       # Supabase client init
├── map.ts            # MapLibre/MapTiler config — MAP_STYLE_STREETS, MAP_STYLE_SATELLITE,
│                      # DEFAULT_VIEWPORT, MAPTILER_KEY (there is no mapbox.ts — deleted in Phase 2)
├── google-maps.ts     # Google Maps usage (directions/commute calculator, via @vis.gl/react-google-maps)
├── queryClient.ts     # TanStack Query client
├── analytics.ts       # PostHog
└── cn.ts              # className merge helper
```

**`src/api/`** (TanStack Query hooks, 14 files): `account.ts`, `agencies.ts`, `agents.ts`, `collections.ts`, `enquiries.ts`, `home.ts`, `maps.ts`, `media.ts`, `notifications.ts`, `offers.ts`, `overpass.ts`, `owner-listings.ts`, `properties.ts`, `suburbs.ts`

**`src/store/`:** `index.ts`, `rootReducer.ts`, `hooks.ts` (typed `useAppDispatch`/`useAppSelector`)

**Other top-level:** `src/hooks/useDebounce.ts` (cross-feature hooks), `src/types/index.ts` (frontend-only supplementary types), `src/styles/`, `src/test/setup.ts`, plus `App.tsx`, `main.tsx`, `router.tsx` at `src/` root.

```
apps/web/
├── public/
├── src/                 # see above
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Backend: `apps/api/`

**Modules under `src/modules/` (17):** `admin`, `agencies`, `agents`, `alerts`, `collections`, `enquiries`, `home`, `listing-invitations`, `maps`, `notifications`, `offers`, `owner-listings`, `properties`, `saved-searches`, `schools`, `suburbs`, `users`

Each module generally follows: `{module}.module.ts`, `{module}.controller.ts`, `{module}.service.ts`, `dto/`, and a `{module}.service.spec.ts` where present (e.g. `enquiries`, `listing-invitations`, `owner-listings`).

There is **no top-level `src/jobs/` folder**. Background job processors live inside their owning module, e.g. `modules/alerts/alerts.processor.ts` (BullMQ). Follow that pattern for new jobs rather than creating a separate `jobs/` directory.

`properties.search.service.ts` does not exist — there is no Typesense integration anywhere in this codebase. Search filter-building logic lives directly in `properties.service.ts` using Postgres FTS.

The `admin` module (`admin.controller.ts`, `admin.service.ts`, `guards/admin.guard.ts`) provides the backend for the separate `apps/admin` frontend — apply `admin.guard.ts` (not the generic `RolesGuard`) to admin-only routes.

```
apps/api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   └── configuration.ts        # Env config via @nestjs/config
│   ├── common/
│   │   ├── decorators/              # current-user.decorator.ts, roles.decorator.ts
│   │   ├── guards/                  # auth.guard.ts, roles.guard.ts
│   │   ├── interceptors/            # transform.interceptor.ts
│   │   ├── filters/                 # http-exception.filter.ts
│   │   └── pipes/                   # zod-validation.pipe.ts
│   ├── database/
│   │   └── supabase.service.ts     # Supabase admin client
│   └── modules/                    # 17 modules — see table above
├── test/                           # e2e specs
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
└── package.json
```

---

## Admin: `apps/admin/`

A **separate** deployed app — its own Vite build, router, and Redux store, not a route inside `apps/web`. Gated to `profile.role === 'admin'` via `AdminRoute`. See `docs/admin-panel.md` for the full feature spec.

**Feature folders under `src/features/` (12):** `dashboard`, `properties`, `agencies`, `agents`, `users`, `suburbs`, `schools`, `enquiries`, `notifications`, `media`, `featured`, `analytics`, plus `auth` (has its own `store/`). Most contain only `pages/`; `properties` also has `components/`.

```
apps/admin/
├── src/
│   ├── main.tsx → App.tsx → router.tsx   # createBrowserRouter, lazy-loaded routes
│   ├── features/                          # see above — routes nested under AdminRoute → AdminShell
│   ├── components/
│   │   ├── layout/          # AdminRoute, AdminShell, Header, Sidebar
│   │   ├── providers/        # AuthProvider, QueryProvider, ToastProvider
│   │   └── ui/               # Badge, Button, Card, Input, Modal, Pagination, Select,
│   │                          # Spinner, Table, index.ts — a DIFFERENT, smaller primitive
│   │                          # set than apps/web (no Dropdown/RangeSlider/Skeleton/Tabs)
│   ├── lib/                  # cn.ts, csv.ts (CSV export, admin-only), queryClient.ts, supabase.ts
│   ├── store/                # index.ts, rootReducer.ts, hooks.ts
│   ├── api/
│   │   └── admin.ts          # single API file — admin does NOT split per-feature like apps/web
│   └── styles/
│       └── globals.css
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

Do not cross-import `components/ui/` between `apps/web` and `apps/admin` — they are independent primitive sets that happen to share names.

---

## Shared Packages: `packages/`

```
packages/
├── types/src/
│   ├── property.ts
│   ├── agent.ts
│   ├── suburb.ts
│   ├── user.ts
│   ├── collection.ts
│   ├── enquiry.ts
│   ├── search.ts
│   ├── alert.ts
│   ├── offers.ts
│   ├── owner-listing.ts
│   ├── price-history.ts
│   └── index.ts
│
├── utils/src/
│   ├── format-price.ts
│   ├── format-address.ts
│   ├── calc-stamp-duty.ts
│   ├── calc-repayment.ts
│   ├── calc-borrow-capacity.ts
│   └── index.ts
│
└── config/src/
    ├── env.schema.ts       # Zod env validation
    ├── constants.ts        # App-wide constants
    └── index.ts
```

---

## `docs/` Directory (AI-tooling + project docs)

```
docs/
├── SKILL.md             # What Claude can do in this repo — read first
├── coding-standards.md
├── naming-conventions.md
├── git-standards.md
├── vibe-coding.md
├── token-saving.md
├── design.md
├── task.md
├── folder-structure.md  # this file
├── database-schema.md
├── admin-panel.md
├── architecture.md
├── mentor-guide.md
├── assets/
│   └── logo/             # brand assets (moved out of apps/ — apps/ is for deployable apps only)
├── phase-*.md             # session-by-session task breakdowns
└── PRD*.md, DECISIONS-LOCKED.md, etc.
```
