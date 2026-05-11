# Phase 1-HOME Prompt — Homepage
# Paste _shared-context.md above this, then use this section.
# Insert this phase BETWEEN Phase 0 and Phase 1 (Search).
# Prerequisite: Phase 0 complete. App shell, Header, router exist.

---

## Phase Goal
A fully featured, conversion-optimised homepage that mirrors realestate.com.au's homepage
structure. Sections: hero search, market snapshot, recent listings, suburb explorer,
featured properties, finance tools CTA, agent finder teaser, market news, footer.
No new backend modules needed — reuses existing endpoints from Phase 1 (search) and
Phase 6 (suburbs). Backend endpoints needed here are minimal and noted explicitly.

---

## Section Map (top to bottom)

```
1. Header (already built in Phase 0)
2. Hero — search bar + listing type tabs + popular suburbs
3. Market Snapshot — 3 live stats
4. Recent Listings — "Just listed in your area" carousel
5. Explore by Suburb — card grid with suburb images + stats
6. Featured Properties — "Featured listings" carousel (is_featured = true)
7. How It Works — 3-step explainer with illustrations
8. Finance Tools CTA — calculator teaser with quick result
9. Agent Finder Teaser — "Find an agent" section
10. Market News — 3 editorial cards (static/seeded content)
11. Footer
```

---

## Session HOME-A — Hero Section

### Task
Build the hero section: the most important part of the page.

**`apps/web/src/features/home/components/Hero.tsx`**

**Structure:**
```
<section> — full-width, min-h-[520px] md:min-h-[600px]
  Background: gradient overlay on a high-quality city/street photo
  gradient: linear-gradient(135deg, rgba(26,86,219,0.85) 0%, rgba(14,27,77,0.90) 100%)
  Background image: use Unsplash source URL for a city skyline placeholder:
    https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1600&q=80
  background-size: cover, background-position: center

  Content — centred, max-w-3xl mx-auto px-4 py-16 md:py-24 text-center:
    1. Tagline: "Find your place." — display text, white, mb-2
    2. Subtitle: "Search thousands of properties for sale and rent across India." — body-lg, white/80, mb-8
    3. SearchWidget (see below)
    4. Popular suburbs chips row
```

**`apps/web/src/features/home/components/SearchWidget.tsx`**
- White card: `bg-white rounded-[16px] shadow-modal p-3 md:p-4`
- Row 1: Listing type tabs (Buy / Rent / Sold) — pill switcher from design system
- Row 2 (desktop): `flex gap-2 items-center`
  - Location input (flex-1): MapPin icon, placeholder "Search suburb, postcode...", opens autocomplete dropdown (reuse `useSuburbAutocomplete` from Phase 1)
  - "Search" button (brand-primary, lg size, min-w-[120px])
- Mobile: stacked (input full-width, button full-width below)
- On submit: navigate to `/{listingType}?query={location}`
- Autocomplete dropdown: same as SearchBar in Phase 1 — reuse the hook, build a slimmer UI here

**Popular suburbs chips (below SearchWidget):**
```tsx
const POPULAR_SUBURBS = [
  { label: 'Navrangpura', query: 'Navrangpura' },
  { label: 'Satellite', query: 'Satellite' },
  { label: 'Bopal', query: 'Bopal' },
  { label: 'Vastrapur', query: 'Vastrapur' },
  { label: 'Prahlad Nagar', query: 'Prahlad Nagar' },
]
```
- Chips: `bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-badge px-3 py-1.5 text-sm hover:bg-white/30 transition cursor-pointer`
- Clicking a chip: set location in search state and navigate

### End state check
Hero renders with background image + gradient. Tabs switch. Autocomplete works. Popular chips navigate.

---

## Session HOME-B — Market Snapshot + Recent Listings

### Task
Live stats strip and the "Just listed" carousel.

**`apps/web/src/features/home/components/MarketSnapshot.tsx`**

Stats strip immediately below hero, full-width, `bg-white border-b border-neutral-200`.

Three stat boxes in a row (`grid grid-cols-3 divide-x divide-neutral-200 max-w-4xl mx-auto`):

| Stat | Value source | Label |
|---|---|---|
| Properties for sale | `GET /home/stats` → `forSaleCount` | "Properties for sale" |
| Properties for rent | `GET /home/stats` → `forRentCount` | "Properties for rent" |
| Sold last 30 days | `GET /home/stats` → `soldLast30` | "Sold last 30 days" |

