# Skills — v4
## What Claude Can Do in This Codebase

This file tells Claude what it is capable of doing in the PropSphere repo. Read this before starting any task.

> **v4 changes from v3:** Verified against the actual current code (not just prior docs) — grepped for what's really implemented. Added "Agent Approval Flow" and "Add Virtual Tour Embed", both real Phase 2 features (`docs/DECISIONS-LOCKED.md` #2 and #3) that had no skill coverage at all. Added "Derive a Listing Badge" and "Add a Note to a Saved Property" — both existing, working patterns (`derive-badge.ts`, `useUpdateCollectionNote`) that weren't documented anywhere. No content removed from v3.
>
> **v3 changes from v2:** Merged in the 5 Phase 2 skills that had only been added to the now-deleted `docs/skills.md` (MapLibre, Wire Stub Page, Price History, Recently Viewed, Offer Flow). Fixed "Add Map Layer" to reference MapLibre instead of Mapbox. Fixed "Add BullMQ Job" to match the actual pattern (processors live inside their module, there is no top-level `jobs/` folder). Added "Add Admin Panel Feature" — `apps/admin` is now a fully built third app and wasn't previously covered here.

---

## Skill: Create NestJS Module

When asked to add a new backend feature/module:

1. Read `docs/folder-structure.md` for the correct file placement
2. Scaffold: `module.ts`, `controller.ts`, `service.ts`, `dto/`
3. Register the module in `app.module.ts`
4. Use `SupabaseService` from `database/` — never instantiate Supabase directly
5. Use `ZodValidationPipe` for all DTOs
6. Apply `@UseGuards(AuthGuard)` to protected routes
7. Return typed responses — never return raw Supabase data shapes unless they match shared types
8. Write a unit test for the service

**Example trigger:** "Add a reviews endpoint for agents"

---

## Skill: Create React Feature

When asked to add a new frontend feature:

1. Read `docs/folder-structure.md` — determine if it belongs in `features/` or `components/`
2. Create the feature folder: `components/`, `hooks/`, `pages/`, `types.ts`, `index.ts`
3. API calls go in `apps/web/src/api/` as TanStack Query hooks
4. Local UI state goes in a Redux slice in `store/`
5. All forms use `react-hook-form` + Zod
6. Tailwind only for styles — no inline styles, no CSS modules
7. Export from `index.ts`

**Example trigger:** "Build the agent review submission form"

---

## Skill: Write Database Migration

When schema changes are needed:

1. Read `docs/database-schema.md` for existing schema context
2. Write a SQL migration file in `scripts/`
3. Name it: `NNN_description.sql` (matches the existing numbered pattern, e.g. `012_pending_agent_role.sql`)
4. Include up migration and comment a down migration
5. Note any RLS policy updates needed
6. **Do not add FK constraints** — this project deliberately omits them

**Example trigger:** "Add a `virtual_tour_url` column to properties"

---

## Skill: Add Postgres FTS Filter

When search needs a new filterable field using Postgres Full-Text Search:

1. Check `docs/database-schema.md` — verify the column exists or add a migration for it
2. Update the `search_vector` tsvector trigger in the migration to include the new field (if it should be searchable)
3. Update the filter-building logic in `apps/api/src/modules/properties/properties.service.ts`
4. Update the `SearchFilters` interface in `packages/types/src/search.ts`
5. Update the Redux `searchSlice` if the filter needs UI state
6. Add the filter control to `features/search/components/FilterPanel.tsx`

**Note:** PropSphere uses Postgres FTS (`tsvector` + GIN index) — there is no Typesense client or schema in this project.

**Example trigger:** "Add a pool filter to property search"

---

## Skill: Create Shared Type

When a type is needed in both frontend and backend:

1. Add it to the correct file in `packages/types/src/`
2. Export from `packages/types/src/index.ts`
3. Both `apps/web` and `apps/api` import from `@propsphere/types`
4. Never duplicate type definitions across apps

**Example trigger:** "Add a `PropertyComparison` type"

---

## Skill: Add Finance Calculator

When adding a new calculator (client-side only):

1. Implement the pure calculation function in `packages/utils/src/`
2. Write a unit test for the function
3. Build the React component in `features/finance/components/`
4. No API call — all client-side math

**Example trigger:** "Add a rent-to-buy comparison calculator"

---

## Skill: Add BullMQ Job

When adding a background job:

1. Define the job type in `common/types/`
2. Add the producer call in the relevant service
3. Create the processor inside the owning module as `{module}.processor.ts` (e.g. `modules/alerts/alerts.processor.ts`) — there is no top-level `jobs/` folder, processors live with the module they belong to
4. Register in the module with `BullModule.registerQueue`
5. Handle failure gracefully — log with context, configure retry, don't rethrow to the queue without retry config

