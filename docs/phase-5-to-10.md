# Phase 5 Prompt — Alerts + Saved Searches
# Paste _shared-context.md above this, then use this section.
# Prerequisite: Phase 4 complete. Auth works. Collections work.

---

## Phase Goal
Users save searches and receive notifications when new matching listings appear or saved properties drop in price.

---

## Session 5-A — Saved Search UI

**`apps/web/src/features/alerts/components/SaveSearchModal.tsx`**
- Props: `isOpen, onClose`
- Reads current filters from `selectSearchFilters`
- Fields: name input (pre-filled with location), frequency select (Instant / Daily / Weekly)
- On save: `POST /saved-searches`, toast "Search saved!"
- Show in SearchResultsPage header as "Save this search" button (Bell icon)

**`apps/web/src/features/alerts/pages/SavedSearchesPage.tsx`**
- Route: `/account/searches`
- List each saved search: name, filter summary chips, frequency badge, alert toggle, delete button
- Filter summary: e.g. "Buy · Navrangpura · ₹50L–₹1Cr · 2+ beds"
- Toggle alert: `PATCH /saved-searches/:id` body `{ alertEnabled: boolean }`
- Delete: `DELETE /saved-searches/:id`

**`apps/web/src/features/alerts/components/NotificationCentre.tsx`**
- Bell icon in Header, shows unread count badge (red, max "9+")
- Click: dropdown panel max-h-96 overflow-y-auto
- Each notification: icon (type-based), title, body, timestamp (relative: "2h ago")
- Click notification: navigate to `data.url` or property page, mark as read
- "Mark all read" button at top
- Calls `useNotifications()` hook, polls every 60s or uses Supabase Realtime subscription

**`apps/web/src/api/notifications.ts`**
- `useNotifications()` — `useQuery`, `GET /notifications`, staleTime: 30s
- `useMarkRead(id)` — mutation, `PATCH /notifications/:id/read`
- `useMarkAllRead()` — mutation, `POST /notifications/read-all`

---

## Session 5-B — Backend: Saved Searches + BullMQ

**`SavedSearchesModule`**
- `GET /saved-searches` — user's saved searches (auth required)
- `POST /saved-searches` — body: `{ name, filters, alertFreq }`
- `PATCH /saved-searches/:id` — partial update (alertEnabled, alertFreq)
- `DELETE /saved-searches/:id`

**`AlertsModule`** (BullMQ)
```
apps/api/src/modules/alerts/
├── alerts.module.ts      — BullModule.registerQueue('alerts')
├── alerts.service.ts     — addNewListingJob(), addPriceDropJob()
└── alerts.processor.ts   — @Processor('alerts')
```
- `new-listing` job: triggered when property status changes to 'active'
  - Find saved searches matching property filters
  - Call NotificationsService.dispatch per matching user
- `price-drop` job: triggered when property price decreases
  - Find price_alerts for this property
  - Notify users whose price_at_save > new price

**`NotificationsModule`**
- `GET /notifications` — user's notifications, last 50, ordered by created_at desc
- `PATCH /notifications/:id/read`
- `POST /notifications/read-all`
- Internal `dispatch(userId, payload)` method — inserts to DB + sends FCM if token available

**Wire job triggers:**
- In `PropertiesService.updateStatus()`: when status becomes 'active', call `alertsService.addNewListingJob(propertyId)`
- In `PropertiesService.update()`: when price decreases, call `alertsService.addPriceDropJob(propertyId, newPrice)`

## Phase 5 Checklist
```
[x] SaveSearchModal
[x] SavedSearchesPage
[x] NotificationCentre (bell + dropdown)
[x] useNotifications hook
[x] SavedSearchesModule: CRUD endpoints
[x] AlertsModule: BullMQ queue + new-listing + price-drop processors
[x] NotificationsModule: DB insert + FCM dispatch
[x] Trigger jobs from PropertiesService
```

---

# Phase 6 Prompt — Suburb Profiles
# Paste _shared-context.md above this, then use this section.
# Prerequisite: Phase 1 complete. Suburb autocomplete returns suburb slugs.

