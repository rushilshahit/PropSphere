# Task Queue
## PropSphere — Active Work

> `[ ]` open · `[x]` done · `[-]` in progress · `[~]` blocked

---

## Phase 0: Project Setup

- [ ] Init monorepo — Turborepo + pnpm workspaces
- [ ] Scaffold `apps/web` (Vite + React 18 + TS strict)
- [ ] Scaffold `apps/api` (NestJS 10)
- [ ] Create `packages/types`, `packages/utils`, `packages/config`
- [ ] Configure Tailwind + Inter font in `apps/web`
- [ ] Configure path aliases (`@propsphere/types`, `@propsphere/utils`)
- [ ] Set up Supabase project (local Docker + remote project)
- [ ] Run initial migrations (enums + all tables)
- [ ] Configure Supabase Auth (email + Google OAuth)
- [ ] Configure RLS policies
- [ ] Set up Redis (local Docker)
- [ ] Seed script: `scripts/seed.ts` — 10 Ahmedabad properties, 1 agency, 2 agents, 10 suburbs, schools
- [ ] ESLint + Prettier at workspace level
- [ ] Husky + lint-staged
- [ ] GitHub Actions CI (lint → typecheck → test)

---

## Phase 1: Core Search

- [ ] `SearchFilters` Redux slice + URL sync hook
- [ ] `usePropertySearch` TanStack Query hook (calls `GET /properties/search`)
- [ ] `SearchBar` component (location autocomplete via Postgres FTS on suburbs)
- [ ] `FilterPanel` component (price, beds, baths, type, features)
- [ ] `SortControls` component
- [ ] `PropertyCard` component
- [ ] `PropertyGrid` + infinite scroll (`useInfiniteQuery`)
- [ ] `SearchResultsPage`
- [ ] Backend: `GET /properties/search` (Postgres FTS + filters)
- [ ] Backend: `GET /suburbs/autocomplete` (FTS on suburb name/postcode)

---

## Phase 2: Listing Detail

- [ ] `useProperty` hook
- [ ] `PhotoGallery` (carousel + lightbox)
- [ ] `PropertyStats` row (beds/baths/car/land/build)
- [ ] `InspectionTimes` + `.ics` calendar export
- [ ] `AgentCard`
- [ ] `EnquiryModal` (react-hook-form + Zod)
- [ ] `FeaturesList` (grouped: indoor/outdoor/climate)
- [ ] `AuctionCountdown` (live countdown timer)
- [ ] `SoldHistory` section (sold_price + sold_at from seed data)
- [ ] `SimilarProperties` carousel
- [ ] Map embed on listing page (Mapbox, no draw)
- [ ] `ListingPage`
- [ ] Backend: `GET /properties/:id`
- [ ] Backend: `POST /enquiries` + Resend email to agent
- [ ] Backend: `PATCH /properties/:id/view-count` (fire-and-forget)

---

## Phase 3: Map View

- [ ] Mapbox GL JS setup in `apps/web/src/lib/mapbox.ts`
- [ ] `MapView` component (split view: list left, map right)
- [ ] `PropertyMarker` (price label pin)
- [ ] `PropertyPopup` (mini card on pin click)
- [ ] Cluster markers
- [ ] `LayerToggles` (schools, flood zone — flood zone deferred)
- [ ] Draw area search (`@mapbox/mapbox-gl-draw`)
- [ ] Current location button (Geolocation API)
- [ ] `mapSlice` Redux store (viewport, active pin, layers)
- [ ] Backend: `GET /properties/map` (bounding box lat/lng query)

---

## Phase 4: Auth + Collections

- [ ] Supabase Auth provider (`AuthProvider.tsx`)
- [ ] `useAuth` hook (session, user, loading)
- [ ] `LoginForm` + `RegisterForm`
- [ ] Google OAuth button + callback
- [ ] `ProtectedRoute` component
- [ ] `authSlice` Redux
- [ ] `SaveButton` (heart icon, toggle save)
- [ ] `SaveModal` (pick or create collection)
- [ ] `useCollections` TanStack Query hook
- [ ] `CollectionsPage` (list + property grid per collection)
- [ ] `CompareDrawer` (slide-up, 4-property side-by-side)
- [ ] Backend: `GET/POST/DELETE /collections`
- [ ] Backend: `GET/POST/DELETE /collections/:id/properties`
- [ ] Backend: `GET /collections/shared/:token` (public share)

