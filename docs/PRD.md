# Product Requirements Document
## PropSphere — Real Estate Marketplace

**Version:** 1.2
**Status:** In Development — Phases 1–7 + Admin Panel complete; Phases 8 (web) + 6 (web) pending
**Last Updated:** 2026-05-17
**Reference:** realestate.com.au clone targeting Ahmedabad / India

---

## 1. Executive Summary

PropSphere is a full-stack real estate marketplace enabling buyers, renters, sellers, and agents to discover, list, and transact residential property. The platform covers property search, listing management, suburb intelligence, finance tooling, agent profiles, and a separate admin panel for internal operators. The project is a Turborepo + pnpm monorepo with three apps: `apps/web` (public SPA), `apps/api` (NestJS backend), and `apps/admin` (admin SPA).

---

## 2. User Roles

| Role | Description |
|---|---|
| `buyer` | Searches for properties to purchase |
| `renter` | Searches for rental properties |
| `seller` | Lists owned properties (via agent) |
| `agent` | Licensed real estate professional managing listings |
| `admin` | Internal platform operator (accesses `apps/admin` only) |

---

## 3. Feature Modules

### 3.1 Home Page (Priority: P0) — **Built**

**Requirements:**
- Hero section with full-width search widget (Buy / Rent / Sold tabs + location input)
- Featured listings carousel (promoted properties)
- Recent listings grid
- Suburb Explorer section (browse by suburb)
- Market Snapshot section (summary stats)
- "How It Works" explainer section
- Finance CTA banner (links to `/finance`)
- Agent Finder teaser (links to `/agents`)
- Market News section

**Implementation Notes:**
- Route: `/`
- Components: Hero, SearchWidget, FeaturedListings, ListingCarousel, RecentListings, SuburbExplorer, SuburbCard, MarketSnapshot, HowItWorks, FinanceCTA, AgentFinderTeaser, MarketNews
- Data fed by `GET /home` API endpoint aggregating featured listings + suburb stats

---

### 3.2 Property Search (Priority: P0) — **Built**

**Requirements:**
- Tab navigation: Buy / Rent / Sold
- Location input with autocomplete (suburb, postcode)
- Filter set:
  - Price range (min/max)
  - Bedrooms (1, 2, 3, 4, 5+)
  - Bathrooms (1, 2, 3+)
  - Car spaces (1, 2, 3+)
  - Property type (House, Apartment, Townhouse, Unit, Land, Rural)
  - Land size range
  - Keywords
  - Features (pool, garage, pet-friendly, furnished)
- Sort: Newest, Price Low–High, Price High–Low
- Pagination (infinite scroll)
- Save search: persist filter state with name
- "Save this search" bell button in results header (visible when authenticated)

**Acceptance Criteria:**
- Results update within 300ms of filter change (debounced 200ms)
- Location autocomplete returns results within 150ms
- Search state syncs to URL query params (shareable links)
- Empty state shown when 0 results

**Routes:** `/buy`, `/rent`, `/sold`

---

### 3.3 Property Listing Page (Priority: P0) — **Built**

**Requirements:**
- Full-screen photo carousel with thumbnail strip
- Property stats panel: beds, baths, car, land size (m²), building size (m²)
- Price display: fixed price / range / "Contact agent" / "Auction"
- Rich text description
- Feature checklist (grouped: indoor, outdoor, heating/cooling)
- Inspection times list with "Add to calendar" (generates .ics)
- Auction countdown timer when applicable
- Days on market badge
- Agent card: photo, name, agency, phone, email
- Enquiry form (modal): name, email, phone, message → Resend email to agent
- Share: copy link, native share API
- Save to collection button
- Similar properties section (same suburb, similar price ±20%)
- Sold history for that address
- Map embed showing property location (Mapbox, no draw)
- Nearby places (schools, transport, cafes)
- Street View panel
- Commute calculator

**Acceptance Criteria:**
- Enquiry form submits and agent receives email within 30s
- Calendar ICS file downloads correctly
- Photos lazy-load; first photo preloaded

