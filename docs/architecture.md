# System Architecture
## PropSphere

---

## Bird's-Eye View

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser (SPA — Vite)                        │
│   React 18 · TanStack Query · Redux · Mapbox GL JS · Recharts   │
└──────────────────────────┬──────────────────────────────────────┘
                           │  HTTPS REST  /api/v1/*
┌──────────────────────────▼──────────────────────────────────────┐
│                   NestJS API (Railway)                          │
│   AuthGuard · ZodValidationPipe · SupabaseService               │
│   BullMQ workers: alert-matching · price-drop · suburb-stats    │
└──────────┬────────────────┬──────────────────┬──────────────────┘
           │                │                  │
  ┌────────▼────────┐ ┌─────▼──────┐ ┌────────▼──────────┐
  │   Supabase      │ │   Redis    │ │  Resend / Firebase │
  │   Postgres      │ │  (BullMQ)  │ │  FCM (push)        │
  │   Auth (JWT)    │ └────────────┘ └───────────────────┘
  │   Storage(WebP) │
  └─────────────────┘
          ▲
          │  Direct (anon key, RLS)
  ┌───────┴──────────┐
  │  Supabase Auth   │  ← OAuth / email sign-in handled here
  └──────────────────┘
```

**Vercel** serves the compiled SPA bundle. **Railway** runs the NestJS process + BullMQ workers.

---

## Frontend Architecture

### State Split (The Most Important Rule)

```
All state in the app belongs to exactly one of two stores:

  TanStack Query   ←   server state (anything that comes from an API call)
  Redux Toolkit    ←   UI state     (anything that drives the interface only)
```

| Lives In TanStack Query | Lives In Redux |
|---|---|
| Property search results | Active search filters |
| Listing detail data | Map viewport (lat/lng/zoom) |
| Agent profiles | Which modal is open |
| Collection items | Auth session token |
| Suburb stats | Sidebar open/closed |

Violating this split causes stale UI, double-fetches, or lost state on navigation.

### Data Flow — Search

```
User changes a filter in FilterPanel
  └─► dispatch(setFilters(newFilters))          [Redux — searchSlice.ts]
        └─► usePropertySearch(filters) re-runs  [TanStack Query — api/properties.ts]
              └─► GET /api/v1/properties         [NestJS API]
                    └─► Supabase FTS query        [Postgres tsvector + GIN]
                          └─► PropertySummary[]   [mapped via @propsphere/types]
                                └─► renders in SearchResultsGrid
```

### Feature Boundary

Each of the 10 features is a self-contained directory under `src/features/`:

```
search · listing · map · auth · collections · alerts · suburb · finance · agent · dashboard
```

A feature exposes its public API only through its `index.ts`. Other features should not reach into each other's internals.

### API Layer

`src/api/` is the only place allowed to make HTTP calls. Every file exports TanStack Query hooks:

```
src/api/
├── properties.ts     ← usePropertySearch, useProperty, useCreateEnquiry
├── agents.ts         ← useAgent, useAgentListings
├── collections.ts    ← useCollections, useToggleCollection
├── suburbs.ts        ← useSuburb, useSuburbStats
└── auth.ts           ← useSignIn, useSignOut, useCurrentUser
```

---

## Backend Architecture

### Request Lifecycle

```
HTTP Request
  └─► Global: CORS, rate-limiting, request-id header
        └─► Router → matches controller method
              └─► AuthGuard: verify Supabase JWT → inject AuthUser
                    └─► ZodValidationPipe: validate & transform DTO
                          └─► Controller: route only, no logic
                                └─► Service: business logic
                                      └─► SupabaseService: DB query
                                            └─► Map result → @propsphere/types
                                                  └─► JSON Response
```

### Module Dependency Graph

```
AppModule
├── ConfigModule (global) ─────── Zod env validation at startup
├── SupabaseModule (global) ────── admin client, available to all modules
│
├── AuthModule ─────────────────── sign-in, sign-out, refresh
├── PropertiesModule ───────────── FTS search, CRUD, image management
├── AgentsModule ───────────────── agent profiles, listings
├── SuburbsModule ──────────────── suburb data, stats, schools
│
├── EnquiriesModule ────────────── enquiry submission
│   └─► NotificationsModule
│
├── CollectionsModule ──────────── save / unsave properties
│
├── AlertsModule ───────────────── saved searches, alert dispatch
│   └─► BullMQ (alert-matching queue)
│   └─► NotificationsModule
│
├── NotificationsModule ────────── FCM push + Resend email
├── MediaModule ────────────────── Supabase Storage (upload, delete, transform)
└── SearchHistoryModule ────────── record + retrieve recent searches
```

---

## Database Architecture

### Schema Map (15 tables)

```
Identity:    profiles · agencies · agents
Property:    properties · property_images · inspections
Geography:   suburbs · schools
Engagement:  collections · collection_properties · enquiries
Alerts:      saved_searches · price_alerts · notifications
Tracking:    search_history
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| No FK constraints | Supabase RLS + application-level integrity. Avoids cascade complexity and migration pain |
| 3NF | Prevents data anomalies. Collections reference property IDs, not copies |
| Postgres FTS | `tsvector` + GIN index replaces Typesense. No external dependency, simpler ops |
| PostGIS | `ST_DWithin` for radius search on `properties.location` |
| Soft deletes | `status = 'archived'` on properties — no hard DELETE so history is preserved |
| RLS everywhere | Row-level security at the DB layer as last-resort enforcement |
| No FK constraints | (Repeated) — this means app code must validate referential integrity before writes |

### FTS Index

```sql
-- The search_vector column is computed and maintained by a trigger
ALTER TABLE properties ADD COLUMN search_vector tsvector;
CREATE INDEX idx_properties_fts ON properties USING GIN (search_vector);

-- Populated from: suburb_name, full_address, property_type, agent name
```

---

## Shared Packages

```
packages/
├── types/    (@propsphere/types)
│   └── Source of truth for every TypeScript interface
│       Used by both apps/web and apps/api
│       Key files: property.ts · agent.ts · suburb.ts · user.ts
│                  search.ts · collection.ts · enquiry.ts
│
├── utils/    (@propsphere/utils)
│   └── Pure functions only (no side-effects, no DB, no API)
│       formatPrice(45_00_000) → "₹45 L"
│       calcMonthlyRepayment({ principal, rate, termYears })
│       calcStampDuty({ state: 'GJ', price })
│       All functions have JSDoc + unit tests
│
└── config/   (@propsphere/config)
    └── Zod env schemas (validated at startup in both apps)
        Shared constants: PAGE_SIZE = 24, MAX_NOTES = 500
        Storage bucket names: PROPERTY_IMAGE_BUCKET, etc.
```

---

## Authentication Architecture

```
Sign-In Flow:
  User → Supabase Auth (email or Google OAuth)
    └─► Supabase issues JWT + refresh token
          └─► Frontend stores session in Redux authSlice
                └─► apiClient attaches Authorization: Bearer <JWT>
                      └─► NestJS AuthGuard calls supabase.auth.getUser(jwt)
                            └─► Injects AuthUser into route via @CurrentUser()

RLS (Supabase):
  Every table has RLS policies
  Policies use auth.uid() to scope reads/writes to the owning user
  NestJS also enforces ownership in service layer (defense in depth)
```

---

## Background Job Architecture

```
alert-matching (triggered per property insert):
  PropertiesService.create()
    └─► alertsQueue.add('match', { propertyId })
          └─► AlertMatchingProcessor
                └─► query saved_searches matching new property
                      └─► notificationsQueue.add per match
                            └─► FCM push + Resend email

price-drop (triggered per price update):
  PropertiesService.updatePrice()
    └─► priceDropQueue.add('notify', { propertyId, oldPrice, newPrice })
          └─► PriceDropProcessor
                └─► find users with property in their collections
                      └─► send FCM push + email

suburb-stats (nightly cron — @Cron('0 2 * * *')):
  SuburbStatsProcessor
    └─► GROUP BY suburb_id: median price, avg days on market
          └─► UPDATE suburbs SET median_price, avg_days_on_market
```

---

## Key Invariants

These are never broken, regardless of the feature being built:

1. All server state lives in TanStack Query — never in Redux
2. All UI state lives in Redux — never in TanStack Query cache
3. All DB access goes through `SupabaseService` — never a direct client in controllers
4. All TypeScript types flow from `@propsphere/types` — no duplicates across apps
5. Postgres FTS is the only search mechanism — no external search service
6. No FK constraints in Postgres — app enforces referential integrity
7. Page components use default export; everything else uses named exports
