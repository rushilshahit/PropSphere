# Phase 2 — Pre-Implementation Analysis
## Questions, Feedback & Suggestions Before We Code

**Project:** PropSphere (github.com/rushilshahit/PropSphere)
**Phase 1 Status:** Phases 0–7 + Admin + Home complete. Phase 6/8 web = stub.

---

## Critical Questions (Need Answers Before Any Code)

### Q1 — MapLibre Migration Strategy
Phase 2 asks for MapLibre (free) but the entire Phase 1–3 map system
was built with Mapbox GL JS (react-map-gl).

**Decision required:**
- [ ] **Option A (Recommended):** Migrate all existing map components to MapLibre GL JS.
  MapLibre is a MIT-licensed fork of Mapbox GL JS — API is ~95% identical.
  Swap: `mapbox-gl` → `maplibre-gl`, `react-map-gl` stays (it supports both),
  remove `VITE_MAPBOX_TOKEN`, change style URL to a free tile source.
  Free tile sources: MapTiler (free tier), Stadia Maps (free), or OpenFreeMap.
- [ ] **Option B:** Keep Mapbox for existing, use MapLibre only on new map features.
  This creates two map SDKs loading on the same page — bad for performance.

**My recommendation:** Option A. Migration takes one session but eliminates all map costs.

---

### Q2 — Agent Signup & Approval Flow
Phase 2 requires agent self-signup. Three design options:

- [ ] **Option A (Recommended):** Self-signup → `role = pending_agent` →
  Admin approves in Admin Panel → `role = agent`. Clean, prevents fake agents.
- [ ] **Option B:** Self-signup → instantly `role = agent` (no approval).
  Simple but risky — anyone can become an agent.
- [ ] **Option C:** Invite-only. Admin creates agent accounts manually.
  Most controlled, least scalable.

**Follow-up:** When an agent signs up, do they:
- Create their own agency (new agency form in signup wizard)?
- Pick from an existing agency list (admin pre-creates agencies)?
- Both (create new OR join existing)?

---

### Q3 — Virtual Tour Embed Format
Phase 2 mentions "virtual tour embed (iframe or custom)."

- [ ] **Option A (Recommended):** URL field on property — supports YouTube,
  Matterport, and any iframe-embeddable URL. Admin/agent pastes a URL.
  Renders as a sandboxed `<iframe>`.
- [ ] **Option B:** Upload 360° photos to Supabase Storage and use
  a JS library like `pannellum` or `photo-sphere-viewer` to render.
  Requires custom upload flow — more work, but fully self-hosted.

---

### Q4 — Price History Data Source
Phase 2 requires "price history chart per property."

At launch, PropSphere only has seed data. Price history can only be
populated from two sources:

- [ ] **Option A (Recommended for v2 launch):** Internal only — track every
  status change (active → sold) as a price history record. History builds
  naturally as agents use the platform. At launch: show "No price history yet."
- [ ] **Option B:** CSV bulk import of historical sold data. Requires
  sourcing real transaction data (not available for free in India).
- [ ] **Option C:** Generate fake historical price history in the seed script
  (e.g., 2–4 fake past transactions per property). Good for demo/dev.

**Recommendation:** Option A + Option C for seed data only.

---

### Q5 — "Recently Viewed" Storage
- [ ] **Option A:** LocalStorage (guest + authenticated users).
  No DB, fast, lost when browser cache cleared.
- [ ] **Option B:** Database only (authenticated users only).
  Persists across devices, requires login.
- [ ] **Option C (Recommended):** LocalStorage for guests,
  sync to DB on login (merge last 20 views). Best UX.

---

### Q6 — Offer Management Complexity
Phase 2 mentions "offer management: view offers submitted via platform."

- [ ] **Option A (Recommended):** Simple — buyer submits `{ propertyId, amount, message, name, email }`.
  Agent sees offer in inbox alongside enquiries. No counter-offer flow.
- [ ] **Option B:** Full offer flow — submission → counter-offer → accept/reject.
  Requires legal considerations, significant UI complexity.

**Recommendation:** Option A for v2. Option B is v3+ territory.

---

### Q7 — Agent Reviews
Phase 1 explicitly **removed** agent reviews from scope.
Phase 2 requirements mention "reviews" on agent profile page.

- [ ] **Include in Phase 2?** (5-star rating + text comment, 1 per enquiry sender)
- [ ] **Keep out of scope?**

---

### Q8 — Free Map Tiles (if MapLibre chosen)
MapLibre needs a free tile source. Options:

| Provider | Free Tier | Style quality |
|---|---|---|
| OpenFreeMap | Completely free, self-hosted vector | Good |
| MapTiler | 100k requests/month free | Excellent (closest to Mapbox) |
| Stadia Maps | 250k tiles/month free | Good |

**Recommendation:** MapTiler — best looking tiles, generous free tier,
one `VITE_MAPTILER_KEY` env var replaces `VITE_MAPBOX_TOKEN`.

---

## Feedback & Suggestions

