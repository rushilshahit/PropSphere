# Phase 2 Prompt — Listing Detail Page
# Paste _shared-context.md above this, then use this section.
# Prerequisite: Phase 1 complete. PropertyCard navigates to /:listingType/:id.

---

## Phase Goal
Full listing detail page. User sees photos, stats, agent details, inspection times, sold history, and can submit an enquiry. Agent receives an email on submit.

---

## Session 2-A — Types + API Hooks

### Task
Define `PropertyDetail` type and the data-fetching hooks for this page.

**`packages/types/src/property.ts`** — add `PropertyDetail` extending `PropertySummary`:
```typescript
interface PropertyDetail extends PropertySummary {
  unitNumber?: string
  streetNumber: string
  streetName: string
  description?: string
  features: { indoor: string[]; outdoor: string[]; climate: string[] }
  buildSizeSqm?: number
  availableFrom?: string
  auctionAt?: string
  soldAt?: string
  soldPrice?: number
  isFeatured: boolean
  viewCount: number
  enquiryCount: number
  publishedAt: string
  images: PropertyImage[]
  inspections: Inspection[]
  agent: Agent & { profile: Pick<Profile, 'fullName' | 'avatarUrl' | 'phone' | 'email'> }
  agency: Agency
}
interface Inspection {
  id: string
  type: 'open_home' | 'private'
  startsAt: string
  endsAt: string
  cancelled: boolean
}
```

**`apps/web/src/api/properties.ts`** — add:
- `useProperty(id: string)` — `useQuery`, `GET /api/properties/:id`, staleTime: 60s
- `useIncrementViewCount(id: string)` — fire-and-forget mutation on mount

**`apps/web/src/api/enquiries.ts`** — new file:
- `useCreateEnquiry()` — `useMutation`, `POST /api/enquiries`

### End state check
Types compile. Hooks exported from `api/`.

---

## Session 2-B — Photo Gallery

### Task
Build the photo carousel + lightbox.

**`apps/web/src/features/listing/components/PhotoGallery.tsx`**
- Props: `images: PropertyImage[]`
- Desktop layout: main large image (left 65%) + thumbnail strip (right 35%, max 4 visible + "+X more" overlay on last)
- Clicking main image or "View all" opens lightbox
- Lightbox: fixed full-screen overlay, black bg, image centred, ChevronLeft/Right arrows, X close, image counter "3 / 12", keyboard arrows work, click outside closes
- Mobile: full-width image, swipe hint dots below
- Images use Supabase transform URL: append `?width=1200&format=webp` for main, `?width=400&format=webp` for thumbnails
- First image: `loading="eager" fetchpriority="high"`. Rest: `loading="lazy"`
- Skeleton: show grey placeholder while first image loads

### End state check
Gallery renders seeded images. Lightbox opens/closes. Arrows navigate. Keyboard works.

---

## Session 2-C — Listing Page Components

### Task
Build all the content components for the listing page.

**`PropertyStats.tsx`** — Props: `property: PropertyDetail`
- Horizontal strip: BedDouble·{beds} · Bath·{baths} · Car·{cars} · Maximize2·{land}m² · (build size if present)
- Large bold numbers, neutral-500 labels below each

**`InspectionTimes.tsx`** — Props: `inspections: Inspection[]`
- List each inspection: day (e.g. "Sat 15 Feb"), time range (e.g. "10:00 – 10:30 AM"), "Add to calendar" button
- "Add to calendar": generates and downloads an `.ics` file
  - Use `ical-generator` package (`pnpm add ical-generator`)
  - Show `pnpm add ical-generator` command at top of response

**`AuctionCountdown.tsx`** — Props: `auctionAt: string`
- Only renders if `auctionAt` is in the future
- Live countdown: days / hours / minutes / seconds
- Updates every second via `setInterval` in `useEffect`
- Red accent colour when < 24h remaining

**`FeaturesList.tsx`** — Props: `features: PropertyDetail['features']`
- Three sections: Indoor / Outdoor / Climate & Energy
- Grid 3 columns, Check icon + label per feature
- Hidden if all arrays empty

**`SoldHistory.tsx`** — Props: `soldAt?: string`, `soldPrice?: number`
- Only renders if `soldPrice` is set
- Shows: "Last sold [date] for [price]"
- Simple card, no chart

**`AgentCard.tsx`** — Props: `agent: PropertyDetail['agent']`, `agency: PropertyDetail['agency']`
- Avatar, name, agency name + logo, phone number, email
- "Call" button (tel: link), "Email" button (opens EnquiryModal)

**`EnquiryModal.tsx`** — Props: `propertyId: string`, `agentId: string`, `isOpen: boolean`, `onClose: () => void`
- Fields: Name, Email, Phone (optional), Message (min 10 chars)
- Validation: react-hook-form + Zod
- Submit: calls `useCreateEnquiry()` mutation
- On success: toast "Enquiry sent!", close modal
- On error: show error below form, keep modal open

