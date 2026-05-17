# Phase 2-B — Wire Phase 1 Stubs + Agent Signup
# Paste _shared-context-phase2.md above this.
# Prerequisite: Phase 2-A complete and checked off in task.md.

---

## Session 2-B-1 — Wire Suburb Profile Page

### Vibe Coding Instruction
> "The PropSphere suburb profile page has a working backend but the frontend
> is a stub. Read apps/web/src/features/suburb/pages/SuburbPage.tsx first.
> Read apps/web/src/api/suburbs.ts to see what hooks exist.
> Then wire everything: connect real API data → existing SuburbStats,
> PriceTrendChart, and SchoolsList components.
> Also add a new SuburbSoldInsights component for sold aggregations.
> Build the backend endpoint GET /suburbs/:id/sold-stats.
> One file at a time."

### Frontend wiring

**`apps/web/src/api/suburbs.ts`** — confirm these hooks exist, add missing ones:
```typescript
export function useSuburb(state: string, slug: string) {
  return useQuery({
    queryKey: ['suburb', state, slug],
    queryFn: () => apiClient.get(`/suburbs/${state}/${slug}`),
    staleTime: 5 * 60_000,
    enabled: !!state && !!slug,
  });
}

export function useSuburbPriceHistory(suburbId: string) {
  return useQuery({
    queryKey: ['suburb', suburbId, 'price-history'],
    queryFn: () => apiClient.get(`/suburbs/${suburbId}/price-history`),
    staleTime: 60 * 60_000,
    enabled: !!suburbId,
  });
}

export function useSuburbSoldStats(suburbId: string) {
  return useQuery({
    queryKey: ['suburb', suburbId, 'sold-stats'],
    queryFn: () => apiClient.get(`/suburbs/${suburbId}/sold-stats`),
    staleTime: 60 * 60_000,
    enabled: !!suburbId,
  });
}
```

**`apps/web/src/features/suburb/pages/SuburbPage.tsx`** — wire stub:
```typescript
// Extract params
const { state, slug } = useParams<{ state: string; slug: string }>();
const { data: suburb, isLoading, isError } = useSuburb(state!, slug!);

// Loading: show skeleton layout (image bar + 4 stat boxes + chart placeholder)
// Error/not found: "Suburb not found" + back to search button

// Pass to components:
<SuburbStats suburb={suburb} />
<PriceTrendChart suburbId={suburb.id} />
<SuburbSoldInsights suburbId={suburb.id} />
<SchoolsList suburbId={suburb.id} lat={suburb.lat} lng={suburb.lng} />
<SuburbListings suburb={suburb.name} state={suburb.state} />
```

**`apps/web/src/features/suburb/components/SuburbSoldInsights.tsx`** (new):
```typescript
// Props: suburbId: string
// Calls: useSuburbSoldStats(suburbId)
// Shows: clearance rate, total sales, median sold price, sale method breakdown

const stats = [
  { label: 'Properties sold (12m)', value: data?.totalSales ?? 0 },
  { label: 'Median sold price',     value: data?.medianSoldPrice ? formatPrice(data.medianSoldPrice) : '—' },
  { label: 'Clearance rate',        value: data?.clearanceRate != null ? `${data.clearanceRate}%` : 'N/A' },
  { label: 'Avg days on market',    value: data?.avgDaysOnMarket ? `${data.avgDaysOnMarket} days` : '—' },
];
// Render as 2x2 stat grid matching existing SuburbStats style
```

**`apps/web/src/features/suburb/components/SuburbListings.tsx`** (new):
```typescript
// Props: suburb: string, state: string
// Reuses usePropertySearch with suburb filter pre-applied
// Shows: SectionHeader "Properties for sale in [suburb]" + PropertyCard grid (6 cards max)
// "View all →" link to /buy?query=[suburb]
```