---

## Phase Goal
Suburb profile pages showing median prices, price trend charts, and nearby schools.

---

## Session 6-A — Suburb Page

**`apps/web/src/api/suburbs.ts`** — add:
- `useSuburb(state: string, slug: string)` — `GET /suburbs/:state/:slug`

**`apps/web/src/features/suburb/components/SuburbStats.tsx`**
- Hero strip: suburb name (H1), state, 4 stat boxes: Median sale · Median rent · Avg days on market · Properties for sale
- Numbers formatted with `formatPrice`
- Skeleton while loading

**`apps/web/src/features/suburb/components/PriceTrendChart.tsx`**
- Props: `data: { month: string; housePrice: number; unitPrice: number }[]`
- Recharts `LineChart` — two lines (brand-primary = houses, brand-secondary = units)
- Tabs: 1Y / 3Y / 5Y (dispatches to parent, parent changes query param)
- Clean axes: formatted price on Y, month on X, no grid clutter
- Tooltip: shows both values on hover

**`apps/web/src/features/suburb/components/SchoolsList.tsx`**
- Props: `schools: School[]`
- List: school name, type badge (Gov/Catholic/Independent), rating bar (1–10 scale), distance (calculated from suburb lat/lng)
- Max 8 schools, sorted by distance

**`apps/web/src/features/suburb/pages/SuburbPage.tsx`**
- Route: `/suburb/:state/:slug`
- Calls `useSuburb(state, slug)`
- Layout: SuburbStats hero → PriceTrendChart → SchoolsList → "Properties for sale in [suburb]" (reuse search results with suburb filter pre-applied)
- Link suburb name on listing cards → this page

**Backend: SuburbsModule**
- `GET /suburbs/:state/:slug` — fetch suburb row + count of active listings + schools nearby
- `GET /suburbs/:id/price-history` — for now: return static mock 12-month data (real data requires Phase 10 seed expansion)

## Phase 6 Checklist
```
[x] useSuburb hook
[x] SuburbStats
[x] PriceTrendChart (Recharts)
[x] SchoolsList
[x] SuburbPage (full layout)
[x] Link suburb on PropertyCard/ListingPage → SuburbPage
[x] GET /suburbs/:state/:slug
[x] GET /suburbs/:id/price-history
```

---

# Phase 7 Prompt — Finance Calculators
# Paste _shared-context.md above this, then use this section.
# Prerequisite: Phase 0 packages/utils exist.
# Note: All calculators are purely client-side. No API calls.

---

## Phase Goal
Three working calculators: repayment, borrow capacity, stamp duty. All client-side.

---

## Session 7 — Calculators (Single Session)

**`packages/utils/src/calc-repayment.ts`**
```typescript
export function calcMonthlyRepayment(principal: number, annualRatePct: number, termYears: number): number
export function calcTotalRepayment(principal: number, annualRatePct: number, termYears: number): number
export function calcTotalInterest(principal: number, annualRatePct: number, termYears: number): number
```
Include unit tests in `packages/utils/src/calc-repayment.test.ts`

**`packages/utils/src/calc-borrow-capacity.ts`**
- Simple formula: `(monthlyIncome - monthlyExpenses) * 0.3 * 12 * term / (1 + rate * term / 2)`
- Inputs: annualIncome, monthlyExpenses, annualRatePct, termYears
- Include unit test

**`packages/utils/src/calc-stamp-duty.ts`**
- Indian states: Gujarat (3–5% depending on value + gender), Maharashtra, Karnataka, Delhi
- Returns `{ dutyAmount: number, registrationFee: number, total: number }`
- Include unit test

**`apps/web/src/features/finance/components/RepaymentCalculator.tsx`**
- Inputs: Loan amount (INR slider + input), Interest rate (%), Loan term (years)
- Output panel: Monthly payment (large), Total repayment, Total interest
- Recharts Pie (donut): Principal vs Interest split
- All calculations via `calcMonthlyRepayment` from utils, updates live on input change