- Each box: `py-5 px-6 text-center`
- Number: `text-3xl font-bold tabular-nums text-brand-primary`
- Label: `text-sm text-neutral-500 mt-1`
- Numbers animate in with count-up on first scroll into view (`IntersectionObserver` + `useCountUp` hook)

**`apps/web/src/features/home/hooks/useCountUp.ts`**
- Args: `target: number, duration: number = 1200`
- Returns current count that animates from 0 → target over duration ms
- Only starts when `enabled = true` (triggered by intersection observer)

**`apps/web/src/api/home.ts`** — new file:
- `useHomeStats()` — `useQuery`, `GET /api/home/stats`, staleTime: 5 minutes
- `useRecentListings()` — `useQuery`, `GET /api/home/recent`, staleTime: 60s
- `useFeaturedListings()` — `useQuery`, `GET /api/home/featured`, staleTime: 60s

**`apps/web/src/features/home/components/RecentListings.tsx`**

Section: "Just Listed"

```
<section className="py-12 md:py-16 bg-neutral-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <SectionHeader title="Just Listed" subtitle="Fresh to market in Ahmedabad" />
    <ListingCarousel listings={recentListings} />
    <ViewAllLink to="/buy?sortBy=newest" label="View all new listings" />
  </div>
</section>
```

**`apps/web/src/features/home/components/ListingCarousel.tsx`**
- Props: `listings: PropertySummary[]`, `loading?: boolean`
- Horizontal scroll container: `flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scroll-smooth`
- Each item: `shrink-0 w-[280px] md:w-[320px] snap-start`
- Renders `<PropertyCard compact />` per item
- Scroll arrows (ChevronLeft/Right) on desktop, hidden on mobile:
  - Absolutely positioned left/right of the container
  - `bg-white shadow-card rounded-full p-2 hover:shadow-card-hover`
  - `onClick`: `containerRef.current.scrollBy({ left: ±340, behavior: 'smooth' })`
- Loading: 4 card-shape skeletons
- Arrow visibility: hide left when at start, hide right when at end (track scroll position)

**`apps/web/src/features/home/components/SectionHeader.tsx`**
- Props: `title: string`, `subtitle?: string`, `action?: ReactNode`
- `flex justify-between items-end mb-6`
- Title: H2, subtitle: body-md neutral-500

**`apps/web/src/features/home/components/ViewAllLink.tsx`**
- Props: `to: string`, `label: string`
- `mt-6 text-center` — text link with ChevronRight, brand-primary colour

### Backend: `HomeModule`
New minimal module — only aggregation queries, no new tables.

```
apps/api/src/modules/home/
├── home.module.ts
├── home.controller.ts
└── home.service.ts
```

**`GET /home/stats`**
```typescript
// Three parallel count queries
const [forSale, forRent, sold30] = await Promise.all([
  supabase.from('properties').select('id', { count: 'exact', head: true })
    .eq('status', 'active').eq('listing_type', 'buy'),
  supabase.from('properties').select('id', { count: 'exact', head: true })
    .eq('status', 'active').eq('listing_type', 'rent'),
  supabase.from('properties').select('id', { count: 'exact', head: true })
    .eq('status', 'sold')
    .gte('sold_at', new Date(Date.now() - 30 * 86400000).toISOString()),
]);
return { forSaleCount: forSale.count, forRentCount: forRent.count, soldLast30: sold30.count };
```

**`GET /home/recent`**
```typescript
// 8 most recently published active properties
.select(PROPERTY_SUMMARY_COLUMNS)
.eq('status', 'active')
.order('published_at', { ascending: false })
.limit(8)
// + hero image join (same pattern as search)
```

**`GET /home/featured`**
```typescript
// Properties where is_featured = true
.eq('is_featured', true).eq('status', 'active').limit(6)
```

### End state check
Stats animate in on scroll. Recent listings carousel scrolls with arrows. 8 seeded properties appear.

---

## Session HOME-C — Explore by Suburb

### Task
Suburb discovery grid with visual cards.

**`apps/web/src/features/home/components/SuburbExplorer.tsx`**

Section: "Explore Popular Suburbs"