**Add suburb link on PropertyCard and ListingPage:**
```typescript
// PropertyCard: clicking suburb text navigates to suburb page
const suburbSlug = property.suburb.toLowerCase().replace(/\s+/g, '-');
<Link to={`/suburb/${property.state.toLowerCase()}/${suburbSlug}`}
      className="text-xs text-rea-secondary hover:text-rea-red"
      onClick={e => e.stopPropagation()}>
  {property.suburb}
</Link>

// ListingPage: below suburb/state display
<Link to={`/suburb/${property.state.toLowerCase()}/${suburbSlug}`}
      className="text-sm text-rea-red hover:underline">
  Explore {property.suburb} →
</Link>
```

### Backend endpoint needed

**`GET /suburbs/:id/sold-stats`** — add to SuburbsController + SuburbsService:
```typescript
// SuburbsService.getSoldStats(suburbId: string)
const { data } = await this.supabase.client
  .from('properties')
  .select('sold_price, sale_method, sold_at, auction_at')
  .eq('suburb_id', suburbId)
  .eq('status', 'sold')
  .gte('sold_at', new Date(Date.now() - 365 * 86400000).toISOString());

const prices  = (data ?? []).map(p => p.sold_price).filter(Boolean).sort((a,b) => a-b);
const median  = prices.length ? prices[Math.floor(prices.length / 2)] : null;
const auctions = (data ?? []).filter(p => p.sale_method === 'auction');
const clearanceRate = auctions.length
  ? Math.round((auctions.filter(p => p.sold_price).length / auctions.length) * 100)
  : null;

return {
  totalSales:      data?.length ?? 0,
  medianSoldPrice: median,
  clearanceRate,
  avgDaysOnMarket: null, // TODO: calculate from sold_at - published_at
};
```

### End state check
`/suburb/gujarat/navrangpura` — real data loads, chart renders, sold insights shows, schools list appears.

---

## Session 2-B-2 — Wire Agent Dashboard (All Pages)

### Vibe Coding Instruction
> "Wire all agent dashboard stub pages. The backend is fully built.
> Read each stub before touching it. Wire one page per sub-task.
> Tell me when each one is done before moving to the next."

### Sub-task 1: DashboardHome

**`apps/web/src/api/agents.ts`** — add if missing:
```typescript
export function useAgentStats() {
  return useQuery({
    queryKey: ['agent', 'stats'],
    queryFn: () => apiClient.get('/agents/me/stats'),
    staleTime: 60_000,
  });
}
```
Wire to `DashboardHome.tsx` — 3 stat cards (active listings, enquiries today, total views).

### Sub-task 2: ListingManagement

```typescript
export function useAgentListings(status?: string) {
  return useQuery({
    queryKey: ['agent', 'listings', status],
    queryFn: () => apiClient.get('/agents/me/listings', { params: { status } }),
    staleTime: 30_000,
  });
}

export function useUpdateListingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/properties/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agent', 'listings'] }),
  });
}
```
Wire table + status filter tabs + "Create listing" button → `/dashboard/listings/new`.

### Sub-task 3: ListingWizard submit

Wire the wizard's final "Publish" button:
```typescript
// useCreateListing mutation
export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePropertyInput) => apiClient.post('/properties', dto),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['agent', 'listings'] });
      toast.success('Listing published!');
      navigate(`/buy/${data.id}`);
    },
  });
}
```
Photo upload step: `POST /media/upload` with multipart form.

### Sub-task 4: EnquiriesInbox

```typescript
export function useAgentEnquiries(page = 1) {
  return useQuery({
    queryKey: ['agent', 'enquiries', page],
    queryFn: () => apiClient.get('/agents/me/enquiries', { params: { page } }),
    staleTime: 30_000,
  });
}
```

### Sub-task 5: OfferInbox (new page `/dashboard/offers`)

**`apps/web/src/features/dashboard/pages/OfferInbox.tsx`** (new):

Layout: same table pattern as EnquiriesInbox
Columns: Property · Buyer · Amount (bold, formatted INR) · Date · Status badge · Action

```typescript
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agent', 'offers'] }),
  });
}
```

