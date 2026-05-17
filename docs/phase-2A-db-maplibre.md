# Phase 2-A — DB Migrations + MapLibre Migration
# Paste _shared-context-phase2.md above this first.
# MUST complete before any other Phase 2 session.
# Decisions locked: MapLibre + MapTiler confirmed.

---

## Session 2-A-1 — Database Migration

### Vibe Coding Instruction
> "I'm extending the PropSphere PostgreSQL database (via Supabase) for Phase 2.
> The file `scripts/010_phase2.sql` already exists (check if empty/partial — read it first).
> Fill it with the complete migration SQL below.
> Run the enum extension FIRST in its own block — Postgres requires it.
> No FK constraints anywhere (project rule). Use IF NOT EXISTS on all DDL.
> Show the complete SQL file ready to paste into Supabase SQL editor."

### Deliver: `scripts/010_phase2.sql`

**BLOCK 1 — Enum (must execute first, then commit):**
```sql
-- Run this block first. Commit before Block 2.
ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'under_contract';
```

**BLOCK 2 — New columns on properties:**
```sql
ALTER TABLE properties ADD COLUMN IF NOT EXISTS virtual_tour_url           TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bhk_config                 TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS feature_order              SMALLINT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS sold_price_is_confidential BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS under_contract_at          TIMESTAMPTZ;
```

**BLOCK 3 — New columns on agents / agencies / profiles:**
```sql
ALTER TABLE agents    ADD COLUMN IF NOT EXISTS is_verified      BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE agents    ADD COLUMN IF NOT EXISTS verified_at       TIMESTAMPTZ;
ALTER TABLE agents    ADD COLUMN IF NOT EXISTS license_doc_url   TEXT;
ALTER TABLE agents    ADD COLUMN IF NOT EXISTS slug              TEXT;

ALTER TABLE agencies  ADD COLUMN IF NOT EXISTS slug              TEXT;

ALTER TABLE profiles  ADD COLUMN IF NOT EXISTS pending_agent_since TIMESTAMPTZ;
```

**BLOCK 4 — New tables:**
```sql
-- Price history per property address
CREATE TABLE IF NOT EXISTS property_price_history (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id  UUID        NOT NULL,     -- properties.id
  address_key  TEXT        NOT NULL,     -- normalised: lower(suburb_state_streetno_streetname)
  sold_price   INT         NOT NULL,
  sold_date    DATE        NOT NULL,
  sale_method  sale_method,
  is_seed_data BOOLEAN     NOT NULL DEFAULT FALSE,
  source       TEXT        NOT NULL DEFAULT 'internal',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Buyer offers (simple: no counter-offer flow)
CREATE TABLE IF NOT EXISTS offers (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id     UUID        NOT NULL,   -- properties.id
  agent_id        UUID        NOT NULL,   -- agents.id
  sender_id       UUID,                   -- profiles.id (null if unauthenticated)
  sender_name     TEXT        NOT NULL,
  sender_email    TEXT        NOT NULL,
  sender_phone    TEXT,
  amount          INT         NOT NULL,
  message         TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','accepted','rejected','withdrawn')),
  is_confidential BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recently viewed (authenticated users, localStorage for guests)
CREATE TABLE IF NOT EXISTS recently_viewed (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL,   -- profiles.id
  property_id UUID        NOT NULL,   -- properties.id
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, property_id)
);

-- Agent license/certificate documents
CREATE TABLE IF NOT EXISTS agent_certifications (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id    UUID        NOT NULL,   -- agents.id
  doc_name    TEXT        NOT NULL,
  doc_url     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**BLOCK 5 — Indexes:**
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_slug   ON agents(slug)   WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_agencies_slug ON agencies(slug) WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_price_history_property ON property_price_history(property_id);
CREATE INDEX IF NOT EXISTS idx_price_history_address  ON property_price_history(address_key);
CREATE INDEX IF NOT EXISTS idx_price_history_date     ON property_price_history(sold_date DESC);

CREATE INDEX IF NOT EXISTS idx_recently_viewed_user   ON recently_viewed(user_id, viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_offers_agent    ON offers(agent_id,    created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offers_property ON offers(property_id);
CREATE INDEX IF NOT EXISTS idx_offers_sender   ON offers(sender_id)  WHERE sender_id IS NOT NULL;
```