**Example trigger:** "Send a weekly digest email to users with saved searches"

---

## Skill: Write Email Template

When a new transactional email is needed:

1. Add the send method to `ResendService`
2. Use React Email template components or plain HTML
3. Test with Resend's preview endpoint
4. Keep email templates in `apps/api/src/modules/notifications/templates/`

**Example trigger:** "Send a price-drop notification email"

---

## Skill: Add Map Layer

When adding a new MapLibre map layer:

1. Read MapLibre GL JS layer docs for the correct layer type
2. Add the layer toggle to the Redux `mapSlice`
3. Add the `LayerToggles` component option
4. Source data: use GeoJSON endpoint from backend or public API
5. Style with MapLibre expressions — not hardcoded colours

**Example trigger:** "Add a school locations overlay to the map"

---

## Skill: Add MapLibre Map Component

1. Import `Map` from `react-map-gl/maplibre` (not `react-map-gl`)
2. Use `MAP_STYLE_STREETS` / `MAP_STYLE_SATELLITE` / `MAPTILER_KEY` from `apps/web/src/lib/map.ts` — never `MAPBOX_TOKEN`
3. No `mapboxAccessToken` prop on the `Map` component
4. All existing `Marker`, `Popup`, `NavigationControl` APIs are unchanged from Mapbox GL
5. Draw tools: `maplibre-gl-draw` (its CSS asset is still shipped as `mapbox-gl-draw.css` — importing that path is expected, not a leftover bug)

**Example trigger:** "Add a draw-your-own-search-area tool to the map"

---

## Skill: Wire Existing Stub Page

When a backend endpoint exists and a frontend component exists as a stub:

1. Read the stub component to understand current state
2. Read the service/controller for API shape and response format
3. Add a TanStack Query hook in `api/` if missing
4. Wire hook → component props → update `router.tsx` if needed
5. Add loading skeleton + error state + empty state

DO NOT rewrite components — extend what exists.

---

## Skill: Add Price History Chart

1. Add `usePriceHistory(propertyId)` in `api/properties.ts`
2. Backend: `GET /properties/:id/price-history` from `property_price_history` table
3. Map to a Recharts `LineChart`: `{ date: string, price: number }[]`
4. Format prices with `formatPrice()` from `@propsphere/utils`
5. Format dates with `format(date, 'MMM yyyy')` from `date-fns`
6. Empty state: "No price history recorded yet"

---

## Skill: Track Recently Viewed

On `ListingPage` mount:

1. Read `localStorage` `'rv'` key → parse JSON array of IDs
2. Prepend current `propertyId`, dedupe, slice to 20
3. Write back to `localStorage`
4. If user authenticated: `POST /users/recently-viewed` (fire-and-forget)

Never block the page render on this. Surfaced to the user at `features/account` → `RecentlyViewedPage.tsx`.

---

## Skill: Implement Offer Flow

Buyer side: `OfferModal` (`features/offers/`) with `react-hook-form` + Zod
Backend: `POST /offers` — unauthenticated allowed (`sender_id` nullable)
Agent side: `GET /agents/me/offers` — filter by `agent_id`
Status update: `PATCH /offers/:id/status`
Auto-email agent on new offer via Resend (non-blocking).
Buyer-facing history lives at `features/account/OfferHistoryPage.tsx`; agent-facing management lives under `features/dashboard`.

---

## Skill: Agent Approval Flow

Signup and approval, per `docs/DECISIONS-LOCKED.md` #2 (`pending_agent` → admin approves):

1. `POST /agents/apply` (`apps/api/src/modules/agents/agents.controller.ts`) creates the `agents` row and sets `profiles.role = 'pending_agent'`
2. Frontend wizard: `features/agent-signup/` (`AgentSignupStepper.tsx`, `Step1PersonalDetails.tsx` → `Step4Review.tsx`, `useAgentSignup.ts`), routed at `/become-an-agent`
3. While `pending_agent`, gate agent-only UI with the existing role check (see `RoleOverlay.tsx` / `AuthProvider.tsx`) — don't invent a new role-check pattern
4. Admin approves via `admin.service.ts` → `approveAgent(agentId, actor)`: flips `profiles.role` to `'agent'`, clears `pending_agent_since`, sends a Resend approval email, and writes an audit log entry (`this.audit(actor, 'agent.approve', ...)`) — follow this same three-step shape (mutate → email → audit) for any other admin approval-style action
5. Admin UI: `apps/admin/src/features/agents/pages/AgentsPage.tsx`

**Example trigger:** "Add a reject/decline action next to Approve on the admin agents page"

---

## Skill: Add Virtual Tour Embed

Per `docs/DECISIONS-LOCKED.md` #3 — URL embed (iframe), not a file upload:

1. Field is `properties.virtual_tour_url` (nullable text) — agent pastes a YouTube/Matterport URL, no new storage bucket or upload flow involved
2. Frontend: passed into `PhotoGallery` as the `virtualTourUrl` prop (see `features/listing/pages/ListingPage.tsx`) — the tour is a tab inside the existing gallery component, not a separate section
3. `deriveBadge()` (`features/search/utils/derive-badge.ts`) already shows a "360° Tour" badge whenever `virtual_tour_url` is set — no extra wiring needed if you're just surfacing that a tour exists elsewhere
4. Backend: field flows through `properties.service.ts` like any other property column — no dedicated virtual-tour service/module exists or is needed

**Example trigger:** "Show the virtual tour URL in the agent's edit-listing form"

---

## Skill: Derive a Listing Badge

Badge logic ("New" / "Auction" / "Under Offer" / "Inspection" / "360° Tour") is centralized, not scattered per-component:

1. All badge rules live in one function: `apps/web/src/features/search/utils/derive-badge.ts` (`deriveBadge(property)`), returning `{ label, className } | null`
2. Rules are checked in priority order (auction → under offer → inspection soon → virtual tour → new) — the first match wins, so a new rule usually needs to be slotted into that same if-chain, not appended after `return null`
3. Consumed by `PropertyCard.tsx` and other listing-summary components — call `deriveBadge()`, don't re-derive badge logic locally in a component
4. Styling uses the existing Tailwind brand tokens (`bg-brand-accent`, `bg-brand-secondary`, `bg-brand-primary`) — match those, don't hardcode new colours

**Example trigger:** "Add a 'Price Reduced' badge when a property's price has dropped in the last 7 days"

---

## Skill: Add a Note to a Saved Property

Buyers can attach a private note (max `MAX_NOTES_LENGTH` = 500 chars, from `@propsphere/config`) to a property inside a collection:

1. Mutation hook: `useUpdateCollectionNote()` in `apps/web/src/api/collections.ts`
2. UI pattern lives in `features/collections/pages/CollectionsPage.tsx` — inline edit (textarea + char counter + Save), not a modal
3. Enforce the 500-char limit client-side via `MAX_NOTES_LENGTH` from `packages/config/src/constants.ts` — don't hardcode `500`
4. `notes` is a nullable string on the collection-property join row, not on `properties` itself — a note is scoped to one buyer's saved copy, not the listing globally

**Example trigger:** "Show note previews (first 60 chars) in the collection grid view, not just on click-to-edit"

---

## Skill: Add Admin Panel Feature

`apps/admin` is a **separate** deployed app (its own Vite build, router, and Redux store — not a route inside `apps/web`), gated to `profile.role === 'admin'`. When asked to add or change an admin capability:

1. Frontend lives at `apps/admin/src/features/{feature}/pages/` (e.g. `properties`, `agencies`, `agents`, `users`, `suburbs`, `schools`, `enquiries`, `notifications`, `media`, `featured`, `analytics`, `dashboard`) — follow the same `components/`/`hooks/`/`pages/` shape as `apps/web` features, but note most admin features only have `pages/` today
2. All admin API calls go through the single `apps/admin/src/api/admin.ts` — do not scatter per-feature API files here the way `apps/web` does
3. Backend endpoints live in `apps/api/src/modules/admin/` (`admin.controller.ts`, `admin.service.ts`) and are protected by `apps/api/src/modules/admin/guards/admin.guard.ts` — apply that guard, not the generic `RolesGuard`, for admin-only routes
4. Admin-specific UI primitives live in `apps/admin/src/components/ui/` (`Table`, `Modal`, `Pagination`, `Select`, `Card`, `Badge`, `Button`, `Input`, `Spinner`) — this is a different, smaller set than `apps/web`'s primitives (no `Dropdown`, `RangeSlider`, `Skeleton`, `Tabs`); don't cross-import between the two apps' `components/ui/`
5. CSV export: use the existing `apps/admin/src/lib/csv.ts` helper — don't add a new CSV dependency
6. Every write action must produce an audit log entry (see `docs/admin-panel.md` for the spec) — check `admin.service.ts` for the existing audit-log call pattern and follow it
7. Read `docs/admin-panel.md` for the full feature spec before adding a new admin screen

**Example trigger:** "Add a bulk-delete action to the admin properties table"

---

## What Claude Should NOT Do

- Install new npm packages without noting it explicitly in the response
- Change the Supabase schema without creating a migration file
- Add `any` types
- Add error handling beyond what the existing pattern uses
- Refactor code outside the scope of the current task
- Create new abstraction layers unless the task explicitly requires it
- Use CSS Modules or styled-components — Tailwind only
- Call Supabase directly from React components — use the `api/` layer
- Add FK constraints to any Postgres migration
- Reference Typesense — the project uses Postgres FTS
- Reference Mapbox — the project uses MapLibre GL JS + MapTiler