**Backend: `GET /agents/me/offers`** — add to AgentsController:
```typescript
@Get('me/offers')
@UseGuards(AuthGuard, RolesGuard)
@Roles('agent')
async getMyOffers(@CurrentUser() user: AuthUser) {
  const agent = await this.agentsService.findByProfileId(user.id);
  const { data } = await this.supabase.client
    .from('offers')
    .select('*, property:properties(id, headline, suburb, state)')
    .eq('agent_id', agent.id)
    .order('created_at', { ascending: false })
    .limit(50);
  return data ?? [];
}
```

**Backend: `PATCH /offers/:id/status`** — add to OffersController:
```typescript
@Patch(':id/status')
@UseGuards(AuthGuard)
async updateStatus(
  @Param('id') id: string,
  @Body('status') status: string,
  @CurrentUser() user: AuthUser,
) {
  return this.offersService.updateStatus(id, status, user.id);
}
```

Add `/dashboard/offers` route + sidebar nav item.

### End state check
Login as agent. Dashboard shows stats. Listings table filters work.
Create listing wizard submits and navigates to new listing.
Offer inbox shows offers. Status update works.

---

## Session 2-B-3 — Agent Self-Signup (`/become-an-agent`)

### Vibe Coding Instruction
> "Build the agent self-signup wizard at /become-an-agent.
> Decision locked: pending_agent → admin approves → agent.
> 4-step wizard using useState (not Redux — temporary wizard state).
> Build one step at a time. Show the complete file for each step."

### Feature folder structure
```
apps/web/src/features/agent-signup/
├── components/
│   ├── AgentSignupStepper.tsx
│   ├── Step1PersonalDetails.tsx
│   ├── Step2Agency.tsx          ← join existing OR create new
│   ├── Step3License.tsx
│   ├── Step4Review.tsx
│   └── AgentSignupSuccess.tsx
├── hooks/
│   └── useAgentSignup.ts
├── pages/
│   └── BecomeAnAgentPage.tsx
└── index.ts
```

**Wizard state type:**
```typescript
interface AgentWizardState {
  step: 1 | 2 | 3 | 4
  // Step 1
  fullName: string
  phone: string
  headshotFile?: File
  headshotPreview?: string
  // Step 2
  agencyMode: 'join' | 'create'
  existingAgencyId?: string
  existingAgencyName?: string
  newAgencyName?: string
  newAgencyAddress?: string
  newAgencyPhone?: string
  newAgencyLogoFile?: File
  // Step 3
  licenseNo: string
  licenseDocFile?: File
  bio: string
  yearsActive: number
}
```

**Step 2 — Agency mode:**

"Join existing": `useAgencySearch(query)` → dropdown autocomplete

```typescript
// api/agencies.ts
export function useAgencySearch(query: string) {
  return useQuery({
    queryKey: ['agencies', 'search', query],
    queryFn: () => apiClient.get('/agencies/search', { params: { q: query } }),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}
```

Backend `GET /agencies/search?q=` (public endpoint, no auth):
```typescript
.from('agencies')
.select('id, name, logo_url, suburb, state')
.ilike('name', `%${q}%`)
.limit(8)
```

"Create new": inline form with name, address, phone fields.

**`useAgentSignup.ts`** — submit handler:
```typescript
async function submit(state: AgentWizardState): Promise<void> {
  // 1. Upload headshot (if provided)
  let avatarUrl: string | undefined;
  if (state.headshotFile) {
    avatarUrl = await mediaService.upload(state.headshotFile, 'agent-avatars');
  }

  // 2. Upload license doc (if provided)
  let licenseDocUrl: string | undefined;
  if (state.licenseDocFile) {
    licenseDocUrl = await mediaService.upload(state.licenseDocFile, 'agent-docs');
  }

  // 3. Submit application
  await apiClient.post('/agents/apply', {
    agencyMode:      state.agencyMode,
    existingAgencyId: state.existingAgencyId,
    newAgency: state.agencyMode === 'create' ? {
      name:    state.newAgencyName,
      address: state.newAgencyAddress,
      phone:   state.newAgencyPhone,
    } : undefined,
    licenseNo:    state.licenseNo,
    licenseDocUrl,
    bio:          state.bio,
    yearsActive:  state.yearsActive,
    avatarUrl,
  });
}
```