**BLOCK 6 — RLS on new tables:**
```sql
ALTER TABLE offers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_viewed     ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_certifications ENABLE ROW LEVEL SECURITY;

-- offers: public insert (unauthenticated buyers can submit)
CREATE POLICY "public insert"    ON offers FOR INSERT WITH CHECK (true);
-- offers: sender reads own
CREATE POLICY "sender reads own" ON offers FOR SELECT USING (sender_id = auth.uid());
-- offers: agent reads own listings' offers
CREATE POLICY "agent reads own"  ON offers FOR SELECT
  USING (agent_id IN (SELECT id FROM agents WHERE profile_id = auth.uid()));

-- recently_viewed: own rows only
CREATE POLICY "own" ON recently_viewed USING (user_id = auth.uid());

-- price_history: public read
CREATE POLICY "public read" ON property_price_history FOR SELECT USING (true);

-- agent_certifications: agent reads own
CREATE POLICY "agent own" ON agent_certifications
  USING (agent_id IN (SELECT id FROM agents WHERE profile_id = auth.uid()));
```

**BLOCK 7 — Seed price history for existing properties:**
```sql
-- Insert 2 fake historical records per seeded property (for dev/demo)
-- Record 1: ~3 years ago at 85% of current price
INSERT INTO property_price_history (property_id, address_key, sold_price, sold_date, sale_method, is_seed_data)
SELECT
  id,
  lower(replace(suburb, ' ', '_') || '_' || state || '_' || street_number || '_' || replace(street_name, ' ', '_')),
  ROUND((COALESCE(price, 3000000) * 0.85)::numeric, -5)::INT,
  (NOW() - INTERVAL '3 years')::DATE,
  'private_treaty'::sale_method,
  true
FROM properties
WHERE is_seeded = true AND COALESCE(price, 0) > 0
ON CONFLICT DO NOTHING;

-- Record 2: ~5 years ago at 70% of current price
INSERT INTO property_price_history (property_id, address_key, sold_price, sold_date, sale_method, is_seed_data)
SELECT
  id,
  lower(replace(suburb, ' ', '_') || '_' || state || '_' || street_number || '_' || replace(street_name, ' ', '_')),
  ROUND((COALESCE(price, 3000000) * 0.70)::numeric, -5)::INT,
  (NOW() - INTERVAL '5 years')::DATE,
  'auction'::sale_method,
  true
FROM properties
WHERE is_seeded = true AND COALESCE(price, 0) > 0
ON CONFLICT DO NOTHING;
```

### After migration — update shared types

**`packages/types/src/property.ts`** — add to `PropertySummary` and `PropertyDetail`:
```typescript
// Add to PropertySummary:
virtualTourUrl?: string
bhkConfig?: string
featureOrder?: number
soldPriceIsConfidential?: boolean
underContractAt?: string
nextInspectionAt?: string   // for badge logic

// Add to PropertyDetail:
priceHistory?: PriceHistoryRecord[]
```

**`packages/types/src/index.ts`** — add and export:
```typescript
// New file: packages/types/src/offers.ts
export interface Offer {
  id: string
  propertyId: string
  agentId: string
  senderId?: string
  senderName: string
  senderEmail: string
  senderPhone?: string
  amount: number
  message?: string
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  isConfidential: boolean
  createdAt: string
  updatedAt: string
}

export interface SubmitOfferInput {
  propertyId: string
  agentId: string
  senderName: string
  senderEmail: string
  senderPhone?: string
  amount: number
  message?: string
  isConfidential?: boolean
}

// New file: packages/types/src/price-history.ts
export interface PriceHistoryRecord {
  id: string
  propertyId: string
  soldPrice: number
  soldDate: string
  saleMethod?: string
  source: string
  isSeedData: boolean
}
```

