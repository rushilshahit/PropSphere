# Phase 2-D — Offers + Agent/Agency Directory + Analytics + Deploy
# Paste _shared-context-phase2.md above this.
# Prerequisite: Phase 2-A + 2-B + 2-C complete.

---

## Session 2-D-1 — Offer Management (Simple Flow — Locked)

### Vibe Coding Instruction
> "Build offer management. Decision locked: simple flow only —
> buyer submits { propertyId, amount, message, name, email }.
> No counter-offer, no negotiation flow.
> Build: 1) OfferModal (buyer), 2) backend POST /offers,
> 3) /dashboard/offers (agent inbox), 4) /account/offers (buyer history).
> One component at a time."

### OfferModal (buyer side)

**`apps/web/src/features/offers/components/OfferModal.tsx`** (new):

Schema:
```typescript
const offerSchema = z.object({
  amount:          z.coerce.number().min(1, 'Enter an offer amount'),
  message:         z.string().max(500).optional(),
  isConfidential:  z.boolean().default(false),
  senderName:      z.string().min(2, 'Name required'),
  senderEmail:     z.string().email('Valid email required'),
  senderPhone:     z.string().optional(),
});
type OfferFormValues = z.infer<typeof offerSchema>;
```

Key UI elements:
```tsx
// Amount input with INR prefix
<div className="relative">
  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rea-secondary font-medium">₹</span>
  <input type="number" className="w-full pl-8 ..." {...register('amount', { valueAsNumber: true })} />
</div>
{/* Range hint */}
{askingPrice && (
  <p className="text-xs text-rea-secondary mt-1">
    Asking price: {formatPrice(askingPrice)}
  </p>
)}

{/* Quick amount chips */}
{askingPrice && (
  <div className="flex gap-2 mt-2">
    {[
      { label: 'Asking',  value: askingPrice },
      { label: '-5%',     value: Math.round(askingPrice * 0.95 / 50000) * 50000 },
      { label: '+5%',     value: Math.round(askingPrice * 1.05 / 50000) * 50000 },
    ].map(q => (
      <button key={q.label} type="button"
              onClick={() => setValue('amount', q.value)}
              className="text-xs border border-rea-border rounded-[4px] px-2.5 py-1
                         hover:border-rea-red hover:text-rea-red transition-colors">
        {q.label}
      </button>
    ))}
  </div>
)}

{/* Confidential toggle */}
<label className="flex items-center gap-3 cursor-pointer">
  <input type="checkbox" {...register('isConfidential')} className="sr-only peer" />
  <div className="w-9 h-5 bg-rea-border rounded-full peer-checked:bg-rea-red
                  relative after:absolute after:top-0.5 after:left-0.5
                  after:bg-white after:rounded-full after:w-4 after:h-4
                  after:transition peer-checked:after:translate-x-4" />
  <span className="text-sm text-rea-charcoal">Keep my offer confidential</span>
</label>

{/* Disclaimer */}
<p className="text-xs text-rea-secondary">
  Your offer is not legally binding until accepted in writing.
</p>
```

Auto-fill name/email if authenticated:
```typescript
const { user } = useAuth();
const { reset } = useForm<OfferFormValues>();

useEffect(() => {
  if (user) {
    reset({
      senderName:  user.profile?.fullName ?? '',
      senderEmail: user.email ?? '',
    });
  }
}, [user]);
```

**`apps/web/src/api/offers.ts`** (new):
```typescript
export function useSubmitOffer() {
  return useMutation({
    mutationFn: (dto: SubmitOfferInput) => apiClient.post<Offer>('/offers', dto),
    onSuccess: () => toast.success('Offer submitted!'),
  });
}

export function useMyOffers() {
  return useQuery({
    queryKey: ['my-offers'],
    queryFn: () => apiClient.get<Offer[]>('/users/me/offers'),
    staleTime: 60_000,
  });
}

export function useAgentOffers() {
  return useQuery({
    queryKey: ['agent', 'offers'],
    queryFn: () => apiClient.get('/agents/me/offers'),
    staleTime: 30_000,
  });
}

export function useUpdateOfferStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/offers/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent', 'offers'] });
      toast.success('Offer updated');
    },
  });
}
```