**Routes:** `/:listingType/:id`

---

### 3.4 Map View (Priority: P0) — **Built**

**Requirements:**
- Split view: list left (w-80), map right (toggleable on mobile)
- Property pins with price labels
- Cluster markers
- Clicking pin shows mini property card popup
- Draw search area (`@mapbox/mapbox-gl-draw`)
- Map layer toggle: Schools (green dot markers via PostGIS)
- "Current location" button (Geolocation API)
- Hover on list item highlights map pin

**Deferred:**
- Transport and Flood Zone layers (v2)
- Full supercluster implementation for cluster markers (v2)

**Route:** `/map`

---

### 3.5 Saved Searches & Alerts (Priority: P1) — **Built**

**Requirements:**
- Save any search with a name and alert frequency (Instant / Daily / Weekly)
- New listing alert: BullMQ job matches saved searches against newly active properties
- Price drop alert: BullMQ job checks price_alerts when a listing price decreases
- In-app notification centre: bell icon, unread badge (max "9+"), dropdown panel, relative timestamps
- Mark single / all notifications as read
- Notifications poll every 60s; FCM push notification if token available

**Deferred:**
- Open inspection reminder emails (v2)

**Routes:** `/account/searches`

---

### 3.6 Collections / Shortlisting (Priority: P1) — **Built**

**Requirements:**
- Save property to default "Saved" or named collection
- Create / rename / delete collections
- Share collection via link (public view, no auth required) — backend endpoint built; web route is stub
- Compare mode: side-by-side up to 4 properties (price, beds/baths, land size, suburb median)
- Notes per saved property — deferred to v2 (MAX_NOTES = 500 chars constant defined)

**Routes:** `/account/saved`, `/collections/shared/:token` (stub)

---

### 3.7 Suburb Profiles (Priority: P1) — **Backend built; Web pending**

**Requirements:**
- Median sale price, median rent price
- Price trend chart (12m / 3y / 5y) via Recharts
- Average days on market
- Properties for sale count
- Nearby schools list (sorted by distance, type badge, rating bar)
- "Properties for sale in [suburb]" section (search results pre-filtered)

**Implementation Status:**
- Backend: `GET /suburbs/:state/:slug`, `GET /suburbs/:id/price-history` — built
- Frontend: `SuburbPage` components exist (`SuburbStats`, `PriceTrendChart`, `SchoolsList`) but route `/suburb/:state/:slug` is a stub page — not yet wired

**Deferred:**
- Demographics (ABS data integration) — v2
- Lifestyle amenity map (Foursquare/OSM) — v2
- School catchment zone overlay — v2
- Supply vs demand indicator — v2

---

### 3.8 Finance Tools (Priority: P1) — **Built**

**Requirements:**
- Repayment calculator: loan amount, interest rate, term → monthly payment + donut chart (Principal vs Interest)
- Borrow capacity calculator: income, expenses, interest rate, term → max loan estimate
- Stamp duty calculator: state dropdown (Gujarat / Maharashtra / Karnataka / Delhi), property value, first-home buyer flag → duty + registration fee + total
- All calculators client-side only (no API call)
- "Get pre-approval" CTA links to partner lender landing page

**Implementation Notes:**
- Pure functions in `packages/utils`: `calcMonthlyRepayment`, `calcTotalRepayment`, `calcTotalInterest`, `calcBorrowCapacity`, `calcStampDuty`
- Unit tests for all three calculators
- Three-tab layout (Repayment / Borrow Capacity / Stamp Duty), two-column desktop (form left, result right)

**Route:** `/finance`

---

### 3.9 Agent Profiles (Priority: P1) — **Agents list built; Individual profile pending**

**Requirements:**
- Agents finder page: grid of agent cards (name, agency, photo, active listings count)
- Individual agent profile: bio, headshot, contact details, active listings grid, sold listings (last 12 months), agency branding

**Implementation Status:**
- `/agents` list page: built (`AgentsPage`)
- `/agent/:slug` individual profile: stub page

