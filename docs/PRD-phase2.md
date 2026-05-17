# Product Requirements Document
## PropSphere — Phase 2
**Version:** 2.0
**Status:** Planning
**Builds on:** PRD v1.2 (Phase 1 complete)
**GitHub:** github.com/rushilshahit/PropSphere

---

## 1. Phase 2 Scope Summary

Phase 2 completes the stubs from Phase 1, migrates to free maps,
and adds the full sold ecosystem, agent self-signup, property
enhancements, and user account depth.

---

## 2. Feature Modules — Phase 2

### 2.1 Map Migration: Mapbox → MapLibre (P0)

Replace `mapbox-gl` with `maplibre-gl` across the entire codebase.
`react-map-gl` already supports both — swap is mostly config.

**Changes:**
- Remove `VITE_MAPBOX_TOKEN` env var
- Add `VITE_MAPTILER_KEY` (free MapTiler account)
- Map style URL: `https://api.maptiler.com/maps/streets/style.json?key={KEY}`
- Satellite style: `https://api.maptiler.com/maps/satellite/style.json?key={KEY}`
- All existing Phase 3 components work unchanged

**Free tier:** MapTiler 100,000 map loads/month (sufficient for launch)

---

### 2.2 Complete Phase 1 Stubs (P0)

#### 2.2.1 Suburb Profile Page — Wire Frontend
- Backend `GET /suburbs/:state/:slug` already built
- Components `SuburbStats`, `PriceTrendChart`, `SchoolsList` already built
- Task: wire route `/suburb/:state/:slug` → `SuburbPage`
- Link suburb chips on listing cards → SuburbPage

#### 2.2.2 Agent Dashboard + Listing Wizard — Wire Frontend
- All backend endpoints already built (Phase 8)
- Task: wire `/dashboard/*` routes to existing components
- Steps: DashboardLayout → DashboardHome → ListingWizard → EnquiriesInbox

#### 2.2.3 Agent Individual Profile Page (`/agent/:slug`)
- `/agents` list page already built
- Wire full agent profile: bio, photo, active listings, sold listings, agency card

---

### 2.3 Agent Self-Signup (P0)

New flow: any user can apply to become an agent.

**Flow:**
1. User clicks "List your property" or "Agent signup"
2. Multi-step form:
   - Step 1: Personal details (already in profile)
   - Step 2: Agency (create new agency OR select existing from list)
   - Step 3: License number + certificate upload (Supabase Storage)
   - Step 4: Bio + headshot
3. On submit: `profile.role → 'pending_agent'` + agent row created
4. Email to admin: new agent application
5. Admin approves → `role → 'agent'`, email to applicant

**New route:** `/become-an-agent`

---

### 2.4 Sold Functionality — Full Ecosystem (P0)

#### 2.4.1 Status Transition Model
```
draft → active → under_contract → sold
                               → withdrawn
```
When marking as `sold`:
- Prompt: sold price, sold date, sale method, is_price_confidential
- Auto-creates a `property_price_history` record
- Listing migrates from Buy search → Sold search

#### 2.4.2 Sold Search Page (`/sold`)
**Filters specific to Sold:**
- Date sold: Last 3 months / 6 months / 1 year / custom range
- Sale method: Auction / Private treaty / Expression of interest
- Standard: property type, bedrooms, bathrooms, price range, suburb

**Card differences from active:**
- "SOLD" red ribbon badge on image
- Show sold date + sold price (or "Price withheld")
- Days on market (listed → sold)
- No enquiry CTA → "View agent" button instead

#### 2.4.3 Sold Property Detail Page
**Additional sections vs active listing:**
- Sold price banner (replaces active price display)
- Sale summary card: sold date, method, days on market, sold vs ask delta
- Price history timeline (all recorded transactions for this address)
- "Thinking of selling?" CTA → appraisal request form
- Historical ownership section (if price history data exists)

#### 2.4.4 Price History Chart
- Timeline + Recharts LineChart per property address
- Each data point: transaction date + sold price
- Seeds: generate 2–3 fake past transactions in seed script
- New real records: created when agent marks listing as sold

#### 2.4.5 Suburb Sold Data (Market Insights)
Aggregate from sold listings on suburb page:
- Median sold price (by property type: house/apartment)
- Average days on market
- Number of sales in selected period
- Price growth % vs previous period
- Sale method distribution (% auction vs private treaty)
- Clearance rate (auctions only)