**Add "Make an Offer" button to ListingPage** (only active buy listings, not agent's own):
```tsx
{property.status === 'active' && property.listingType === 'buy' && !isMyListing && (
  <>
    <Button variant="secondary" className="w-full mt-2"
            onClick={() => setOfferOpen(true)}>
      Make an Offer
    </Button>
    <OfferModal
      propertyId={property.id}
      agentId={property.agentId}
      askingPrice={property.price ?? undefined}
      isOpen={offerOpen}
      onClose={() => setOfferOpen(false)}
    />
  </>
)}
```

### Backend: OffersModule

```
apps/api/src/modules/offers/
├── offers.module.ts
├── offers.controller.ts
└── offers.service.ts
```

**`POST /offers`** (no role guard — unauthenticated OK):
```typescript
const { data } = await supabase.from('offers').insert({
  property_id:     dto.propertyId,
  agent_id:        dto.agentId,
  sender_id:       userId ?? null,
  sender_name:     dto.senderName,
  sender_email:    dto.senderEmail,
  sender_phone:    dto.senderPhone ?? null,
  amount:          dto.amount,
  message:         dto.message ?? null,
  is_confidential: dto.isConfidential ?? false,
}).select().single();

// Email agent (non-blocking)
this.resend.sendNewOffer({
  agentEmail: agentProfile.email,
  buyerName:  dto.senderName,
  amount:     dto.amount,
  propertyAddress: property.fullAddress,
}).catch(console.error);

return data;
```

**`PATCH /offers/:id/status`** (agent auth required):
```typescript
// Verify agent owns this offer (via property)
const { data: offer } = await supabase.from('offers').select('agent_id').eq('id', id).single();
if (offer.agent_id !== agentId) throw new ForbiddenException();

await supabase.from('offers').update({ status, updated_at: new Date() }).eq('id', id);
```

**`GET /users/me/offers`** (buyer sees own offers):
```typescript
.from('offers')
.select('*, property:properties(id, headline, suburb, state)')
.eq('sender_id', userId)
.order('created_at', { ascending: false })
```

### Buyer offer history page

**`apps/web/src/features/account/pages/OfferHistoryPage.tsx`** (route `/account/offers`):

Timeline list. Each row:
```
[property thumbnail 64px]  3BHK in Navrangpura          ₹1.25 Cr
                           Submitted 12 May 2026         [Pending]
```

Status badges:
```
pending:   bg-amber-100 text-amber-700
accepted:  bg-green-100 text-green-700
rejected:  bg-red-100   text-red-700
withdrawn: bg-neutral-100 text-neutral-500
```

---

## Session 2-D-2 — Agent Profile (Full) + Agency Profile (New)

### Vibe Coding Instruction
> "Two profile pages:
> 1. Wire the agent profile stub at /agent/:slug — backend is built, page is stub
> 2. Build the agency profile page at /agency/:slug — completely new
> Read the existing AgentPage stub first. Build agent page first, then agency."

### Agent Profile (`/agent/:slug`)

**`apps/web/src/api/agents.ts`** — add if missing:
```typescript
export function useAgentBySlug(slug: string) {
  return useQuery({
    queryKey: ['agents', slug],
    queryFn: () => apiClient.get(`/agents/${slug}`),
    staleTime: 5 * 60_000,
    enabled: !!slug,
  });
}

export function useAgentSoldHistory(agentId: string) {
  return useQuery({
    queryKey: ['agents', agentId, 'sold'],
    queryFn: () => apiClient.get(`/agents/${agentId}/sold`),
    staleTime: 5 * 60_000,
    enabled: !!agentId,
  });
}
```

**Wire `AgentPage.tsx`** (read existing stub first):

```
Layout:
  Hero white card:
    - 40px agency colour band top
    - Agent headshot (96px circle, shadow, overlapping band)
    - Name (H2) + "Verified" badge (green check, if is_verified)
    - Agency name + logo (small, links to /agency/:slug)
    - Years active · License no (caption)
    - [Call] tel link · [Email] mailto · [Enquire] button → EnquiryModal

  Stats strip (4 boxes, white bg below hero):
    Active listings · Sold (12m) · Avg days on market · Median sold price

  Two tabs: [Current Listings] [Sold History]

  Current Listings: PropertyCard grid (3-col, compact)
  Sold History:
    Stats card (total, median, highest, avg days)
    Filter chips: suburb, property type, date range
    Sold card grid (sold variant of PropertyCard)
```

**Backend: `GET /agents/:slug/sold`** — add to AgentsController:
```typescript
@Get(':slug/sold')
async getSoldHistory(@Param('slug') slug: string) {
  const agent = await this.agentsService.findBySlug(slug);
  const { data } = await this.supabase.client
    .from('properties')
    .select(PROPERTY_SUMMARY_COLUMNS + ', sold_price, sold_at, sale_method')
    .eq('agent_id', agent.id)
    .eq('status', 'sold')
    .order('sold_at', { ascending: false })
    .limit(24);
  return data ?? [];
}
```

### Agency Profile (`/agency/:slug`)

**`apps/web/src/features/agency/`** — new feature folder:
```
agency/
├── components/
│   └── AgencyHero.tsx
├── pages/
│   └── AgencyPage.tsx
└── index.ts
```

**`apps/web/src/api/agencies.ts`** (new or add to existing):
```typescript
export function useAgencyBySlug(slug: string) {
  return useQuery({
    queryKey: ['agencies', slug],
    queryFn: () => apiClient.get(`/agencies/${slug}`),
    staleTime: 5 * 60_000,
    enabled: !!slug,
  });
}
```

**`AgencyPage.tsx`** layout:
```
Hero (dark charcoal bg):
  Agency logo (96px circle, white bg, shadow)
  Agency name (H1, white)
  Address · Phone · Website (white/80)
  [Contact agency] button → opens EnquiryModal (no property_id, type='agency_contact')

Stats strip: Total agents · Active listings · Sold last 12m

"Our Agents" section:
  Horizontal scroll row of agent mini-cards (photo + name + listings count)

"Active Listings" section:
  PropertyCard grid (3-col, standard)

"Recent Sales" section (if any):
  Sold card grid (3-col, sold variant)
```

**Backend: `GET /agencies/:slug`** — add to AgenciesController:
```typescript
async findBySlug(slug: string) {
  const { data: agency } = await supabase.from('agencies').select('*').eq('slug', slug).single();
  if (!agency) throw new NotFoundException('Agency not found');

  const { data: agents } = await supabase
    .from('agents')
    .select('id, slug, is_verified, profile:profiles(full_name, avatar_url)')
    .eq('agency_id', agency.id)
    .eq('is_verified', true);

  const { count: activeCount } = await supabase
    .from('properties').select('id', { count: 'exact', head: true })
    .eq('agency_id', agency.id).eq('status', 'active');

  const { count: soldCount } = await supabase
    .from('properties').select('id', { count: 'exact', head: true })
    .eq('agency_id', agency.id).eq('status', 'sold')
    .gte('sold_at', new Date(Date.now() - 365 * 86400000).toISOString());

  return { ...agency, agents, activeListingCount: activeCount, soldLast12m: soldCount };
}
```

**Add agency link to AgentCard** wherever shown:
```tsx
<Link to={`/agency/${agent.agency.slug}`}
      className="text-xs text-rea-secondary hover:text-rea-red"
      onClick={e => e.stopPropagation()}>
  {agent.agency.name}
</Link>
```

**Router additions:**
```typescript
{ path: 'agent/:slug',   element: React.lazy(() => import('@/features/agent/pages/AgentPage'))  },
{ path: 'agency/:slug',  element: React.lazy(() => import('@/features/agency/pages/AgencyPage')) },
```

---

## Session 2-D-3 — Agent Analytics + Phase 9 Polish

### Vibe Coding Instruction
> "Add analytics to the agent dashboard and polish the app for production.
> Analytics page: /dashboard/analytics — per-listing performance table + 30-day trends.
> Polish: error boundaries, skeleton loaders audit, empty states, PostHog events for Phase 2."

### Agent Analytics Page

**`apps/web/src/features/dashboard/pages/AnalyticsPage.tsx`** (new route `/dashboard/analytics`):

```
30-day overview (4 stat cards):
  Total views · Total enquiries · Total offers · Avg enquiry rate (%)

Per-listing table:
  | Listing | Views | Enquiries | Offers | Enq. rate | Days live |
  Sortable columns. Click row → navigates to listing.

Simple trend chart (Recharts AreaChart):
  X: last 7 days
  Y: views count
  Data: aggregate from listing view_count history (or just show current totals)
```

**`apps/web/src/api/agents.ts`** — add:
```typescript
export function useAgentAnalytics() {
  return useQuery({
    queryKey: ['agent', 'analytics'],
    queryFn: () => apiClient.get('/agents/me/analytics'),
    staleTime: 5 * 60_000,
  });
}
```

**Backend: `GET /agents/me/analytics`**:
```typescript
const { data: listings } = await supabase
  .from('properties')
  .select('id, headline, suburb, view_count, enquiry_count, published_at, status')
  .eq('agent_id', agentId)
  .in('status', ['active', 'sold', 'under_contract']);

const totalViews     = listings?.reduce((s, l) => s + (l.view_count ?? 0), 0) ?? 0;
const totalEnquiries = listings?.reduce((s, l) => s + (l.enquiry_count ?? 0), 0) ?? 0;

// Offer count from offers table
const { count: totalOffers } = await supabase
  .from('offers')
  .select('id', { count: 'exact', head: true })
  .eq('agent_id', agentId);

return {
  totalViews,
  totalEnquiries,
  totalOffers: totalOffers ?? 0,
  avgEnquiryRate: totalViews > 0
    ? Number(((totalEnquiries / totalViews) * 100).toFixed(1))
    : 0,
  listings: (listings ?? []).map(l => ({
    ...l,
    enquiryRate: l.view_count > 0
      ? Number(((l.enquiry_count / l.view_count) * 100).toFixed(1))
      : 0,
    daysLive: l.published_at
      ? Math.floor((Date.now() - new Date(l.published_at).getTime()) / 86400000)
      : 0,
  })),
};
```

### Phase 9 — Polish

```typescript
// PostHog: Phase 2 events to add
posthog.capture('offer_submitted',        { propertyId, amount, isAuthenticated: !!user })
posthog.capture('virtual_tour_viewed',    { propertyId })
posthog.capture('floor_plan_viewed',      { propertyId })
posthog.capture('price_history_viewed',   { propertyId, records: history.length })
posthog.capture('agent_signup_started',   {})
posthog.capture('agent_signup_completed', {})
posthog.capture('appraisal_requested',    { suburb })
posthog.capture('sold_search_performed',  { filters })
```

Polish checklist (work through, one item at a time):
```
[ ] ErrorBoundary on all lazy-loaded routes
[ ] Empty state on recently viewed page
[ ] Empty state on offer history page
[ ] Empty state on enquiry history page
[ ] Skeleton on AgentPage while loading
[ ] Skeleton on AgencyPage while loading
[ ] Skeleton on SuburbPage while loading (confirm it's there)
[ ] Toast on offer submit success
[ ] Toast on note save
[ ] Toast on agent signup submit
[ ] Mobile layout: /become-an-agent wizard (verify steps work at 375px)
[ ] Mobile layout: /sold search page (filter panel as bottom sheet)
```

---

## Session 2-D-4 — Phase 10: Deploy + Seed 1,000 Listings

### Vibe Coding Instruction
> "Deploy PropSphere Phase 2 to production.
> Show me: 1) run Phase 2 migration on Supabase remote
> 2) env var updates 3) redeploy commands
> Then run the extended seed (1,000 listings).
> One step at a time."