**Backend: `POST /agents/apply`** — add to AgentsController (no role guard — any user):
```typescript
@Post('apply')
@UseGuards(AuthGuard)  // must be logged in, but any role
async apply(
  @Body() dto: AgentApplicationDto,
  @CurrentUser() user: AuthUser,
) {
  return this.agentsService.apply(dto, user.id);
}

// AgentsService.apply():
async apply(dto: AgentApplicationDto, userId: string) {
  let agencyId = dto.existingAgencyId;

  // Create agency if needed
  if (dto.agencyMode === 'create' && dto.newAgency) {
    const { data } = await this.supabase.client
      .from('agencies')
      .insert({
        name:    dto.newAgency.name,
        slug:    slugify(dto.newAgency.name),
        address: dto.newAgency.address,
        phone:   dto.newAgency.phone,
      })
      .select('id').single();
    agencyId = data!.id;
  }

  // Create agent row
  await this.supabase.client.from('agents').insert({
    profile_id:      userId,
    agency_id:       agencyId,
    license_no:      dto.licenseNo,
    license_doc_url: dto.licenseDocUrl,
    bio:             dto.bio,
    years_active:    dto.yearsActive,
    slug:            slugify(dto.licenseNo + '-' + Date.now()),
  });

  // Update profile role
  await this.supabase.client
    .from('profiles')
    .update({ role: 'pending_agent', pending_agent_since: new Date() })
    .eq('id', userId);

  // Update avatar
  if (dto.avatarUrl) {
    await this.supabase.client
      .from('profiles')
      .update({ avatar_url: dto.avatarUrl })
      .eq('id', userId);
  }

  // Email admin (non-blocking)
  this.resend.sendNewAgentApplication(userId).catch(console.error);

  return { status: 'pending', message: 'Application received. We will review within 2 business days.' };
}
```

**Admin Panel — approve button:**

In `apps/admin/` — add "Approve" button to Users list for `pending_agent` rows:
```typescript
// PATCH /admin/agents/:agentId/approve
async approveAgent(agentId: string, adminId: string) {
  const { data: agent } = await this.supabase.client
    .from('agents').select('profile_id').eq('id', agentId).single();

  await this.supabase.client.from('profiles')
    .update({ role: 'agent', pending_agent_since: null })
    .eq('id', agent.data!.profile_id);

  await this.supabase.client.from('agents')
    .update({ is_verified: true, verified_at: new Date() })
    .eq('id', agentId);

  // Email applicant: approved
  this.resend.sendAgentApproved(agent.data!.profile_id).catch(console.error);

  await this.auditLog(adminId, 'agent.approve', 'agent', agentId, {});
}
```

**CTA placements (drive signups):**
```typescript
// Header: when user is buyer/renter
<Link to="/become-an-agent"
      className="text-sm font-medium text-rea-secondary hover:text-rea-red">
  List your property
</Link>

// Homepage AgentFinderTeaser section — below "Find a local expert":
<Link to="/become-an-agent"
      className="text-sm text-rea-red font-medium hover:underline">
  Are you an agent? Get started →
</Link>
```

**Router:**
```typescript
{ path: 'become-an-agent', element: <BecomeAnAgentPage /> },
```

### End state check
Navigate to `/become-an-agent` as a logged-in buyer. Complete 4 steps.
Success screen shows. DB: `profiles.role = 'pending_agent'`, agents row created.
Admin panel: user shows as pending_agent with "Approve" button. Approve works.
Approved user can access `/dashboard`.

---

## Git + Test Requirements per Session

