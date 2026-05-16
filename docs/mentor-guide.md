# PropSphere — Mentor Guide
## The Short Document Every Developer Should Read First

---

## What Is This Project?

PropSphere is a **real estate marketplace** for India — think realestate.com.au but built for Ahmedabad (seed market). Users can search, filter, and save properties; agents can list and manage them; buyers can set price alerts and compare listings.

It is a **greenfield project** being built from scratch using a structured, phase-by-phase plan across 10 development phases.

---

## The Tech Stack — And Why

| Concern | Choice | Why |
|---|---|---|
| Frontend | React 18 + Vite (SPA) | Fast iteration; no SSR needed for a marketplace |
| Styling | Tailwind CSS v3 | Utility-first; zero context-switching from JSX to CSS files |
| Server state | TanStack Query v5 | Best-in-class for caching, background refetch, pagination |
| UI state | Redux Toolkit | Predictable; DevTools; great for complex filter + map state |
| Forms | react-hook-form + Zod | Type-safe forms with minimal re-renders |
| Maps | Mapbox GL JS | Supports clustering, draw-area, and custom layers |
| Backend | NestJS 10 | Structured DI, decorator-based, scales well |
| Database | Supabase (Postgres) | Managed Postgres + Auth + Storage in one; RLS out of the box |
| Search | Postgres FTS | No extra service to run; `tsvector` + GIN is enough for this scale |
| Auth | Supabase Auth | Google OAuth + email, JWT, works with RLS |
| Queue | BullMQ + Redis | Reliable job queue for alerts and nightly crons |
| Email | Resend | Simple API, great DX |
| Push | Firebase FCM | Industry standard for mobile/web push |
| Analytics | PostHog | Open-source, self-hostable, event-based |
| Monorepo | Turborepo + pnpm | Shared types/utils between frontend and backend without duplication |
| Deploy | Vercel (web) + Railway (api) | Zero-config deploys for both |

---

## The Mental Model — How The Pieces Fit

```
Browser
  └─► React SPA
        ├─► TanStack Query ────────────► NestJS API ────► Supabase Postgres
        ├─► Redux (UI state)             │
        └─► Mapbox GL                    └─► BullMQ ─────► Redis (jobs)
                                         └─► Resend / FCM (notifications)

Shared Code
  └─► @propsphere/types    ← TypeScript interfaces used by both apps
  └─► @propsphere/utils    ← Pure utility functions (formatters, calculators)
  └─► @propsphere/config   ← Env schemas (Zod), shared constants
```

The golden rule: **TanStack Query owns all server state. Redux owns all UI state.** Nothing goes in both.

---

## The 10 Features (What Gets Built)

| Feature | What It Does |
|---|---|
| **Search** | Filter properties by type, price, beds, location, radius; infinite scroll |
| **Listing** | Property detail page: photos, floorplan, stats, virtual tour, enquiry form |
| **Map** | Full-screen map view; marker clusters; draw-area search |
| **Auth** | Email + Google sign-in; profile management |
| **Collections** | Save/unsave properties; organised lists; compare mode (3 properties side-by-side) |
| **Alerts** | Set price alerts on specific listings; saved searches with email notifications |
| **Suburb** | Suburb profile: median prices, charts, schools, demographics |
| **Finance** | Client-side calculators: repayment, borrowing capacity, stamp duty (Indian states) |
| **Agent** | Agent dashboard: manage listings, track enquiries, lead pipeline |
| **Dashboard** | Buyer/owner dashboard: saved properties, alert history, enquiry tracking |

---

## The 10-Phase Build Plan

| Phase | Goal |
|---|---|
| 0 | Monorepo scaffold, DB migrations, seed data |
| 1 | Core search — filters, infinite scroll, result grid |
| 2 | Listing detail page — photos, stats, enquiry form |
| 3 | Map view — Mapbox, clusters, draw-area search |
| 4 | Auth + collections + compare mode |
| 5 | Alerts + saved searches |
| 6 | Suburb profiles + charts |
| 7 | Finance calculators |
| 8 | Agent dashboard + listing wizard |
| 9 | Performance, polish, analytics |
| 10 | Deploy to Vercel + Railway + smoke tests |

---

## The Most Important Architectural Decisions

### 1. No Supabase in React Components