### Deploy checklist

```bash
# 1. Run Phase 2 migration on production Supabase
npx supabase link --project-ref YOUR_REF
npx supabase db push  # applies 010_phase2.sql to production

# 2. Frontend: add VITE_MAPTILER_KEY to Vercel env vars
# Vercel dashboard → PropSphere project → Settings → Environment Variables
# Add: VITE_MAPTILER_KEY = your_maptiler_key_here

# 3. Remove VITE_MAPBOX_TOKEN from Vercel env vars (no longer needed)

# 4. Redeploy frontend
vercel --prod   # or push to main branch (auto-deploy)

# 5. Backend: no new env vars needed for Phase 2
# (Google Maps server key if using Street View proxy — already set)
# Railway auto-redeploys on git push to main
```

### Extended seed script (`scripts/seed-phase2.ts`)

```typescript
// Seed targets:
// 1,000 properties (100 per Ahmedabad suburb)
// Mix: 700 active, 200 sold, 50 under_contract, 50 withdrawn
// Price history: 2-3 records per sold property (400-600 new records)
// 50 properties with virtual_tour_url (YouTube property walkthrough URLs)
// All active properties: inspection times in next 2 weeks
// Offers: 30 pending offers on random active properties
// 2 agencies, 8 agents (4 per agency)
// BHK config set on all properties (e.g. "2 BHK", "3 BHK + Study")

// Run:
// npx ts-node scripts/seed-phase2.ts
// This is additive — don't delete existing seed data first
```