```
<section className="py-12 md:py-16 bg-white">
  ...
  <SectionHeader title="Explore Popular Suburbs" subtitle="Discover what's happening in your area" />
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
    {suburbs.map(s => <SuburbCard suburb={s} />)}
  </div>
</section>
```

**`apps/web/src/features/home/components/SuburbCard.tsx`**
- Props: `suburb: SuburbCardData`
```typescript
interface SuburbCardData {
  id: string
  name: string
  state: string
  slug: string
  lat: number
  lng: number
  medianSalePrice?: number
  activeListingCount: number
  heroImageUrl: string  // static Unsplash URL keyed to suburb
}
```
- Card: `relative rounded-card overflow-hidden cursor-pointer group aspect-[4/3]`
- Background: suburb image (from static map or Unsplash placeholder)
- Gradient overlay: `absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent`
- Bottom content (absolute, bottom-0, p-3 text-white):
  - Suburb name: `text-base font-semibold`
  - Median price: `text-sm opacity-80` — formatted with `formatPrice`
  - Listing count: `text-xs opacity-70` — "42 properties"
- Hover: `group-hover:scale-105 transition-transform duration-300` on image
- Click: navigate to `/suburb/${state}/${slug}`

**Suburb hero images** — static mapping (no API needed):
```typescript
// apps/web/src/features/home/data/suburb-images.ts
export const SUBURB_IMAGES: Record<string, string> = {
  navrangpura: 'https://images.unsplash.com/photo-1582407947304-fd86f28f7fc4?w=600&q=80',
  satellite:   'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80',
  bopal:       'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80',
  vastrapur:   'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80',
  'prahlad-nagar': 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=600&q=80',
  'sg-highway': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  thaltej:     'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80',
  gota:        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
}
```

**Backend: `GET /home/suburbs`**
```typescript
// Top 8 suburbs by active listing count
const suburbs = await supabase
  .from('suburbs')
  .select('id, name, state, slug, lat, lng, median_sale_price')
  .limit(8);

// For each: count active listings
// Return SuburbCardData[] with activeListingCount
```

**`apps/web/src/api/home.ts`** — add:
- `useHomeSuburbs()` — `GET /api/home/suburbs`, staleTime: 5 min

### End state check
8 suburb cards render with images and overlay text. Click navigates to suburb page (even if stub in Phase 1).

---

## Session HOME-D — Featured Listings + How It Works

### Task
Featured properties carousel and the "How it works" explainer section.

**`apps/web/src/features/home/components/FeaturedListings.tsx`**

Section: "Featured Properties"

- Only renders if `featuredListings.length > 0`
- Same `<ListingCarousel>` component from HOME-B
- Card gets a "Featured" badge overlay (gold star icon + "Featured" text, `bg-yellow-400 text-yellow-900`)
- Section bg: `bg-neutral-50`
- SectionHeader: "Featured Properties" + subtitle "Hand-picked listings from our agents"

**`apps/web/src/features/home/components/HowItWorks.tsx`**

Section: "How PropSphere Works"

```
<section className="py-16 bg-brand-primary">
  text-white text-center

  SectionHeader (white text): "Find your dream home in 3 steps"

  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 max-w-4xl mx-auto">
    {steps.map(step => <StepCard />)}
  </div>
</section>
```

Steps data:
```typescript
const STEPS = [
  {
    number: '01',
    icon: Search,           // lucide-react
    title: 'Search',
    description: 'Browse thousands of verified listings with powerful filters. Search by suburb, price, bedrooms, and more.',
  },
  {
    number: '02',
    icon: Heart,
    title: 'Save & Compare',
    description: 'Save your favourite properties to collections and compare them side-by-side to make smarter decisions.',
  },
  {
    number: '03',
    icon: MessageSquare,
    title: 'Enquire',
    description: 'Contact agents directly from any listing. Get responses fast and arrange inspections with ease.',
  },
]
```

**`StepCard`** (inline sub-component):
- White circle with step number bottom-right: `relative`
- Icon: `w-10 h-10 text-white mb-4`
- Number: `absolute -bottom-2 -right-2 text-xs font-bold bg-white/20 rounded-full w-6 h-6 flex items-center justify-center`
- Title: `text-xl font-semibold text-white mt-2 mb-2`
- Description: `text-white/75 text-sm leading-relaxed`
- Optional: subtle connecting line between steps on desktop (CSS `::after` pseudo, white/20)