#### 2.4.6 Agent Sold History
On agent profile page:
- List of properties sold by this agent (last 12 months)
- Filters: suburb, property type, date range
- Stats card: total sales, median sold price, median days on market, highest sale

---

### 2.5 Property Detail Enhancements (P1)

#### 2.5.1 Floor Plan Viewer
- `property_images` table already has `is_floor_plan BOOLEAN`
- Floor plans show in a separate "Floor Plan" tab on the photo gallery
- Full-screen lightbox same as photos

#### 2.5.2 Virtual Tour Embed
- Add `virtual_tour_url TEXT` to `properties` table
- Supports: YouTube, Matterport, any embeddable URL
- Renders as: `<iframe sandbox="allow-scripts allow-same-origin" src={url}>`
- "Virtual Tour" badge on listing card if `virtual_tour_url` is set
- "360° View" button in photo gallery header

#### 2.5.3 Property Badges on Cards
Ensure card badges are implemented correctly:
- **NEW**: listed in last 7 days
- **INSPECTION**: has an upcoming inspection in next 7 days
- **AUCTION**: `sale_method = 'auction'` + `auction_at` in future
- **UNDER OFFER**: `status = 'under_contract'`
- **VIRTUAL TOUR**: `virtual_tour_url` is set
Only show highest priority badge (one at a time).

#### 2.5.4 BHK Config Display
- Add `bhk_config TEXT` to `properties` table
- Display override: "2 BHK", "3 BHK + Study" (agent enters this)
- Falls back to beds count if not set
- Show on cards and detail page

#### 2.5.5 Price History on Detail Page
- Show `PriceHistoryChart` below sold history section
- Only renders if price history records exist for this address

---

### 2.6 User Account Enhancements (P1)

#### 2.6.1 Recently Viewed Properties
- localStorage for guests (last 20, array of property IDs)
- Sync to `recently_viewed` DB table on login
- `/account/history` page — grid of recently viewed cards
- "Recently viewed" section on homepage (below hero, only if logged in)

#### 2.6.2 Enquiry History
- `/account/enquiries` page — list of all enquiries sent by the user
- Each item: property thumbnail, address, sent date, agent name, message preview
- "View property" link per item

#### 2.6.3 Notes on Saved Properties
- Was deferred in Phase 1. Implement now.
- `collection_properties.notes TEXT` already in DB
- Edit notes inline on CollectionsPage (click → textarea → save)
- MAX_NOTES_LENGTH = 500 chars (already a constant)

#### 2.6.4 Offer History
- `/account/offers` — list of offers submitted by user
- Columns: property, amount offered, status, date

---

### 2.7 Offer Management (P1)

**Buyer submits offer:**
- "Make an Offer" button on listing page (only for active buy listings)
- Modal: offer amount (INR), message (optional), confirm
- Creates `offers` row, emails agent

**Agent views offers:**
- `/dashboard/offers` — offer inbox
- Columns: property, buyer name, amount, message, date, status
- Actions: Accept / Reject / Mark under contract (triggers status change)

---

### 2.8 Agent & Agency Directory (P1)

#### 2.8.1 Agent Directory (`/agents`)
- Already built — enhance with suburb filter search
- Search input: filter by suburb name
- Sort: by listings count, by experience

#### 2.8.2 Agent Profile Page (`/agent/:slug`) — Full Implementation
- Hero: headshot, name, agency name + logo, license badge
- Bio section
- Stats strip: active listings, sold last 12m, avg days on market
- Active listings grid (reuse PropertyCard)
- Sold listings tab (sold cards)
- "Contact this agent" button → enquiry modal
- Agency branding section

#### 2.8.3 Agency Profile Page (`/agency/:slug`) — New
- Agency logo, name, address, website, phone
- All agents in this agency (agent cards)
- All active listings (property grid)
- "Contact agency" button

---

### 2.9 Suburb Market Insights — Enhanced (P1)

Wire the existing SuburbPage stub + add sold aggregations:

**Sections:**
- Stats strip: median sale, median rent, days on market, for-sale count
- Price trend chart (houses vs units, 1Y/3Y/5Y)
- Sold market data: clearance rate, sale method split, # sales
- Schools list (PostGIS radius query)
- Properties for sale grid (pre-filtered search results)
- Supply vs demand indicator (new listings vs sold ratio)

---