### Smoke tests (manual)

```
[ ] /sell search returns 200 sold properties
[ ] Sold listing page: sold price banner shows, price history chart renders
[ ] /map: MapTiler tiles load (no Mapbox console errors)
[ ] Draw area on /map still works (maplibre-gl-draw)
[ ] /suburb/gujarat/navrangpura: suburb page loads with sold insights
[ ] /become-an-agent: wizard completes, pending_agent role set
[ ] /dashboard: agent sees stats, can create listing
[ ] /dashboard/offers: offer inbox shows offers
[ ] /account/history: recently viewed shows last 20
[ ] /account/offers: offer history shows submitted offers
[ ] /agent/:slug: full agent profile with sold history tab
[ ] /agency/:slug: agency profile with agents + listings
[ ] Make an offer on a listing → offer appears in agent's inbox
[ ] Price history chart shows on sold listing page
[ ] Floor plan tab appears when listing has floor plan images
[ ] Virtual tour tab appears when listing has virtual_tour_url set
[ ] BHK config displays instead of bed count on cards
[ ] Smart badges: New, Inspection, Auction, Under Offer
[ ] PostHog: events firing in PostHog dashboard
[ ] Sentry: no new errors
[ ] Lighthouse: all Core Web Vitals green
```

---

## Git + Test Requirements per Session

