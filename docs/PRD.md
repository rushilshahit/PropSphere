# Product Requirements Document
## PropSphere — Real Estate Marketplace

**Version:** 1.0  
**Status:** Draft  
**Reference:** realestate.com.au clone with modernised stack

---

## 1. Executive Summary

PropSphere is a full-stack real estate marketplace enabling buyers, renters, sellers, and agents to discover, list, and transact residential property. The platform covers property search, listing management, suburb intelligence, finance tooling, and agent profiles.

---

## 2. User Roles

| Role | Description |
|---|---|
| `buyer` | Searches for properties to purchase |
| `renter` | Searches for rental properties |
| `seller` | Lists owned properties (via agent) |
| `agent` | Licensed real estate professional managing listings |
| `admin` | Internal platform operator |

---

## 3. Feature Modules

### 3.1 Property Search (Priority: P0)

**Requirements:**
- Tab navigation: Buy / Rent / Sold / Commercial
- Location input with autocomplete (suburb, postcode, street)
- Filter set:
  - Price range (min/max slider)
  - Bedrooms (1, 2, 3, 4, 5+)
  - Bathrooms (1, 2, 3+)
  - Car spaces (1, 2, 3+)
  - Property type (House, Apartment, Townhouse, Unit, Land, Rural)
  - Land size range
  - Keywords
  - Features (pool, garage, pet-friendly, furnished)
- Sort: Newest, Price Low–High, Price High–Low, Inspection time
- Pagination (infinite scroll + page number)
- Saved search: persist filter state with name
- Radius search from map pin

**Acceptance Criteria:**
- Results update within 300ms of filter change (debounced 200ms)
- Location autocomplete returns results within 150ms
- Search state syncs to URL query params (shareable links)
- Empty state with helpful prompt shown when 0 results

---

### 3.2 Property Listing Page (Priority: P0)

**Requirements:**
- Full-screen photo carousel with thumbnail strip
- Virtual tour / video embed (YouTube/Vimeo iframe)
- Floor plan viewer
- Property stats panel: beds, baths, car, land size (m²), building size (m²)
- Price display: fixed price / range / "Contact agent" / "Auction"
- Rich text description
- Feature checklist (categorised: indoor, outdoor, heating/cooling)
- Inspection times list with "Add to calendar" (generates .ics)
- Auction countdown timer when applicable
- Days on market badge
- Agent card: photo, name, agency, phone, email
- Enquiry form (modal): name, email, phone, message
- Share: copy link, native share API
- Save to collection button
- User notes (authenticated only)
- Similar properties carousel (same suburb, similar price ±20%)
- Sold history for that address
- Map embed showing property location + nearby amenities toggle

**Acceptance Criteria:**
- Page loads with LCP < 2.5s (Core Web Vitals)
- Enquiry form submits and agent receives email within 30s
- Calendar ICS file downloads correctly on iOS, Android, desktop
- Photos lazy load, first photo preloaded

---

### 3.3 Map View (Priority: P0)

**Requirements:**
- Split view: list left, map right (toggleable)
- Full-screen map mode
- Property pins with price labels
- Cluster markers that expand on zoom
- Clicking pin shows mini property card
- Draw search area (polygon / freehand)
- Map layers toggle: Schools, Transport, Flood zones
- "Search this area" button after panning
- Current location button (Geolocation API)

---

### 3.4 Saved Searches & Alerts (Priority: P1)

**Requirements:**
- Save any search with a name
- Configurable alert frequency: instant / daily / weekly
- New listing alert email: matching properties
- Price drop alert on saved properties
- Open inspection reminder (24h before)
- In-app notification centre

---

### 3.5 Collections / Shortlisting (Priority: P1)

**Requirements:**
- Save property to default "Saved" or named collection
- Create / rename / delete collections
- Notes per saved property (max 500 chars)
- Share collection via link (public view, no auth required)
- Compare mode: side-by-side up to 4 properties
  - Compare: price, beds/baths, land size, suburb median, school ratings

---

### 3.6 Suburb Profiles (Priority: P1)

**Requirements:**
- Median sale price (house/unit split)
- Median rent price
- Price trend chart (12m, 3y, 5y)
- Average days on market
- Supply vs demand indicator
- Demographics (age groups, household types — ABS data)
- Lifestyle amenities (schools, cafes, transport via Foursquare/OSM)
- School catchment zones overlay

---

### 3.7 Finance Tools (Priority: P1)

**Requirements:**
- Repayment calculator: loan amount, interest rate, term → monthly payment
- Borrow capacity calculator: income, expenses, dependants → max loan
- Stamp duty calculator: state, property value, first-home buyer flag → duty amount
- All calculators client-side only (no API call required)
- "Get pre-approval" CTA links to partner lender landing page

---

### 3.8 Agent Profiles (Priority: P1)

**Requirements:**
- Bio, headshot, contact details
- Active listings grid
- Sold listings (last 12 months)
- Agency branding (logo, colours)
- Star rating + written reviews (buyers/renters submit)
- Contact form

---

### 3.9 Listing Management for Agents (Priority: P1)

**Requirements:**
- Create listing wizard (multi-step form):
  1. Property details
  2. Photos/media upload
  3. Features & description
  4. Pricing & method of sale
  5. Inspection times
  6. Preview & publish
- Edit published listing
- Photo reordering (drag and drop)
- Set listing as Sold/Leased
- View enquiries inbox (threaded)
- Boost listing (flag for paid feature — UI only in v1, no payment)

---

### 3.10 Auth & User Account (Priority: P0)

**Requirements:**
- Sign up / log in: email+password, Google OAuth, Apple OAuth
- Profile type selection post-registration
- Saved searches management page
- Collections management page
- Search history (last 20 searches, clearable)
- Inspection planner: calendar of upcoming open homes
- "My Property": track value of an owned address
- Account settings: email, password, notifications preferences

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
| SEO | Server-side rendered listing pages, suburb pages |

---

## 5. SEO Requirements

- SSR or SSG for:
  - Property listing pages (`/buy/vic/melbourne/house-123`)
  - Suburb profile pages (`/suburb/vic/richmond`)
  - Agent profile pages (`/agent/jane-doe-123`)
- OpenGraph + Twitter Card meta on all listing pages
- Structured data: `schema.org/RealEstateListing`
- Canonical URLs
- XML sitemap auto-generated
- Robots.txt

**Note:** This is a strong argument for Next.js over plain React. See `docs/DISCUSSION.md`.

---

## 6. Out of Scope (v1)

- Native mobile app
- Auction live bidding
- In-app payment / agent subscription billing
- Full rental application (Snug-style)
- AI photo captions
- ML-based property valuation
- Commercial property (full feature set)
- International listings

---

## 7. Success Metrics (v1 Launch)

- Listings indexed: 1,000+ (seeded data)
- Search response p95: < 300ms
- Enquiry form submission rate: > 3% of listing page visitors
- Core Web Vitals: all green
- Zero P0 bugs at launch