### Suggestion 1 — Phase 6 and 8 Web Stubs (Complete First)
Before adding new Phase 2 features, the existing stubs should be wired:
- **Suburb Profile page** (`/suburb/:state/:slug`) — backend is fully built
- **Agent Dashboard + Listing Wizard** (`/dashboard/*`) — backend is fully built

These are ~2 sessions each to wire existing backend → existing stub components.
**Include as Phase 2-A** before any new feature development.

### Suggestion 2 — Sold Status Transition is a Breaking Change
The Phase 2 sold requirements add `under_contract` to the `listing_status` enum
and new fields to the `properties` table (`sold_price_display`, `sale_method_display`).
This requires a DB migration AND updates to existing search/filter logic.
Must be done in the first session before any other feature.

### Suggestion 3 — BHK Notation
The existing schema uses `bedrooms: SMALLINT`. Indian users expect "2 BHK" notation.
Phase 2 is a good time to add a `bhk_config TEXT` field (e.g., "2 BHK", "3.5 BHK")
as a display override without breaking the existing `bedrooms` integer.

### Suggestion 4 — MapLibre + react-map-gl Compatibility
`react-map-gl` v7+ supports both Mapbox and MapLibre.
The migration is: change the import source in the Map component +
update the map style URL. Component APIs are identical.
All existing Phase 3 map code (pins, clusters, draw area) works unchanged.

### Suggestion 5 — Offer Management Table Design
Add an `offers` table now even if the UI is simple.
Future counter-offer flow can add columns without a schema redesign.
```sql
offers: id, property_id, sender_id, sender_name, sender_email,
        amount, message, status (pending/accepted/rejected/withdrawn),
        is_confidential, created_at
```

### Suggestion 6 — Feature Order for Admin Featured Section
The PRD mentions `feature_order` column on properties.
This needs to be added to the DB migration file.
Admin panel already has drag-and-drop reorder for featured — it needs this column.

---

## What Phase 2 Adds to the DB (Summary)

New tables:
```
property_price_history   ← sold transaction history per property
offers                   ← buyer offer submissions
recently_viewed          ← user recently viewed properties (authenticated)
agent_certifications     ← agent license/certificate upload
virtual_tours            ← virtual tour URLs per property (or just a column on properties)
```

New columns on existing tables:
```
properties:
  + virtual_tour_url TEXT
  + floor_plan_url TEXT       (or mark is_floor_plan on property_images — already exists)
  + under_contract_at TIMESTAMPTZ
  + feature_order SMALLINT    (for admin featured drag-and-drop)
  + bhk_config TEXT           (display: "2 BHK", "3 BHK + Study")
  + sold_price_is_confidential BOOLEAN

profiles:
  + recently_viewed_ids TEXT[]  (last 20 property IDs — alternative to separate table)

agents:
  + license_doc_url TEXT
  + is_verified BOOLEAN DEFAULT FALSE
  + verified_at TIMESTAMPTZ
```

Enum changes:
```sql
ALTER TYPE listing_status ADD VALUE 'under_contract';
-- Note: PostgreSQL enum ADD VALUE cannot be rolled back
-- Run this migration first, before any other Phase 2 changes
```

---

## Phase 2 Implementation Order (My Recommendation)

```
Session 2-0:  Questions answered → PRD v2 locked
Session 2-A:  DB migrations (enum + new tables + new columns)
Session 2-B:  MapLibre migration (swap Mapbox → MapLibre + free tiles)
Session 2-C:  Wire Phase 6 web (Suburb profile page) — backend already built
Session 2-D:  Wire Phase 8 web (Agent dashboard + listing wizard) — backend already built
Session 2-E:  Agent signup flow (pending_agent → admin approval → agent)
Session 2-F:  Sold functionality — Part 1 (sold search page, sold detail page)
Session 2-G:  Sold functionality — Part 2 (price history chart, suburb aggregations)
Session 2-H:  Property detail enhancements (floor plan viewer, virtual tour, badges)
Session 2-I:  User account enhancements (recently viewed, enquiry history, offer history)
Session 2-J:  Offer management (submit offer form + agent offer inbox)
Session 2-K:  Agent profile page (full — currently stub)
Session 2-L:  Agency profile page (new)
Session 2-M:  Agent analytics (views/saves/enquiries per listing charts)
Session 2-N:  Phase 9 (polish, performance, error boundaries)
Session 2-O:  Phase 10 (deploy, E2E tests, seed 1,000 listings)
```

---

## Decisions Needed (Action Required)

Please answer these before implementation starts:

| # | Question | Your Answer |
|---|---|---|
| 1 | MapLibre migration: Option A (migrate all) or Option B (keep Mapbox)? | |
| 2 | Agent approval: self-approve, admin-approve, or invite-only? | |
| 3 | Agent signup: create own agency OR pick existing OR both? | |
| 4 | Virtual tour: URL embed or 360° photo upload? | |
| 5 | Price history at launch: internal-only or seed with fake history? | |
| 6 | Recently viewed: localStorage only, DB only, or both? | |
| 7 | Offer management: simple (Option A) or full flow (Option B)? | |
| 8 | Agent reviews: include in Phase 2 or keep deferred? | |
| 9 | Free map tile provider: MapTiler, OpenFreeMap, or Stadia? | |