### End state check
Featured carousel shows `is_featured=true` properties (update 2–3 seed records: `UPDATE properties SET is_featured = true WHERE ...`).
How It Works section renders correctly on all breakpoints.

---

## Session HOME-E — Finance CTA + Agent Finder + News + Footer

### Task
Lower homepage sections and the full footer.

**`apps/web/src/features/home/components/FinanceCTA.tsx`**

Section: "Work out what you can borrow"

```
<section className="py-12 md:py-16 bg-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="bg-gradient-to-r from-brand-primary to-[#1239A0] rounded-[20px] p-8 md:p-12
                    grid md:grid-cols-2 gap-8 items-center">
      Left: text content
      Right: mini inline calculator
    </div>
  </div>
</section>
```

Left content:
- "Work out what you can borrow" — H2, white
- "Use our free calculators to estimate your borrowing capacity, monthly repayments, and stamp duty." — body, white/80
- "Try the calculators →" — ghost button (white border, white text)
- Clicking navigates to `/finance`

Right: `MiniRepaymentCalculator` (inline, no tab, simplified):
- Single loan amount input (slider only, ₹10L to ₹3Cr)
- Fixed rate: 8.5% p.a., fixed term: 20 years
- Output: "Est. monthly repayment: **₹X**" — large white number, updates live
- Uses `calcMonthlyRepayment` from `@propsphere/utils`
- "See full breakdown →" link → `/finance`

**`apps/web/src/features/home/components/AgentFinderTeaser.tsx`**

Section: "Find a local expert"

```
<section className="py-12 md:py-16 bg-neutral-50">
  grid md:grid-cols-2 gap-12 items-center max-w-7xl mx-auto

  Left: illustration placeholder (grey rounded box 400x300, "Agent illustration" label)
  Right:
    - "Connect with top local agents" — H2
    - "Our agents know every street, every suburb. Get expert advice from someone who lives and breathes your market." — body
    - Search input: placeholder "Search by suburb..." + "Find an agent" button → /agents?suburb=X
    - Three agent avatar stubs (grey circles) + "500+ verified agents" caption
```

**`apps/web/src/features/home/components/MarketNews.tsx`**

Section: "Market Insights"

Three static editorial cards (no CMS, hardcoded for v1):

```typescript
const NEWS_ARTICLES = [
  {
    id: '1',
    category: 'MARKET UPDATE',
    title: 'Ahmedabad property prices rise 8% in Q1 2025',
    excerpt: 'Western suburbs like Bopal and Thaltej continue to lead growth as infrastructure investment drives demand.',
    readTime: '3 min read',
    imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80',
    publishedAt: '2025-04-10',
  },
  {
    id: '2',
    category: 'BUYING GUIDE',
    title: 'First-time buyer guide: navigating stamp duty in Gujarat',
    excerpt: 'Everything you need to know about stamp duty rates, exemptions, and registration fees for property buyers in Gujarat.',
    readTime: '5 min read',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80',
    publishedAt: '2025-03-28',
  },
  {
    id: '3',
    category: 'RENTING',
    title: 'Rental vacancy rates hit 5-year low across Ahmedabad',
    excerpt: 'Strong demand from IT sector employees is pushing rents higher in Navrangpura and SG Highway corridors.',
    readTime: '4 min read',
    imageUrl: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=600&q=80',
    publishedAt: '2025-03-15',
  },
]
```

**`NewsCard`** (inline sub-component):
- Image (aspect-[16/9] rounded-t-card overflow-hidden)
- Category pill: `text-xs font-semibold uppercase tracking-wide text-brand-primary bg-brand-primary/10 rounded px-2 py-0.5`
- Title: H4, 2 lines max (`line-clamp-2`)
- Excerpt: body-md neutral-500, 3 lines max (`line-clamp-3`)
- Read time + date: caption, neutral-400, flex justify-between
- Full card is a link (no route — `href="#"` in v1, real article pages in v2)
- Hover: card lifts (shadow-card-hover)

Grid: `grid grid-cols-1 md:grid-cols-3 gap-6`

---

**`apps/web/src/components/layout/Footer.tsx`** (replace stub from Phase 0)