**`apps/web/src/features/finance/components/BorrowCapacityCalculator.tsx`**
- Inputs: Annual income, Monthly expenses, Interest rate, Loan term
- Output: "You may be able to borrow up to [X]" — large display

**`apps/web/src/features/finance/components/StampDutyCalculator.tsx`**
- Inputs: State (dropdown: Gujarat/Maharashtra/Karnataka/Delhi), Property value, Is first home buyer (toggle)
- Output table: Stamp duty, Registration fee, Total

**`apps/web/src/features/finance/pages/FinancePage.tsx`**
- Route: `/finance`
- Three-tab layout (Tabs component from Phase 1)
- Each tab renders one calculator
- Clean two-col layout desktop: form left, result panel right

## Phase 7 Checklist
```
[x] calcMonthlyRepayment + tests
[x] calcBorrowCapacity + tests
[x] calcStampDuty (Indian states) + tests
[x] RepaymentCalculator (with donut chart)
[x] BorrowCapacityCalculator
[x] StampDutyCalculator
[x] FinancePage (3 tabs)
```

---

# Phase 8 Prompt — Agent Dashboard + Listing Wizard
# Paste _shared-context.md above this, then use this section.
# Prerequisite: Phase 4 complete. Auth + protected routes work.

---

## Phase Goal
Agents can create listings via a 6-step wizard, manage existing listings, and view their enquiry inbox.

---

## Session 8-A — Dashboard Layout + Listing Management

**`apps/web/src/features/dashboard/DashboardLayout.tsx`**
- Route: `/dashboard/*`
- Protected: `role === 'agent'`
- Left sidebar (w-56): PropSphere logo, nav links (Dashboard / My Listings / Enquiries), agent name + agency at bottom
- Main content area: `<Outlet />`

**`apps/web/src/features/dashboard/pages/DashboardHome.tsx`**
- Route: `/dashboard`
- 3 stat cards: Active Listings · Enquiries Today · Total Views (this month)
- Recent enquiries list (last 5)
- Calls `GET /agents/me/stats`

**`apps/web/src/features/dashboard/pages/ListingManagement.tsx`**
- Route: `/dashboard/listings`
- Table: listing headline, status badge, views, enquiries, published date, actions (Edit / Mark Sold / Delete)
- "Create New Listing" button top-right → navigate to `/dashboard/listings/new`
- Status filter tabs: All / Active / Draft / Sold
- Calls `GET /agents/me/listings`

---

## Session 8-B — Listing Wizard

**`apps/web/src/features/dashboard/components/ListingWizard/`**

Wizard state: use `useState` for the form data object, pass down + up via props. No Redux (wizard state is temporary).

```typescript
interface WizardState {
  step: 1 | 2 | 3 | 4 | 5 | 6
  // Step 1
  listingType: ListingType
  propertyType: PropertyType
  unitNumber?: string
  streetNumber: string
  streetName: string
  suburb: string
  state: string
  postcode: string
  lat?: number
  lng?: number
  // Step 2
  images: { file?: File; cdnUrl?: string; storagePath?: string; caption?: string }[]
  // Step 3
  headline: string
  description: string
  features: { indoor: string[]; outdoor: string[]; climate: string[] }
  bedrooms?: number
  bathrooms?: number
  carSpaces?: number
  landSizeSqm?: number
  buildSizeSqm?: number
  // Step 4
  saleMethod: SaleMethod
  price?: number
  priceMin?: number
  priceMax?: number
  priceDisplay: string
  isPriceHidden: boolean
  auctionAt?: string
  // Step 5
  inspections: { type: string; startsAt: string; endsAt: string }[]
}
```

**`WizardStepper.tsx`** — top progress bar: 6 steps, current step highlighted, completed steps have checkmark

**`Step1Details.tsx`** — address fields + property type grid + listing type tabs + Mapbox geocode address on blur (sets lat/lng)

**`Step2Media.tsx`** — react-dropzone upload zone + image grid with @dnd-kit/sortable drag reorder + captions per image + hero badge on first image. On file drop: `POST /media/upload`, show progress, store returned cdnUrl.