### End state check
```bash
node scripts/migrate.js         # runs pending migrations via migrate.js
# Note: types/offers.ts and types/price-history.ts already exist (marked ★ in structure)
# Verify they match the new columns added in 010_phase2.sql
pnpm typecheck                    # zero errors
```

---

## Session 2-A-2 — MapLibre Migration (Mapbox → MapLibre + MapTiler)

### Vibe Coding Instruction
> "Migrate this React real estate project from Mapbox GL JS to MapLibre GL JS.
> Decision locked: MapTiler for tiles (VITE_MAPTILER_KEY). react-map-gl stays.
> I'll tell you every file to touch. Read each before editing.
> Start with the package changes, then config, then components one by one."

### Step 1 — Package swap
```bash
# Run in apps/web
pnpm remove mapbox-gl @types/mapbox-gl @mapbox/mapbox-gl-draw
pnpm add maplibre-gl maplibre-gl-draw
# react-map-gl v7+ supports MapLibre natively — no change needed
```

### Step 2 — New map utility file

**Delete:** `apps/web/src/lib/mapbox.ts`

**Create:** `apps/web/src/lib/map.ts`
```typescript
export const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY as string;

export const MAP_STYLE_STREETS =
  `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`;

export const MAP_STYLE_SATELLITE =
  `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`;

// Ahmedabad centre
export const DEFAULT_VIEWPORT = {
  longitude: 72.5714,
  latitude:  23.0225,
  zoom:      11,
};

// REA-style subtle customisation
// MapLibre uses the same Mapbox style spec — this array works unchanged
export const REA_MAP_OVERRIDES: maplibregl.StyleSpecification['layers'] = [];
// Note: MapTiler streets already looks clean — no override needed for v2 launch
```

### Step 3 — Vite config update

**`apps/web/vite.config.ts`** — add MapLibre worker exclusion:
```typescript
optimizeDeps: {
  exclude: ['maplibre-gl'],
},
```

### Step 4 — CSS import

**`apps/web/src/main.tsx`** — swap Mapbox CSS for MapLibre:
```typescript
// Remove:
import 'mapbox-gl/dist/mapbox-gl.css';

// Add:
import 'maplibre-gl/dist/maplibre-gl.css';
```

### Step 5 — Update all map components

**Files to update** (read each before editing):

**a) `apps/web/src/features/map/components/MapView.tsx`**
```typescript
// Change import:
import { MAP_STYLE_STREETS } from '@/lib/map';
// Remove: mapboxAccessToken={MAPBOX_TOKEN}
// The Map component from react-map-gl works with MapLibre automatically
// when maplibre-gl is the installed package — no mapboxAccessToken needed
```

**b) `apps/web/src/features/map/store/mapSlice.ts`**
No change needed — Redux slice has no Mapbox-specific code.

**c) `apps/web/src/features/listing/components/ListingMap.tsx`**
```typescript
// Change:
import { MAP_STYLE_STREETS, MAP_STYLE_SATELLITE } from '@/lib/map';
// Remove: mapboxAccessToken prop
// Keep: everything else identical
```

**d) `apps/web/src/features/listing/data/map-style.ts`**
```typescript
// The REA_MAP_STYLE array used google.maps.MapTypeStyle — this file was for Google Maps.
// For MapLibre: delete this file entirely.
// MapTiler streets style is already clean — no custom styling needed.
```

**e) Draw area component** (wherever `@mapbox/mapbox-gl-draw` was used):
```typescript
// Change:
import MaplibreDraw from 'maplibre-gl-draw';
import 'maplibre-gl-draw/dist/maplibre-gl-draw.css';
// API is identical to @mapbox/mapbox-gl-draw — no other code changes
```