Full footer with 4-column layout + bottom bar:

```
bg-neutral-900 text-white

Top section (py-12):
  grid grid-cols-2 md:grid-cols-4 gap-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8

  Column 1 — Brand:
    PropSphere logo (white version)
    "Find your place." tagline
    "The easiest way to buy, rent, and sell property in India."
    Social icons: Instagram, Facebook, LinkedIn, Twitter (lucide-react)

  Column 2 — Buy & Rent:
    "Buy"
    Links: Properties for Sale, New Listings, Auctions, Open Inspections
    "Rent"
    Links: Properties for Rent, Recently Listed

  Column 3 — Tools & Info:
    "Tools"
    Links: Repayment Calculator, Stamp Duty Calculator, Borrow Capacity
    "Information"
    Links: Suburb Profiles, Market News, Buying Guide

  Column 4 — Agents:
    "Agents"
    Links: Find an Agent, List Your Property, Agent Login
    "Company"
    Links: About Us, Contact, Privacy Policy, Terms of Use

Bottom bar (py-4 border-t border-neutral-800):
  flex justify-between items-center text-sm text-neutral-400
  Left: "© 2025 PropSphere. All rights reserved."
  Right: "Privacy Policy · Terms of Use · Contact"
```

Link style: `text-neutral-400 hover:text-white transition-colors text-sm`
Section header: `text-white font-semibold text-sm uppercase tracking-wide mb-3`

---

**`apps/web/src/features/home/pages/HomePage.tsx`** — Final assembly

```tsx
export function HomePage() {
  return (
    <main>
      <Hero />
      <MarketSnapshot />
      <RecentListings />
      <SuburbExplorer />
      <FeaturedListings />
      <HowItWorks />
      <FinanceCTA />
      <AgentFinderTeaser />
      <MarketNews />
    </main>
  )
}
```

- Update `router.tsx` `/` route to render `<HomePage />`
- Lazy load: `const HomePage = React.lazy(() => import('./features/home/pages/HomePage'))`

### End state check
Full homepage renders top to bottom. Mini calculator updates live. Footer links are correct paths. All sections responsive at 375px mobile.

---

## Full Homepage Checklist
```
[ ] Hero section (SearchWidget + tabs + popular chips + background image)
[ ] useSuburbAutocomplete in SearchWidget
[ ] MarketSnapshot (3 stats with count-up animation)
[ ] useCountUp hook
[ ] useHomeStats hook + GET /home/stats
[ ] RecentListings section
[ ] ListingCarousel (with scroll arrows)
[ ] SectionHeader + ViewAllLink shared components
[ ] useRecentListings hook + GET /home/recent
[ ] SuburbExplorer grid
[ ] SuburbCard (image overlay + stats)
[ ] suburb-images.ts static mapping
[ ] useHomeSuburbs hook + GET /home/suburbs
[ ] FeaturedListings carousel
[ ] useFeaturedListings hook + GET /home/featured
[ ] HowItWorks (3-step, brand-primary bg)
[ ] FinanceCTA (gradient card + MiniRepaymentCalculator)
[ ] AgentFinderTeaser
[ ] MarketNews (3 static cards)
[ ] Footer (4-column + bottom bar)
[ ] HomePage assembly
[ ] HomeModule: /home/stats, /home/recent, /home/featured, /home/suburbs
[ ] Update seed: mark 2-3 properties is_featured = true
[ ] router.tsx `/` → HomePage (lazy loaded)
```

---

## Notes on Dependencies

- `SearchWidget` needs `useSuburbAutocomplete` → build Phase 1 Session 1-D first, OR stub it as a plain input for now and wire it after Phase 1-D is done.
- `ListingCarousel` uses `PropertyCard` → build Phase 1 Session 1-C first.
- `FinanceCTA` uses `calcMonthlyRepayment` → needs `packages/utils` from Phase 0.
- `SuburbCard` links to `/suburb/:state/:slug` → that page is built in Phase 6, but the link can be placed now.
- `Footer` links to `/finance`, `/account/*`, `/dashboard` — routes exist from Phase 0 router.

**Recommended build order:**
Phase 0 → HOME-A (hero stub, SearchWidget as plain input) → Phase 1-A,B,C,D → wire SearchWidget autocomplete → HOME-B,C,D,E → continue Phase 1-E onward.