---

## Phase 5: Alerts + Saved Searches

- [ ] `SaveSearchModal`
- [ ] `SavedSearchesPage` (list, edit freq, delete)
- [ ] `NotificationCentre` (bell icon, unread count, list)
- [ ] `AlertsPage`
- [ ] Backend: `GET/POST/DELETE /saved-searches`
- [ ] Backend: BullMQ `new-listing` job (match against saved searches)
- [ ] Backend: BullMQ `price-drop` job (check price_alerts)
- [ ] Backend: FCM push notification service
- [ ] Backend: Resend alert email templates

---

## Phase 6: Suburb Profiles

- [ ] `SuburbPage`
- [ ] `PriceTrendChart` (Recharts line, 12m/3y/5y tabs)
- [ ] `SuburbStats` header strip
- [ ] `SchoolsList` (nearby schools, sorted by distance)
- [ ] Backend: `GET /suburbs/:state/:slug`
- [ ] Backend: nightly BullMQ cron — refresh suburb median stats
- [ ] Seed 10 suburb rows with Ahmedabad data

---

## Phase 7: Finance Tools

- [ ] `packages/utils/src/calc-repayment.ts` + tests
- [ ] `packages/utils/src/calc-borrow-capacity.ts` + tests
- [ ] `packages/utils/src/calc-stamp-duty.ts` + tests (Indian states)
- [ ] `RepaymentCalculator` component
- [ ] `BorrowCapacityCalculator` component
- [ ] `StampDutyCalculator` component
- [ ] `FinancePage` (three tabs, no API calls — all client-side)

---

## Phase 8: Agent Dashboard

- [ ] Dashboard layout + sidebar nav
- [ ] `ListingWizard` (6-step form):
  - Step 1: Property address + type
  - Step 2: Photo upload (drag/drop, reorder with @dnd-kit)
  - Step 3: Description + features
  - Step 4: Pricing + method
  - Step 5: Inspection times
  - Step 6: Preview + publish
- [ ] `EnquiriesInbox` (list left, thread right)
- [ ] `ListingManagement` grid (agent's own listings)
- [ ] Backend: `POST /properties` (agent, auth required)
- [ ] Backend: `PATCH /properties/:id` (agent owns listing check)
- [ ] Backend: `PATCH /properties/:id/status`
- [ ] Backend: `POST /media/upload` (Supabase Storage, max 20 files)
- [ ] Backend: `GET /agents/me/enquiries`

---

## Phase 9: Polish + Performance

- [ ] List virtualisation on search results (`@tanstack/react-virtual`)
- [ ] Image lazy loading (all cards) + eager load (first listing image)
- [ ] Mapbox: init only when in viewport (IntersectionObserver)
- [ ] Skeleton loaders on all async sections
- [ ] Empty states (no results, no collections, no enquiries)
- [ ] 404 page
- [ ] Error boundary
- [ ] PostHog integration (frontend event tracking)
- [ ] Sentry integration (error monitoring)
- [ ] OpenGraph meta on listing pages (client-side, for social sharing)

---

## Phase 10: Launch

- [ ] Smoke test all user flows end-to-end
- [ ] Playwright E2E: search → listing → enquiry
- [ ] Playwright E2E: register → save → collection
- [ ] Playwright E2E: agent → create listing → publish
- [ ] Lighthouse audit (aim: green on all Core Web Vitals)
- [ ] Deploy frontend → Vercel
- [ ] Deploy backend → Railway
- [ ] Configure DNS
- [ ] Seed production DB with 10 Ahmedabad listings

---

## Backlog (v2)

- [ ] Next.js migration for SEO
- [ ] AI photo captions
- [ ] Full rental application (renter profile, documents)
- [ ] Agent subscription billing (Stripe)
- [ ] Flood zone map layer (NDMA open data)
- [ ] Commute route search
- [ ] Virtual tour embed
- [ ] RERA registration number on listing (if Indian market confirmed)
- [ ] BHK notation support (if Indian market confirmed)