### Step 6 — Environment variables

**`apps/web/.env.example`** — update:
```
# Remove:
VITE_MAPBOX_TOKEN=

# Add:
VITE_MAPTILER_KEY=    # Free account at maptiler.com → API Keys → create key
                      # Allowed domains: localhost, yourdomain.com
```

**`apps/web/.env.local`** — manually update with real MapTiler key (not committed).

### Step 7 — Update CLAUDE.md

Add to the maps section:
```markdown
## Maps (Phase 2 — updated)
MapLibre GL JS replaces Mapbox GL JS. Free, MIT licence.
Tile provider: MapTiler (100k loads/month free).
Token: VITE_MAPTILER_KEY (no domain restriction issues — MapTiler uses URL allow-list).
Import map utils from: @/lib/map (file: apps/web/src/lib/map.ts)
Draw area: maplibre-gl-draw (replaces @mapbox/mapbox-gl-draw — identical API)
```

### End state check
```bash
pnpm dev --filter=web
# /map loads with MapTiler streets tiles (no Mapbox error in console)
# /buy — property pins appear
# Listing detail — listing map loads
# Draw area on /map — polygon draw works
# grep -r "mapbox-gl" apps/web/src -- returns zero results
# grep -r "MAPBOX_TOKEN" apps/web/src -- returns zero results
```

---

## Session 2-A-3 — Update CLAUDE.md + skills.md + task.md

### Vibe Coding Instruction
> "Update PropSphere project documentation for Phase 2.
> Read each file first. Make targeted additions — do not rewrite.
> Three files to update: CLAUDE.md (in repo root), docs/skills.md, docs/task.md"

### CLAUDE.md — add Phase 2 block:
```markdown
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
```

### docs/skills.md — add 5 new skills:

```markdown
## Skill: Wire Existing Stub Page
When backend endpoint exists + frontend component exists as stub:
1. Read stub component to understand current state
2. Read service/controller for API shape and response format
3. Add TanStack Query hook in api/ if missing
4. Wire hook → component props → update router if needed
5. Add loading skeleton + error state + empty state
DO NOT rewrite components — extend what exists.

## Skill: Add Price History Chart
1. Add usePriceHistory(propertyId) in api/properties.ts
2. Backend: GET /properties/:id/price-history from property_price_history table
3. Map to Recharts LineChart: { date: string, price: number }[]
4. Format prices with formatPrice() from @propsphere/utils
5. Format dates with format(date, 'MMM yyyy') from date-fns
6. Empty state: "No price history recorded yet"

## Skill: Track Recently Viewed
On ListingPage mount:
1. Read localStorage 'rv' key → parse JSON array of IDs
2. Prepend current propertyId, dedupe, slice to 20
3. Write back to localStorage
4. If user authenticated: POST /users/recently-viewed (fire-and-forget)
Never block the page render on this.

## Skill: Add MapLibre Map Component
1. Import Map from react-map-gl (unchanged from Phase 1)
2. Use MAP_STYLE_STREETS from @/lib/map (not MAPBOX_TOKEN)
3. No mapboxAccessToken prop on Map component
4. All existing Marker, Popup, NavigationControl APIs unchanged

## Skill: Implement Offer Flow
Buyer side: OfferModal with react-hook-form + Zod
Backend: POST /offers — unauthenticated allowed (sender_id nullable)
Agent side: GET /agents/me/offers — filter by agent_id
Status update: PATCH /offers/:id/status
Auto-email agent on new offer via Resend (non-blocking).
```

### docs/task.md — append Phase 2 checklist:

```markdown
---

## Phase 2 Checklist

### 2-A: Foundation
[x] 010_phase2.sql migration applied
[x] MapLibre migration complete (VITE_MAPTILER_KEY)
[x] packages/types updated with Phase 2 types
[x] CLAUDE.md + skills.md + task.md updated

### 2-B: Wire Phase 1 Stubs
[ ] Suburb profile page wired (/suburb/:state/:slug)
[ ] DashboardHome wired
[ ] ListingManagement wired
[ ] ListingWizard submit wired
[ ] EnquiriesInbox wired
[ ] Agent offer inbox (/dashboard/offers)
[ ] Agent self-signup (/become-an-agent)

### 2-C: Sold Ecosystem
[ ] Sold PropertyCard variant (red ribbon)
[ ] Sold search page (/sold)
[ ] Sold detail page sections
[ ] Price history chart
[ ] Floor plan viewer tab
[ ] Virtual tour embed tab
[ ] BHK config display
[ ] Smart badge logic (New/Inspection/Auction/360Tour/UnderOffer)
[ ] Recently viewed (localStorage + DB sync)
[ ] Enquiry history (/account/enquiries)
[ ] Notes on saved properties

### 2-D: Offers + Directories
[ ] Offer submit modal (buyer)
[ ] Offer inbox (/dashboard/offers)
[ ] Offer history (/account/offers)
[ ] Agent profile page (full, /agent/:slug)
[ ] Agency profile page (new, /agency/:slug)
[ ] Suburb sold aggregations
[ ] Agent analytics (/dashboard/analytics)

### 2-E: Finish
[ ] Phase 9 polish + PostHog Phase 2 events
[ ] Phase 10 deploy + seed 1,000 listings
```

---

## Git + Test Requirements per Session

### 2-A-1: DB Migration
```bash
git checkout -b feature/phase2-db-migration
# After writing migration file:
git add scripts/010_phase2.sql
git commit -m "chore(db): add phase2 migration with price_history, offers, recently_viewed tables"
git add packages/types/src/offers.ts packages/types/src/price-history.ts packages/types/src/index.ts
git commit -m "chore(types): add Phase 2 shared types (Offer, PriceHistoryRecord)"
```
**Tests to run:**
```bash
# Verify migration applied
node scripts/migrate.js
# Note: types/offers.ts and types/price-history.ts already exist (marked ★ in structure)
# Verify they match the new columns added in scripts/010_phase2.sql
pnpm typecheck   # must pass zero errors before commit
```

### 2-A-2: MapLibre Migration
```bash
git checkout -b feature/maplibre-migration
git add apps/web/package.json
git commit -m "chore(map): swap mapbox-gl for maplibre-gl and maplibre-gl-draw"
git add apps/web/src/lib/map.ts
git commit -m "feat(map): create map.ts utility with MapTiler config (replaces mapbox.ts)"
# One commit per component updated:
git add apps/web/src/features/map/components/MapView.tsx
git commit -m "feat(map): migrate MapView to MapLibre + MapTiler tiles"
git add apps/web/src/features/listing/components/ListingMap.tsx
git commit -m "feat(map): migrate ListingMap to MapLibre"
```
**Test to write:** `apps/web/src/lib/map.test.ts` (see _test-cases-phase2.md → SESSION 2-A)
```bash
pnpm test --filter=web src/lib/map.test.ts
# Then manual smoke test:
pnpm dev --filter=web
# Open /map — verify MapTiler tiles load, no console errors
# Open /buy listing — verify listing map loads
# Verify draw area still works
```
**End of session — Git Summary block:**
```
## Git Summary
Branch: feature/maplibre-migration
Commits: (list all commits made)
PR title: chore(map): migrate all map components from Mapbox to MapLibre + MapTiler
Tests: pnpm test PASS
Next: open PR → develop
```

### 2-A-3: Docs Update
```bash
git checkout -b chore/phase2-docs-update
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with Phase 2 map change and new routes"
git add docs/skills.md
git commit -m "docs: add 5 new Phase 2 skills to skills.md"
git add docs/task.md
git commit -m "chore: add Phase 2 task checklist to task.md"
```
No new test files for docs session. Run `pnpm lint` to catch any markdown issues.