**`SimilarProperties.tsx`** — Props: `propertyId: string`, `suburbId: string`, `price: number`
- Calls `GET /api/properties/similar/:id` (see backend session)
- Horizontal scroll, max 6 cards, reuse `PropertyCard compact={true}`
- Skeleton: 3 card-shaped skeletons while loading

### End state check
All components render in isolation with mock props. No TS errors.

---

## Session 2-D — Listing Page Layout + Map Embed

### Task
Assemble the full listing page and add the map embed.

**`apps/web/src/features/listing/pages/ListingPage.tsx`**
- Route: `/:listingType/:id`
- Calls `useProperty(id)` + `useIncrementViewCount(id)`
- Loading state: skeleton layout (image placeholder, stat bars)
- Error state: "Property not found" + back to search button
- Desktop layout (lg+): `grid grid-cols-[1fr_380px] gap-8`
  - Left: PhotoGallery → PropertyStats → description → FeaturesList → InspectionTimes → AuctionCountdown → SoldHistory → SimilarProperties → map embed
  - Right (sticky `top-24`): price panel + AgentCard + action buttons
- Mobile: stacked, map and similar properties at bottom
- Price panel: large price display, days-on-market badge, "Enquire now" button (opens EnquiryModal), "Save" button (stub for Phase 4)
- Days on market: `Math.floor((Date.now() - new Date(publishedAt).getTime()) / 86400000)` days

**Map embed (`apps/web/src/features/listing/components/ListingMap.tsx`)**
- Props: `lat: number`, `lng: number`, `address: string`
- Mapbox map, 400px height, no controls except zoom
- Single marker at property location
- Popup showing address on marker click
- Init only when component enters viewport (IntersectionObserver)

### End state check
Navigate to a seeded listing — full page renders. Enquiry modal opens and submits.

---

## Session 2-E — Backend: GET /properties/:id + Enquiries

### Task
Backend endpoints for listing detail and enquiry submission.

**`GET /properties/:id`** in `PropertiesService.findOne(id)`
- Fetch property row
- Fetch images: `property_images` where `property_id = id` ordered by `sort_order`
- Fetch inspections: `inspections` where `property_id = id AND cancelled = false AND starts_at > now()`
- Fetch agent: join `agents` → `profiles` (two queries, no join — fetch agent by agent_id, then profile by profile_id)
- Fetch agency: by agency_id
- Assemble and return `PropertyDetail`
- Throws `NotFoundException` if not found or status != 'active' (unless caller is the agent)

**`PATCH /properties/:id/view-count`** — fire and forget RPC:
```sql
-- Add to 008_rpc.sql
CREATE OR REPLACE FUNCTION increment_view_count(prop_id UUID)
RETURNS void AS $$
  UPDATE properties SET view_count = view_count + 1 WHERE id = prop_id;
$$ LANGUAGE SQL;
```

**`GET /properties/similar/:id`**
- Fetch the target property's suburb, price, listing_type
- Query: same suburb + same listing_type + status='active' + id != target id + price within ±30%
- Limit 6, select summary columns only
- Return `PropertySummary[]`

**`EnquiriesModule`** — full implementation:
- `enquiries.module.ts`, `enquiries.controller.ts`, `enquiries.service.ts`
- `POST /enquiries` — body: `{ propertyId, name, email, phone?, message }`
- Service: fetch property → fetch agent → fetch profile email → insert enquiry → increment enquiry_count (RPC) → send Resend email (non-blocking)
- Resend email template: plain text, agent name, sender name, property address, message, reply-to = sender email
- `CreateEnquiryDto` Zod schema

### End state check
`GET /properties/:id` returns full detail with images and inspections.
`POST /enquiries` inserts row and triggers Resend email (check Resend dashboard).

---

## Phase 2 Checklist
```
[x] PropertyDetail type (extends PropertySummary)
[x] Inspection type
[x] useProperty hook
[x] useIncrementViewCount hook
[x] useCreateEnquiry mutation
[x] PhotoGallery (carousel + lightbox)
[x] PropertyStats
[x] InspectionTimes + ICS download
[x] AuctionCountdown
[x] FeaturesList
[x] SoldHistory
[x] AgentCard
[x] EnquiryModal (react-hook-form + Zod)
[x] SimilarProperties carousel
[x] ListingMap (Mapbox embed)
[x] ListingPage (full layout, sticky sidebar)
[x] GET /properties/:id (with images, inspections, agent, agency)
[x] increment_view_count RPC
[x] GET /properties/similar/:id
[x] EnquiriesModule: POST /enquiries
[x] Resend email on enquiry submit
```