### 2-D-1: Offer Management
```bash
git checkout -b feature/offer-management

git add apps/web/src/features/offers/components/OfferModal.tsx
git commit -m "feat(offers): add OfferModal with quick amount chips and confidential toggle"
git add apps/web/src/api/offers.ts
git commit -m "feat(offers): add useSubmitOffer, useMyOffers, useAgentOffers, useUpdateOfferStatus hooks"
git add apps/web/src/features/listing/pages/ListingPage.tsx
git commit -m "feat(offers): add Make an Offer button to active buy listing pages"
git add apps/web/src/features/dashboard/pages/OfferInbox.tsx
git commit -m "feat(offers): add agent offer inbox at /dashboard/offers"
git add apps/web/src/features/account/pages/OfferHistoryPage.tsx
git commit -m "feat(offers): add buyer offer history at /account/offers"
git add apps/api/src/modules/offers/
git commit -m "feat(offers): add OffersModule with POST /offers and PATCH /offers/:id/status"
git add apps/web/src/router.tsx
git commit -m "feat(routing): add /account/offers and /dashboard/offers routes"
```
**Tests:**
- `apps/web/src/features/offers/components/OfferModal.test.tsx`
- `apps/api/src/modules/offers/offers.service.spec.ts`
- `e2e/phase2/offers.spec.ts`
(see _test-cases-phase2.md → SESSION 2-D)
```bash
pnpm test --filter=web OfferModal
pnpm test --filter=api offers.service
pnpm test:e2e e2e/phase2/offers.spec.ts
```

### 2-D-2: Agent + Agency Profiles
```bash
git checkout -b feature/agent-agency-profiles

git add apps/web/src/features/agent/pages/AgentPage.tsx
git commit -m "feat(agent): wire full agent profile page with sold history tab"
git add apps/web/src/features/agency/
git commit -m "feat(agency): add AgencyPage component at /agency/:slug"
git add apps/web/src/api/agents.ts  # useAgentBySlug, useAgentSoldHistory
git commit -m "feat(agent): add useAgentBySlug and useAgentSoldHistory hooks"
git add apps/web/src/api/agencies.ts  # useAgencyBySlug
git commit -m "feat(agency): add useAgencyBySlug hook"
git add apps/api/src/modules/agents/agents.controller.ts
git add apps/api/src/modules/agents/agents.service.ts
git commit -m "feat(agent): add GET /agents/:slug/sold endpoint for sold history"
git add apps/api/src/modules/agencies/agencies.controller.ts
git add apps/api/src/modules/agencies/agencies.service.ts
git commit -m "feat(agency): add GET /agencies/:slug endpoint with agents and listing counts"
git add apps/web/src/router.tsx
git commit -m "feat(routing): wire /agent/:slug and add /agency/:slug routes"
```
**Tests:**
- `apps/web/src/features/agency/pages/AgencyPage.test.tsx`
- `apps/api/src/modules/agents/agents.service.spec.ts` (getSoldHistory)
(see _test-cases-phase2.md → SESSION 2-D)
```bash
pnpm test --filter=web AgencyPage
pnpm test --filter=api agents.service
```