Every DB/API call goes through `src/api/*.ts` hooks using TanStack Query. React components never import Supabase directly.

```
Component → usePropertySearch() → GET /api/v1/properties → NestJS → Supabase
                                      NOT
Component → supabase.from('properties').select() ← WRONG
```

### 2. Controllers Route, Services Think

In NestJS, the controller is a traffic director — it validates the input and hands it to the service. All real logic (queries, transformations, business rules) lives in the service.

### 3. Types Flow From One Place

`@propsphere/types` is the single source of truth. If `PropertySummary` needs a new field, you add it there, and both the API response mapper and the React component that renders it update from the same definition.

### 4. Postgres FTS — Not Typesense

The project started with Typesense but switched to Postgres Full-Text Search. This means all search happens via `tsvector` + GIN index inside Supabase. There is no Typesense client, schema, or sync anywhere in this codebase.

### 5. No FK Constraints

Postgres tables deliberately have no foreign key constraints. Referential integrity is enforced by the application layer (services) and by Supabase RLS policies. Migrations should never add FK constraints.

---

## The Code Rules That Matter Most

| Rule | Why |
|---|---|
| Zero `any` types | Type safety is the whole point of TypeScript strict mode |
| Named exports everywhere (except pages) | Easier to find, tree-shake, and refactor |
| Tailwind only | No style mixing; reviewers only need to read JSX |
| No try/catch unless handling | Let NestJS global filter / TanStack Query handle errors gracefully |
| No nested ternaries | Kills readability; use `if` or a helper function |
| File max ~300 lines | If it's longer, it's doing too much |
| Constants in config package | No magic numbers anywhere in component or service code |

---

## Navigating the Docs

| Start with | When |
|---|---|
| `CLAUDE.md` (root) | Every session — project overview and hard rules |
| `docs/mentor-guide.md` | **This file** — read once to get oriented |
| `docs/architecture.md` | Understand how the systems connect |
| `docs/_shared-context.md` | Paste at the top of every phase prompt to Claude |
| `docs/task.md` | See what's done and what's next |
| `docs/phase-X-Y.md` | Detailed session-by-session tasks for that phase |
| `docs/coding-standards.md` | Before writing any code |
| `docs/naming-conventions.md` | Before creating any file |
| `docs/database-schema.md` | Before any DB query or migration |
| `docs/figma-prompt.md` | Before building any UI component |
| `docs/vibe-coding_v2.md` | How to prompt Claude effectively |
| `docs/token-saving.md` | How to keep Claude sessions efficient |

---

## Common Pitfalls to Avoid

1. **Putting server data in Redux** — use TanStack Query for anything from the API
2. **Calling Supabase from a React component** — always go through `src/api/`
3. **Writing business logic in a NestJS controller** — that belongs in the service
4. **Using the `any` type** — narrow with `unknown` or fix the type properly
5. **Adding FK constraints to migrations** — explicitly not allowed in this project
6. **Using Typesense** — the project switched to Postgres FTS; there is no Typesense setup
7. **Inline styles or CSS Modules** — Tailwind only, always
8. **Default exports on non-page components** — breaks tree-shaking and discoverability
9. **One mega-session** — split work at logical boundaries; use `task.md` to track progress
10. **Pasting whole files into Claude** — reference by path instead; saves tokens and keeps responses focused

---

## Key Numbers and Constants

| Constant | Value | Where |
|---|---|---|
| `PAGE_SIZE` | 24 | `@propsphere/config` |
| `MAX_NOTES` | 500 | `@propsphere/config` |
| `PROPERTY_IMAGE_BUCKET` | `property-media` | `@propsphere/config` |
| Price format | ₹45 L / ₹1.2 Cr | `formatPrice()` in `@propsphere/utils` |
| Card radius | 12px | `rounded-card` (Tailwind extension) |
| Button radius | 8px | `rounded-btn` (Tailwind extension) |

---

## Seed Data (Dev)

10 Ahmedabad properties across suburbs:
Navrangpura · Satellite · Bopal · Vastrapur · Prahlad Nagar · SG Highway · Thaltej · Gota · Chandkheda · Maninagar

Includes: 1 agency, 2 agents, 10 suburb rows, 3 schools per suburb, realistic INR pricing (₹25L–₹3Cr).

Run with: `pnpm seed`