### 2.10 Agency Profile Page (P2)

New page at `/agency/:slug`:
- Agency details from `agencies` table
- Agents list
- All active listings
- "Join this agency" CTA (triggers agent signup flow with agency pre-selected)

---

## 3. Database Changes

### New Tables

```sql
-- Price history per property address
CREATE TABLE property_price_history (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id  UUID NOT NULL,        -- properties.id
  address_key  TEXT NOT NULL,        -- normalised address for matching
  sold_price   INT NOT NULL,
  sold_date    DATE NOT NULL,
  sale_method  sale_method,
  is_seed_data BOOLEAN NOT NULL DEFAULT FALSE,
  source       TEXT DEFAULT 'internal',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_price_history_property ON property_price_history(property_id);
CREATE INDEX idx_price_history_address  ON property_price_history(address_key);

-- Buyer/renter offers
CREATE TABLE offers (
  id           UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id  UUID          NOT NULL,
  agent_id     UUID          NOT NULL,
  sender_id    UUID,
  sender_name  TEXT          NOT NULL,
  sender_email TEXT          NOT NULL,
  sender_phone TEXT,
  amount       INT           NOT NULL,
  message      TEXT,
  status       TEXT          NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','accepted','rejected','withdrawn')),
  is_confidential BOOLEAN    NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_offers_agent_id    ON offers(agent_id);
CREATE INDEX idx_offers_property_id ON offers(property_id);

-- Recently viewed (authenticated users)
CREATE TABLE recently_viewed (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL,
  property_id UUID NOT NULL,
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, property_id)
);
CREATE INDEX idx_recently_viewed_user ON recently_viewed(user_id, viewed_at DESC);

-- Agent certifications
CREATE TABLE agent_certifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id   UUID NOT NULL,
  doc_name   TEXT NOT NULL,
  doc_url    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### New Columns on Existing Tables

```sql
-- properties
ALTER TABLE properties ADD COLUMN virtual_tour_url TEXT;
ALTER TABLE properties ADD COLUMN bhk_config TEXT;
ALTER TABLE properties ADD COLUMN feature_order SMALLINT;
ALTER TABLE properties ADD COLUMN sold_price_is_confidential BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN under_contract_at TIMESTAMPTZ;

-- agents
ALTER TABLE agents ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE agents ADD COLUMN verified_at TIMESTAMPTZ;
ALTER TABLE agents ADD COLUMN license_doc_url TEXT;
ALTER TABLE agents ADD COLUMN slug TEXT;
CREATE UNIQUE INDEX idx_agents_slug ON agents(slug) WHERE slug IS NOT NULL;

-- agencies
ALTER TABLE agencies ADD COLUMN slug TEXT;
CREATE UNIQUE INDEX idx_agencies_slug ON agencies(slug) WHERE slug IS NOT NULL;

-- profiles
ALTER TABLE profiles ADD COLUMN pending_agent_since TIMESTAMPTZ;
```

### Enum Changes

```sql
-- Must run FIRST before any other Phase 2 migration
ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'under_contract';
```

---

## 4. New Routes

```
/become-an-agent          Agent self-signup wizard
/agent/:slug              Agent profile (full — was stub)
/agency/:slug             Agency profile (new)
/account/history          Recently viewed properties
/account/enquiries        Enquiry history
/account/offers           Offer history
/dashboard/offers         Agent offer inbox
```

---

## 5. Phase 2 Implementation Status Tracker

| Session | Feature | Status |
|---|---|---|
| 2-A | DB migrations + enum change | Pending |
| 2-B | MapLibre migration | Pending |
| 2-C | Wire Suburb page (Phase 6 stub) | Pending |
| 2-D | Wire Agent Dashboard (Phase 8 stub) | Pending |
| 2-E | Agent self-signup flow | Pending |
| 2-F | Sold search + detail page | Pending |
| 2-G | Price history chart + suburb aggregations | Pending |
| 2-H | Floor plan, virtual tour, badges, BHK | Pending |
| 2-I | Recently viewed, enquiry history, notes | Pending |
| 2-J | Offer management (submit + agent inbox) | Pending |
| 2-K | Agent profile page (full) | Pending |
| 2-L | Agency profile page (new) | Pending |
| 2-M | Agent analytics dashboard | Pending |
| 2-N | Phase 9 polish + performance | Pending |
| 2-O | Phase 10 deploy + E2E | Pending |