### 2-D-3: Analytics + Phase 9 Polish
```bash
git checkout -b feature/agent-analytics-polish

git add apps/web/src/features/dashboard/pages/AnalyticsPage.tsx
git commit -m "feat(analytics): add agent performance analytics page at /dashboard/analytics"
git add apps/web/src/api/agents.ts  # useAgentAnalytics
git commit -m "feat(analytics): add useAgentAnalytics hook"
git add apps/api/src/modules/agents/
git commit -m "feat(analytics): add GET /agents/me/analytics endpoint"

# Polish commits:
git add apps/web/src/components/ErrorBoundary.tsx
git commit -m "feat(polish): add ErrorBoundary wrapping all lazy-loaded routes"
git add apps/web/src/router.tsx
git commit -m "feat(polish): wrap all Phase 2 routes in ErrorBoundary + Suspense"
git add apps/web/src/lib/analytics.ts  # PostHog Phase 2 events
git commit -m "feat(analytics): add PostHog events for offer, virtual tour, agent signup"
```
**Tests:**
- `apps/web/src/features/dashboard/pages/AnalyticsPage.test.tsx` (smoke — renders without crash)
```bash
pnpm test --filter=web AnalyticsPage
pnpm lint                    # must pass clean
pnpm typecheck               # must pass zero errors
```

### 2-D-4: Deploy
```bash
# No feature branch — deploy from develop
git checkout develop
git pull origin develop

# Run full test suite before deploy
pnpm test                    # all unit tests pass
pnpm test:e2e                # all E2E pass

# Tag the Phase 2 release
git tag -a v2.0.0 -m "v2.0.0: Phase 2 — Sold ecosystem, MapLibre, agent signup, offers"
git push origin v2.0.0
```
**Pre-deploy checklist:**
```bash
pnpm build                   # zero build errors
pnpm typecheck               # zero type errors
pnpm lint                    # zero lint errors
pnpm test:cov                # coverage report — check > 80% on Phase 2 files
```

---

## Full Test Run Command (End of Phase 2)

```bash
# Run everything before final deploy
pnpm test                    # unit tests (all apps + packages)
pnpm test:e2e                # E2E (Playwright — all phase2 specs)
pnpm build                   # production build check
pnpm typecheck               # TypeScript strict — zero errors

# Coverage summary
pnpm test:cov --filter=web   # check web coverage
pnpm test:cov --filter=api   # check api coverage
```

## E2E Setup (if not already done)

```bash
# Install Playwright browsers
pnpm dlx playwright install chromium

# Create auth state files
pnpm dlx playwright test e2e/setup/auth.setup.ts
# This creates: e2e/.auth/buyer.json, e2e/.auth/agent.json

# Run Phase 2 E2E suite
pnpm test:e2e e2e/phase2/
```

`e2e/setup/auth.setup.ts`:
```typescript
import { test as setup } from '@playwright/test';

setup('authenticate as buyer', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Sign in');
  await page.fill('[name="email"]', process.env.TEST_BUYER_EMAIL!);
  await page.fill('[name="password"]', process.env.TEST_BUYER_PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
  await page.context().storageState({ path: 'e2e/.auth/buyer.json' });
});

setup('authenticate as agent', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Sign in');
  await page.fill('[name="email"]', process.env.TEST_AGENT_EMAIL!);
  await page.fill('[name="password"]', process.env.TEST_AGENT_PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
  await page.context().storageState({ path: 'e2e/.auth/agent.json' });
});
```

Add to `.env.local` (never commit):
```
TEST_BUYER_EMAIL=buyer@test.propsphere.dev
TEST_BUYER_PASSWORD=TestBuyer123!
TEST_AGENT_EMAIL=agent@test.propsphere.dev
TEST_AGENT_PASSWORD=TestAgent123!
```