### 2-B-1: Suburb Profile Wire
```bash
git checkout -b feature/suburb-profile-wire

# After wiring SuburbPage:
git add apps/web/src/api/suburbs.ts
git commit -m "feat(suburb): add useSuburbSoldStats TanStack Query hook"
git add apps/web/src/features/suburb/pages/SuburbPage.tsx
git commit -m "feat(suburb): wire SuburbPage to real API data and components"
git add apps/web/src/features/suburb/components/SuburbSoldInsights.tsx
git commit -m "feat(suburb): add SuburbSoldInsights component with 2x2 stat grid"
git add apps/api/src/modules/suburbs/suburbs.service.ts
git add apps/api/src/modules/suburbs/suburbs.controller.ts
git commit -m "feat(suburb): add GET /suburbs/:id/sold-stats endpoint"
```
**Tests to write:**
- `apps/web/src/features/suburb/components/SuburbSoldInsights.test.tsx`
- Add to `apps/api/src/modules/suburbs/suburbs.service.spec.ts`
(see _test-cases-phase2.md → SESSION 2-B)
```bash
pnpm test --filter=web SuburbSoldInsights
pnpm test --filter=api suburbs.service
```

### 2-B-2: Agent Dashboard Wire
```bash
git checkout -b feature/agent-dashboard-wire

# One commit per page wired:
git add apps/web/src/api/agents.ts
git commit -m "feat(dashboard): add useAgentStats, useAgentListings, useUpdateListingStatus hooks"
git add apps/web/src/features/dashboard/pages/DashboardHome.tsx
git commit -m "feat(dashboard): wire DashboardHome to GET /agents/me/stats"
git add apps/web/src/features/dashboard/pages/ListingManagement.tsx
git commit -m "feat(dashboard): wire ListingManagement table to GET /agents/me/listings"
git add apps/web/src/features/dashboard/pages/OfferInbox.tsx
git commit -m "feat(dashboard): add OfferInbox page at /dashboard/offers"
git add apps/api/src/modules/agents/agents.controller.ts
git add apps/api/src/modules/agents/agents.service.ts
git commit -m "feat(dashboard): add GET /agents/me/offers endpoint"
git add apps/api/src/modules/offers/offers.controller.ts
git commit -m "feat(offers): add PATCH /offers/:id/status endpoint"
```
**Tests to write:**
- `apps/web/src/features/dashboard/pages/OfferInbox.test.tsx` (basic render + empty state)
```bash
pnpm test --filter=web OfferInbox
pnpm test --filter=api agents.service
```

### 2-B-3: Agent Self-Signup
```bash
git checkout -b feature/agent-self-signup

git add apps/web/src/features/agent-signup/
git commit -m "feat(agent-signup): add /become-an-agent 4-step wizard component"
git add apps/web/src/api/agencies.ts
git commit -m "feat(agent-signup): add useAgencySearch hook for agency autocomplete"
git add apps/api/src/modules/agents/agents.controller.ts
git add apps/api/src/modules/agents/agents.service.ts
git commit -m "feat(agent-signup): add POST /agents/apply endpoint"
git add apps/api/src/modules/admin/admin.service.ts
git add apps/api/src/modules/admin/admin.controller.ts
git commit -m "feat(admin): add PATCH /admin/agents/:id/approve endpoint"
git add apps/admin/src/  # admin panel approve button
git commit -m "feat(admin): add approve agent button for pending_agent users"
git add apps/web/src/router.tsx
git commit -m "feat(routing): add /become-an-agent route"
```
**Tests to write:**
- `apps/web/src/features/agent-signup/hooks/useAgentSignup.test.ts`
- `apps/api/src/modules/agents/agents.service.spec.ts` (apply method)
- `e2e/phase2/agent-signup.spec.ts`
(see _test-cases-phase2.md → SESSION 2-B)
```bash
pnpm test --filter=web useAgentSignup
pnpm test --filter=api agents.service
pnpm test:e2e e2e/phase2/agent-signup.spec.ts
```