**Confirmed Out of Scope:**
- Agent star ratings and written reviews (removed from v1 scope)

---

### 3.10 Listing Management for Agents (Priority: P1) — **Backend built; Web pending**

**Requirements:**
- Create listing wizard (multi-step form):
  1. Property details (address, type, geocode via Mapbox)
  2. Photos/media upload (drag-and-drop, @dnd-kit reorder, captions, Supabase Storage)
  3. Features & description
  4. Pricing & method of sale (private treaty / auction / contact agent)
  5. Inspection times (add/remove slots)
  6. Preview & publish
- Listing management table (agent's own listings, status filter tabs)
- Enquiries inbox (email-client layout: list left, thread right)
- Agent dashboard home (stat cards: active listings, enquiries today, total views)

**Implementation Status:**
- Backend: `GET/POST/PATCH /properties`, `PATCH /properties/:id/status`, `POST /media/upload`, `GET /agents/me/listings`, `GET /agents/me/enquiries`, `GET /agents/me/stats` — built
- Frontend: `/dashboard/*` is a stub page — listing wizard, enquiries inbox, and dashboard pages not yet wired in `apps/web`

**Routes (planned):** `/dashboard`, `/dashboard/listings`, `/dashboard/listings/new`, `/dashboard/enquiries`

---

### 3.11 Auth & User Account (Priority: P0) — **Built**

**Requirements:**
- Sign up / log in: email + password, Google OAuth
- Profile type selection post-registration
- Saved searches management page (`/account/searches`)
- Collections management page (`/account/saved`)
- Notification centre (bell icon in header)

**Implementation Notes:**
- AuthProvider listens to Supabase `onAuthStateChange` → dispatches to Redux `authSlice`
- On login: fetches user profile + saved property IDs to hydrate Redux
- AuthModal: login + register + Google OAuth (react-hook-form + Zod)
- ProtectedRoute with role support
- Header: Sign in/Sign up → AuthModal; avatar dropdown (My Saved, Saved Searches, Sign out) when authenticated

**Confirmed Out of Scope:**
- Apple OAuth (not in Supabase auth providers for v1)
- Search history (last 20 searches) — v2
- Inspection planner calendar — v2
- "My Property" value tracker — v2
- Account settings (email/password/notifications) — v2

---

### 3.12 Admin Panel (Priority: P0) — **Built** (separate app at `apps/admin/`)

**Requirements:**
- Separate Vite SPA (port 3002) — admin code never ships in the public web bundle
- Email/password-only login (no OAuth); 30-minute inactivity timeout
- Role guard: `profile.role === 'admin'` check on every request
- All mutations write to `audit_logs` table (admin_id, admin_email, action, target jsonb)

**Feature Pages:**
| Section | Pages |
|---|---|
| Dashboard | Stats charts (listings by status, top suburbs, enquiries by day, registrations by day) |
| Properties | Properties list, multi-step property form |
| Agencies | Agencies list, agency form |
| Agents | Agents list, agent form |
| Users | Users list, user detail |
| Suburbs | Suburbs list with stats |
| Schools | Schools list, CSV bulk import |
| Enquiries | Enquiries list with status management |
| Notifications | Broadcast push notifications to users |
| Media | Media asset management |
| Featured | Featured listings with drag-and-drop reorder (`feature_order` column) |
| Analytics | Top searched suburbs, top keywords, refresh suburb stats trigger |

**Backend (`apps/api/src/modules/admin/`):**
- `AdminGuard` — bearer token + role check
- `AdminService` — all admin operations with audit logging
- `AdminController` — all endpoints under `/api/v1/admin/*`
- Dashboard RPC functions: `admin_listings_by_status`, `admin_top_suburbs`, `admin_enquiries_by_day`, `admin_registrations_by_day`
- Analytics RPC functions: `admin_top_searched_suburbs`, `admin_top_keywords`, `refresh_suburb_stats`

---

## 4. Non-Functional Requirements

| Concern | Target |
|---|---|
| LCP | < 2.5s |
| FID / INP | < 100ms |
| CLS | < 0.1 |
| Uptime | 99.9% |
| Search response | < 300ms p95 |
| Image load (first) | < 1s on 4G |
| Mobile responsive | All breakpoints from 375px |
| Accessibility | WCAG 2.1 AA |
| SEO | Client-side meta tags + OpenGraph (SPA — no SSR in v1) |

---

## 5. SEO Approach

**Confirmed approach:** Vite SPA — no SSR in v1. SEO is limited to:
- Client-side OpenGraph + Twitter Card meta tags on listing pages
- `schema.org/RealEstateListing` structured data (client-rendered)
- Canonical URLs
- Robots.txt

**Note:** Full SSR/SSG (Next.js migration) is a v2 backlog item. The original PRD referenced SSR as a requirement; this was superseded by the locked architecture decision to use Vite SPA for v1 to reduce build complexity.

---

## 6. Out of Scope (v1)

| Item | Notes |
|---|---|
| Native mobile app | v2+ |
| Auction live bidding | v2+ |
| In-app payment / agent subscription billing | v2+ |
| Full rental application (Snug-style) | Enquiry form only |
| AI photo captions | v2+ |
| ML-based property valuation | Sold history only |
| Commercial property (full feature set) | Deferred |
| International listings | Ahmedabad / India only |
| Apple OAuth | Google OAuth only in v1 |
| Agent star ratings and written reviews | Removed from v1 |
| Off-the-plan / project listings | v2+ |
| NABERS / sustainability ratings | v2+ |
| Inspection RSVP | Calendar (.ics) export only |
| Demographics on suburb pages (ABS data) | v2+ |
| Transport and flood zone map layers | v2+ |
| Search history (user account) | v2+ |
| Inspection planner calendar | v2+ |
| "My Property" value tracker | v2+ |
| SSR / Next.js | v2+ |
| Commute route search with live traffic | Basic commute calculator only |

---

## 7. Implementation Status

| Phase | Description | Status |
|---|---|---|
| Phase 0 | Project setup, monorepo, DB migrations, seed | Complete |
| Phase 1 | Core search (Buy/Rent/Sold, filters, URL sync) | Complete |
| Phase 2 | Listing detail page (gallery, enquiry, ICS, map) | Complete |
| Phase 3 | Map view (pins, draw area, schools layer) | Complete |
| Phase 4 | Auth (email + Google OAuth) + Collections (save, compare) | Complete |
| Phase 5 | Saved searches + alerts (BullMQ + FCM + notifications) | Complete |
| Phase 6 | Suburb profiles | Backend complete; web page stub |
| Phase 7 | Finance calculators (repayment, borrow capacity, stamp duty) | Complete |
| Phase 8 | Agent dashboard + listing wizard | Backend complete; web pages stub |
| Admin Panel | Separate admin app (port 3002) with 12 sections | Complete |
| Home Page | Rich landing page with search, listings, suburbs, market data | Complete |
| Phase 9 | Polish, performance, error boundaries, analytics | Pending |
| Phase 10 | Deploy (Vercel + Railway), E2E tests, launch | Pending |

---

## 8. Success Metrics (v1 Launch)

- Listings indexed: 1,000+ (seeded data)
- Search response p95: < 300ms
- Enquiry form submission rate: > 3% of listing page visitors
- Core Web Vitals: all green
- Zero P0 bugs at launch
- Admin panel: all CRUD operations functional with audit trail

---

## 9. v2 Backlog

- Next.js migration for full SSR/SEO
- Agent reviews and ratings
- Suburb profile web pages (wire existing backend + SuburbStats/PriceTrendChart components)
- Agent listing wizard in web app (wire existing backend)
- Agent dashboard in web app (wire existing backend)
- AI photo captions
- Full rental application (renter profile, documents)
- Agent subscription billing (Stripe)
- Flood zone map layer (NDMA open data)
- Virtual tour embed
- RERA registration number on listing
- BHK notation support
- Search history (last 20 searches, clearable)
- Inspection planner calendar
- "My Property" value tracker
- Demographics on suburb pages (ABS data)