**`Step3Features.tsx`** — Tiptap or plain textarea for description. Feature checkboxes in 3 groups. Bed/bath/car number inputs.

**`Step4Pricing.tsx`** — SaleMethod dropdown. Conditional: auction shows datetime picker, private treaty shows price input or range or "Contact agent" toggle. Price display preview.

**`Step5Inspections.tsx`** — "Add inspection" button: inline date + start time + end time inputs. List of added inspection slots with remove button.

**`Step6Preview.tsx`** — Renders a read-only version of the listing using `ListingPage` components (PhotoGallery, PropertyStats, etc.) with wizard state as props. "Publish listing" primary button + "Save as draft" ghost button.

On publish: `POST /properties` with full wizard state, then navigate to the new listing page.

---

## Session 8-C — Enquiries Inbox + Backend

**`apps/web/src/features/dashboard/pages/EnquiriesInbox.tsx`**
- Route: `/dashboard/enquiries`
- Email-client layout: list left (w-80), thread right
- List item: sender name, property address (truncated), message preview (40 chars), timestamp, unread dot
- Right panel: full enquiry details, property card mini at top, "Reply via email" mailto link
- Status update: clicking enquiry marks it as 'read' (PATCH /enquiries/:id/status)
- Calls `GET /agents/me/enquiries`

**Backend:**
- `GET /agents/me/listings` — agent's own listings (auth, agent role)
- `GET /agents/me/enquiries` — paginated, newest first, with property headline
- `GET /agents/me/stats` — count queries for active listings, today's enquiries, monthly views
- `POST /properties` — create listing + sync property to DB
- `PATCH /properties/:id` — update (verify agent owns)
- `PATCH /properties/:id/status` — update status
- `PATCH /enquiries/:id/status` — update enquiry status
- `POST /media/upload` — Supabase Storage, 20 files max, return `{ urls: string[] }`

## Phase 8 Checklist
```
[x] DashboardLayout (sidebar nav)
[x] DashboardHome (stat cards)
[x] ListingManagement (table + filter tabs)
[x] WizardStepper
[x] Step1Details (address + geocode)
[x] Step2Media (dropzone + dnd reorder + upload)
[x] Step3Features (description + feature checkboxes)
[x] Step4Pricing (method + price variants)
[x] Step5Inspections (add/remove slots)
[x] Step6Preview (read-only + publish)
[x] EnquiriesInbox (email-client layout)
[x] GET /agents/me/listings + stats + enquiries
[x] POST /properties + PATCH /properties/:id
[x] POST /media/upload
[x] PATCH /enquiries/:id/status
```

---

# Phase 9 Prompt — Polish + Performance
# Paste _shared-context.md above this, then use this section.
# Prerequisite: All phases 1–8 complete.

---

## Phase Goal
Production-quality UX. All async states handled. Core Web Vitals green. Analytics and error tracking wired.

---

## Session 9 — Single session, work through this checklist in order:

**Performance:**
- `@tanstack/react-virtual` on SearchResultsPage list (install + implement)
- `React.lazy` + `Suspense` on all 9 feature routes in `router.tsx`
- `IntersectionObserver` on `ListingMap` — only init Mapbox when map div enters viewport
- Verify all PropertyCard images have `loading="lazy"`, first listing image has `loading="eager" fetchpriority="high"`

**Missing UX states — add to each page:**
- SearchResultsPage: 0 results empty state with illustration placeholder (grey box + text)
- CollectionsPage: empty collection state
- EnquiriesInbox: no enquiries state
- NotificationCentre: empty state ("No notifications yet")
- All async sections: skeleton loaders already exist — verify they match actual content shape

**Error handling:**
- `apps/web/src/components/ErrorBoundary.tsx` — React error boundary, catches render errors, shows "Something went wrong" + reload button
- Wrap `<App>` in `<ErrorBoundary>`
- `404.tsx` — "Page not found" + back to home button
- Wire 404 route in `router.tsx`

**Analytics (PostHog):**
- `apps/web/src/lib/analytics.ts` — init PostHog with `VITE_POSTHOG_KEY`
- Track: `page_view` (auto), `property_viewed`, `enquiry_submitted`, `property_saved`, `search_performed` (debounced on filter change)
- `apps/api` — PostHog Node SDK: track `enquiry_created`, `listing_published`

**Error monitoring (Sentry):**
- `apps/web`: `@sentry/react` init in `main.tsx`, wrap router with Sentry
- `apps/api`: `@sentry/nestjs` init in `main.ts`

## Phase 9 Checklist
```
[x] List virtualisation (react-virtual) on search results
[x] Lazy route loading (React.lazy all pages)
[x] Mapbox IntersectionObserver lazy init
[x] Image loading attributes audit
[x] Empty states: search, collections, enquiries, notifications
[x] Skeleton loaders audit (all async sections covered)
[x] ErrorBoundary component
[x] 404 page
[x] PostHog frontend events
[x] PostHog backend events
[x] Sentry frontend
[x] Sentry backend
```

---

# Phase 10 Prompt — Deploy + Launch
# Paste _shared-context.md above this, then use this section.
# Prerequisite: All phases 0–9 complete. pnpm build passes.

---

## Phase Goal
Live production deployment. Seed data in production. All smoke tests pass.

---

## Session 10 — Deployment Checklist

Work through this exactly in order. Do NOT skip steps.

**1. Environment files audit**
- Verify `apps/web/.env.example` has all `VITE_*` keys
- Verify `apps/api/.env.example` has all backend keys
- Both files documented with which service each key comes from

**2. Build verification (local)**
```bash
pnpm build                 # all packages + apps
pnpm typecheck             # zero errors
pnpm test                  # all passing
```

**3. Supabase remote setup**
```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push        # applies all migrations to remote
```
- Enable Google OAuth in Supabase Dashboard → Auth → Providers
- Create `property-media` Storage bucket (public)
- Set CORS on Storage: allow `*.vercel.app` and your domain

**4. Railway (backend)**
- New project → Deploy from GitHub → `apps/api`
- Root directory: `apps/api`
- Build command: `pnpm build`
- Start command: `node dist/main`
- Add Redis plugin (Railway native, sets `REDIS_URL` auto)
- Add all env vars from `apps/api/.env.example`

**5. Vercel (frontend)**
- New project → Import GitHub repo
- Framework preset: Vite
- Root directory: `apps/web`
- Build command: `pnpm turbo build --filter=web`
- Add all `VITE_*` env vars
- Set `VITE_API_BASE_URL` to Railway backend URL

**6. Seed production DB**
```bash
# Set SUPABASE_URL + SUPABASE_SERVICE_KEY to production values
npx ts-node scripts/seed.ts --env=production
```

**7. Smoke tests (manual)**
- [ ] Homepage loads, hero search bar works
- [ ] Search `/buy` returns 10 seeded Ahmedabad listings
- [ ] Filter by bedrooms — results update
- [ ] Click listing → full detail page loads with images
- [ ] Enquiry form submits → Resend dashboard shows delivery
- [ ] Register with email → profile row created in Supabase
- [ ] Google OAuth → redirects back, user logged in
- [ ] Save property → heart fills, appears in collections
- [ ] Agent login → dashboard accessible, create listing wizard opens
- [ ] Map view → pins appear over Ahmedabad, click pin → popup
- [ ] Finance calculator → repayment updates live
- [ ] Suburb page → stats and chart render

**8. Post-deploy**
- Add custom domain in Vercel
- Verify SSL certificate
- Set Supabase Auth `site_url` to production domain
- Add production domain to Google OAuth allowed origins

## Phase 10 Checklist
```
[x] Local build passes (build + typecheck + test)
[x] Supabase remote migrations applied
[x] Storage bucket created (property-media, public)
[x] Google OAuth configured (Supabase + Google Console)
[x] Railway backend deployed + Redis add-on
[x] Vercel frontend deployed
[x] All env vars set in both platforms
[x] Production DB seeded (10 listings)
[x] All 10 smoke tests pass
[x] Custom domain configured
[x] SSL verified
```
