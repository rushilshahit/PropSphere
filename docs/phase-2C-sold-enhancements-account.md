# Phase 2-C — Sold Ecosystem + Property Enhancements + User Account
# Paste _shared-context-phase2.md above this.
# Prerequisite: Phase 2-A + 2-B complete.

---

## Session 2-C-1 — Sold PropertyCard Variant + Sold Search Page

### Vibe Coding Instruction
> "Build the sold listings search page. Two parts:
> 1. A 'sold' variant of the existing PropertyCard
> 2. The /sold search page using that card
> Read apps/web/src/features/search/components/PropertyCard.tsx first.
> Add the sold variant without breaking the existing active card."

### Sold PropertyCard variant

**Update `PropertyCard.tsx`** — add `variant?: 'active' | 'sold'` prop:

```tsx
// Image overlay — red diagonal ribbon
{variant === 'sold' && (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-5 -left-6 w-28 text-center text-[11px] font-bold
                    text-white bg-rea-red py-1 transform -rotate-45 shadow-sm">
      SOLD
    </div>
  </div>
)}

// Price display — conditionally swap
{variant === 'sold' ? (
  <>
    <p className="text-xl font-bold tabular-nums text-rea-charcoal">
      {property.soldPriceIsConfidential
        ? <span className="text-base text-rea-secondary italic font-normal">Price withheld</span>
        : formatPrice(property.soldPrice ?? 0)}
    </p>
    <p className="text-xs text-rea-red font-medium mt-0.5">
      Sold {property.soldAt ? format(new Date(property.soldAt), 'd MMM yyyy') : ''}
    </p>
    <p className="text-xs text-rea-secondary mt-1">
      {property.daysOnMarket} days on market
    </p>
  </>
) : (
  // existing active price display — unchanged
)}

// Footer — conditionally swap
{variant === 'sold' ? (
  <Link to={`/agent/${property.agentSlug}`}
        className="text-xs text-rea-red font-medium hover:underline">
    View agent →
  </Link>
) : (
  // existing save button — unchanged
)}
```

Derive `daysOnMarket` in the card (don't add to API yet — compute client-side):
```typescript
const daysOnMarket = property.soldAt && property.publishedAt
  ? Math.floor((new Date(property.soldAt).getTime() - new Date(property.publishedAt).getTime()) / 86400000)
  : undefined;
```

### Sold Search Page

**`apps/web/src/features/sold/`** — new feature folder.

**`apps/web/src/features/sold/hooks/useSoldSearch.ts`**:
```typescript
export interface SoldSearchFilters {
  query?:       string
  suburb?:      string
  priceMin?:    number
  priceMax?:    number
  bedrooms?:    number
  bathrooms?:   number
  propertyTypes?: PropertyType[]
  saleMethod?:  string
  soldAfter?:   string   // ISO date string
  sortBy:       'newest' | 'price_asc' | 'price_desc' | 'days_asc'
  page:         number
}

export function useSoldSearch(filters: SoldSearchFilters) {
  return useInfiniteQuery({
    queryKey: ['properties', 'sold', filters],
    queryFn: ({ pageParam = 1 }) =>
      apiClient.get('/properties/search', {
        params: { ...filtersToSoldParams(filters), listingType: 'sold', page: pageParam },
      }),
    getNextPageParam: (last) => last.page < last.totalPages ? last.page + 1 : undefined,
    staleTime: 30_000,
  });
}
```

**`apps/web/src/features/sold/components/SoldFilterPanel.tsx`** (extends FilterPanel):
- Date sold presets: "Last 3 months" / "Last 6 months" / "Last year" chips
- Sale method multi-select: Auction / Private Treaty / Expression of Interest
- Standard: suburb search, property type, beds, price range

**`apps/web/src/features/sold/pages/SoldSearchPage.tsx`**:
- Same layout as SearchResultsPage (filter sidebar + card grid)
- `<PropertyCard variant="sold">` per result
- Sort options: Most recent / Price High–Low / Price Low–High / Days on market

**Backend: Update `GET /properties/search`** for sold-specific filters:
```typescript
// In PropertiesService.search() — add to filter-building:
if (dto.listingType === 'sold') {
  // Date range filter
  if (dto.soldAfter) query = query.gte('sold_at', dto.soldAfter);
  // Sale method
  if (dto.saleMethod) query = query.eq('sale_method', dto.saleMethod);
  // Sort by sold date
  if (dto.sortBy === 'newest') query = query.order('sold_at', { ascending: false });
  // Include sold price in select
}
```

**`apps/web/src/router.tsx`** — `/sold` should render `SoldSearchPage` (not `SearchResultsPage`):
```typescript
{ path: 'sold', element: React.lazy(() => import('@/features/sold/pages/SoldSearchPage')) },
```

---

## Session 2-C-2 — Sold Property Detail + Price History Chart

### Vibe Coding Instruction
> "Enhance the property detail page for sold listings.
> Read apps/web/src/features/listing/pages/ListingPage.tsx first.
> Then: 1) split price panel into active vs sold mode
> 2) add price history chart below sold history
> 3) add 'Thinking of selling?' appraisal CTA section
> Build all three. One component at a time."

### SoldPricePanel component

**`apps/web/src/features/listing/components/SoldPricePanel.tsx`** (new):
```tsx
export function SoldPricePanel({ property }: { property: PropertyDetail }) {
  const daysOnMarket = property.soldAt && property.publishedAt
    ? Math.floor((new Date(property.soldAt).getTime() - new Date(property.publishedAt).getTime()) / 86400000)
    : null;

  const delta = property.soldPrice && property.price
    ? Math.round(((property.soldPrice - property.price) / property.price) * 100)
    : null;

  return (
    <div className="bg-rea-red/5 border border-rea-red/20 rounded-[8px] p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-rea-red mb-2">
        SOLD {property.soldAt ? format(new Date(property.soldAt), 'd MMM yyyy') : ''}
      </p>
      <p className="text-4xl font-extrabold tabular-nums text-rea-charcoal">
        {property.soldPriceIsConfidential
          ? <span className="text-2xl text-rea-secondary italic font-normal">Price withheld</span>
          : formatPrice(property.soldPrice ?? 0)}
      </p>
      <div className="grid grid-cols-3 gap-3 mt-4 text-center border-t border-rea-border pt-4">
        <div>
          <p className="text-lg font-bold">{daysOnMarket ?? '—'}</p>
          <p className="text-xs text-rea-secondary">Days on market</p>
        </div>
        <div>
          <p className="text-sm font-semibold capitalize">
            {property.saleMethod?.replace(/_/g, ' ') ?? '—'}
          </p>
          <p className="text-xs text-rea-secondary">Sale method</p>
        </div>
        {delta !== null && (
          <div>
            <p className={`text-sm font-bold ${delta >= 0 ? 'text-rea-success' : 'text-rea-error'}`}>
              {delta >= 0 ? '↑' : '↓'}{Math.abs(delta)}%
            </p>
            <p className="text-xs text-rea-secondary">vs asking</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

**In `ListingPage.tsx`** — conditionally render:
```tsx
{property.status === 'sold'
  ? <SoldPricePanel property={property} />
  : <ActivePricePanel property={property} onEnquire={() => setEnquiryOpen(true)} />
}
```

Also hide: inspection times, enquiry button, "Make an offer" when sold.
Replace with: "View agent" button → `/agent/${agentSlug}`.

### PriceHistoryChart

**`apps/web/src/api/properties.ts`** — add:
```typescript
export function usePriceHistory(propertyId: string) {
  return useQuery({
    queryKey: ['price-history', propertyId],
    queryFn: () => apiClient.get<PriceHistoryRecord[]>(`/properties/${propertyId}/price-history`),
    staleTime: 24 * 60 * 60_000,
    enabled: !!propertyId,
  });
}
```

**`apps/web/src/features/listing/components/PriceHistoryChart.tsx`** (new):
```tsx
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export function PriceHistoryChart({
  propertyId,
  currentPrice,
}: { propertyId: string; currentPrice?: number }) {
  const { data: history, isLoading } = usePriceHistory(propertyId);

  if (isLoading) return <Skeleton height="200px" />;
  if (!history?.length) return (
    <p className="text-sm text-rea-secondary italic py-4 text-center">
      No price history recorded for this property.
    </p>
  );

  const chartData = [
    ...history.map(h => ({
      date:   format(new Date(h.soldDate), 'MMM yy'),
      price:  h.soldPrice,
      method: h.saleMethod,
    })),
    ...(currentPrice ? [{ date: 'Current', price: currentPrice, method: null }] : []),
  ];

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6F6F6F' }} />
          <YAxis
            tickFormatter={(v: number) => formatPrice(v)}
            tick={{ fontSize: 10, fill: '#6F6F6F' }}
            width={75}
          />
          <Tooltip
            formatter={(value: number) => [formatPrice(value), 'Price']}
            contentStyle={{ borderRadius: '4px', border: '1px solid #DDDDDD', fontSize: 13 }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#E5001A"
            strokeWidth={2}
            dot={{ fill: '#E5001A', r: 5, strokeWidth: 0 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-rea-secondary mt-2 text-right">
        Source: PropSphere records
      </p>
    </div>
  );
}
```

**In `ListingPage.tsx`** — add after `SoldHistory` section:
```tsx
<section className="mt-8">
  <h3 className="text-lg font-bold text-rea-charcoal mb-4">Price History</h3>
  <PriceHistoryChart propertyId={property.id} currentPrice={property.price} />
</section>
```

**Backend: `GET /properties/:id/price-history`**:
```typescript
@Get(':id/price-history')
getPriceHistory(@Param('id') id: string) {
  return this.propertiesService.getPriceHistory(id);
}

// In PropertiesService:
async getPriceHistory(propertyId: string): Promise<PriceHistoryRecord[]> {
  const { data } = await this.supabase.client
    .from('property_price_history')
    .select('id, sold_price, sold_date, sale_method, source')
    .eq('property_id', propertyId)
    .order('sold_date', { ascending: true });
  return data ?? [];
}
```

**Auto-create history record when agent marks sold** — update `PropertiesService.updateStatus()`:
```typescript
if (newStatus === 'sold' && dto.soldPrice) {
  const property = await this.findOne(propertyId);
  const addressKey = [
    property.suburb, property.state, property.streetNumber, property.streetName,
  ].join('_').toLowerCase().replace(/\s+/g, '_');

  await this.supabase.client.from('property_price_history').insert({
    property_id:  propertyId,
    address_key:  addressKey,
    sold_price:   dto.soldPrice,
    sold_date:    dto.soldAt ?? new Date().toISOString().split('T')[0],
    sale_method:  property.saleMethod,
    source:       'internal',
    is_seed_data: false,
  });
}
```

### "Thinking of selling?" CTA

**`apps/web/src/features/listing/components/AppraisalCTA.tsx`** (new):
- Only renders on sold listings or if user owns property type
- Simple form: name, email, phone, suburb (pre-filled from property)
- Submits to `POST /enquiries` with `type: 'appraisal'`

```tsx
export function AppraisalCTA({ suburb, agentId, propertyId }: AppraisalCTAProps) {
  const { register, handleSubmit } = useForm<AppraisalInput>();
  const { mutate, isPending, isSuccess } = useCreateEnquiry();

  if (isSuccess) return (
    <div className="bg-rea-success/10 border border-rea-success/20 rounded-[8px] p-5 text-center">
      <p className="font-semibold text-rea-success">Request sent!</p>
      <p className="text-sm text-rea-secondary mt-1">An agent will contact you within 24 hours.</p>
    </div>
  );

  return (
    <section className="bg-neutral-50 border border-rea-border rounded-[8px] p-6">
      <h3 className="text-lg font-bold text-rea-charcoal">Thinking of selling?</h3>
      <p className="text-sm text-rea-secondary mb-4">
        Get a free appraisal from a local expert in {suburb}.
      </p>
      <form onSubmit={handleSubmit(data => mutate({ ...data, agentId, propertyId, type: 'appraisal' }))}
            className="space-y-3">
        <Input label="Your name"  {...register('name')} />
        <Input label="Your email" type="email" {...register('email')} />
        <Input label="Your phone" {...register('phone')} />
        <Button type="submit" variant="primary" className="w-full" loading={isPending}>
          Request free appraisal
        </Button>
      </form>
    </section>
  );
}
```

---

## Session 2-C-3 — Property Detail Enhancements (Floor Plan, Virtual Tour, BHK, Badges)

### Vibe Coding Instruction
> "Enhance property listing cards and detail page.
> Read existing files first. Four changes:
> 1. Floor plan tab in PhotoGallery
> 2. Virtual tour iframe tab in PhotoGallery
> 3. BHK config display (overrides bed count)
> 4. Smart badge priority logic on PropertyCard
> Build one at a time."

### 1. Floor Plan + Virtual Tour tabs in PhotoGallery

**Read `PhotoGallery.tsx` first. Then add:**

```tsx
const regularImages = images.filter(i => !i.isFloorPlan);
const floorPlans    = images.filter(i => i.isFloorPlan);
const hasVirtualTour = !!virtualTourUrl;

const tabs = [
  { key: 'photos',     label: `Photos (${regularImages.length})` },
  ...(floorPlans.length ? [{ key: 'floorplan', label: 'Floor Plan' }] : []),
  ...(hasVirtualTour   ? [{ key: 'tour',      label: '360° Tour'  }] : []),
  { key: 'streetview', label: 'Street View' },
];

// Floor plan tab content:
{activeTab === 'floorplan' && (
  <div className="space-y-4">
    {floorPlans.map(fp => (
      <img key={fp.id}
           src={`${fp.cdnUrl}?width=1200&format=webp`}
           alt="Floor plan"
           className="w-full rounded-[8px] cursor-zoom-in"
           onClick={() => openLightbox(fp)}
           loading="lazy" />
    ))}
  </div>
)}

// Virtual tour tab content:
{activeTab === 'tour' && (
  <div className="relative bg-neutral-900 rounded-[8px] overflow-hidden"
       style={{ paddingBottom: '56.25%', height: 0 }}>
    <iframe
      src={virtualTourUrl!}
      className="absolute inset-0 w-full h-full"
      sandbox="allow-scripts allow-same-origin allow-fullscreen"
      allowFullScreen
      title="Virtual property tour"
    />
    <a href={virtualTourUrl!} target="_blank" rel="noopener noreferrer"
       className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm
                  text-xs font-medium px-3 py-1.5 rounded-[4px]
                  flex items-center gap-1.5">
      <ExternalLink className="w-3 h-3" /> Open full screen
    </a>
  </div>
)}
```

### 2. BHK Config Display

**In `PropertyStats.tsx`** — update bed display:
```tsx
<div className="flex items-center gap-1.5">
  <BedDouble className="w-4 h-4 text-rea-secondary shrink-0" />
  <span className="text-sm font-medium text-rea-charcoal">
    {property.bhkConfig ?? `${property.bedrooms} Bed`}
  </span>
</div>
```

**In `PropertyCard.tsx`** — stats row:
```tsx
{property.bhkConfig ?? `${property.bedrooms}`}
// Icon + number stays same, but number/text changes
```

**In ListingWizard Step 3** — add `bhk_config` input:
```tsx
<Input
  label="BHK Configuration (optional)"
  placeholder="e.g. 2 BHK, 3 BHK + Study"
  helper="Overrides the bedroom count in display if set"
  {...register('bhkConfig')}
/>
```

### 3. Smart Badge Logic on PropertyCard

**Add `nextInspectionAt?: string` to `PropertySummary` type** in packages/types.

**Update backend search** to include `nextInspectionAt`:
```typescript
// In the hero image join, also fetch next inspection:
const nextInspection = await supabase
  .from('inspections')
  .select('starts_at')
  .eq('property_id', property.id)
  .eq('cancelled', false)
  .gte('starts_at', new Date().toISOString())
  .order('starts_at', { ascending: true })
  .limit(1)
  .single();
// Add nextInspectionAt: nextInspection.data?.starts_at to PropertySummary
```

**Badge derivation utility** — create `apps/web/src/features/search/utils/derive-badge.ts`:
```typescript
import { PropertySummary } from '@propsphere/types';

export interface ListingBadge {
  label: string
  className: string
}

export function deriveBadge(property: PropertySummary): ListingBadge | null {
  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 86400000);

  if (property.saleMethod === 'auction'
      && property.auctionAt
      && new Date(property.auctionAt) > now) {
    return { label: 'Auction', className: 'bg-rea-warning text-white' };
  }
  if (property.status === 'under_contract') {
    return { label: 'Under Offer', className: 'bg-neutral-700 text-white' };
  }
  if (property.nextInspectionAt
      && new Date(property.nextInspectionAt) > now
      && new Date(property.nextInspectionAt) < sevenDays) {
    return { label: 'Inspection', className: 'bg-rea-teal text-white' };
  }
  if (property.virtualTourUrl) {
    return { label: '360° Tour', className: 'bg-purple-600 text-white' };
  }
  if (property.publishedAt
      && new Date(property.publishedAt) > new Date(now.getTime() - 7 * 86400000)) {
    return { label: 'New', className: 'bg-rea-red text-white' };
  }
  return null;
}
```

**In `PropertyCard.tsx`** — use `deriveBadge`:
```tsx
const badge = deriveBadge(property);
{badge && (
  <span className={`absolute top-3 left-3 text-[11px] font-bold px-2 py-0.5 rounded-[4px] ${badge.className}`}>
    {badge.label}
  </span>
)}
```

---

## Session 2-C-4 — User Account Enhancements

### Vibe Coding Instruction
> "Three user account features:
> 1. Recently viewed (/account/history) — localStorage guests, DB sync on login
> 2. Enquiry history (/account/enquiries)
> 3. Notes on saved properties (inline edit in collections page)
> Decision locked: localStorage for guests, sync to DB on login (merge last 20).
> Build in this order. Read existing account pages first."

### 1. Recently Viewed

**Track in `ListingPage.tsx`** on mount (after existing useIncrementViewCount):
```typescript
function useTrackRecentlyViewed(propertyId: string) {
  const { user } = useAuth();

  useEffect(() => {
    if (!propertyId) return;

    // 1. Always update localStorage
    const stored = localStorage.getItem('rv');
    const viewed: string[] = stored ? JSON.parse(stored) : [];
    const updated = [propertyId, ...viewed.filter(id => id !== propertyId)].slice(0, 20);
    localStorage.setItem('rv', JSON.stringify(updated));

    // 2. Sync to DB if authenticated (fire and forget — never block)
    if (user) {
      apiClient.post('/users/recently-viewed', { propertyId })
        .catch(() => {}); // silent failure OK
    }
  }, [propertyId]); // only re-run when propertyId changes
}
```

**`apps/web/src/features/account/pages/RecentlyViewedPage.tsx`** (new route `/account/history`):
```typescript
function useRecentlyViewed() {
  const { user } = useAuth();
  const localIds: string[] = JSON.parse(localStorage.getItem('rv') ?? '[]');

  // Fetch DB history if authenticated
  const { data: dbHistory } = useQuery({
    queryKey: ['recently-viewed'],
    queryFn: () => apiClient.get<{ propertyId: string }[]>('/users/recently-viewed'),
    enabled: !!user,
    staleTime: 60_000,
  });

  // Merge: DB first (more reliable), then local
  const allIds = user
    ? [...new Set([...(dbHistory?.map(r => r.propertyId) ?? []), ...localIds])].slice(0, 20)
    : localIds;

  // Batch fetch property summaries
  const { data: properties } = useQuery({
    queryKey: ['properties', 'batch', allIds],
    queryFn: () => apiClient.post<PropertySummary[]>('/properties/batch', { ids: allIds }),
    enabled: allIds.length > 0,
    staleTime: 60_000,
  });

  return { properties: properties ?? [], count: allIds.length };
}
```

Page layout: `<PropertyCard>` grid + "Clear history" button + empty state.

**Backend:**
```typescript
// POST /users/recently-viewed
await supabase.from('recently_viewed')
  .upsert(
    { user_id: userId, property_id: dto.propertyId, viewed_at: new Date() },
    { onConflict: 'user_id,property_id' }
  );

// Prune to keep only last 20 rows per user
// (run a delete after upsert: delete rows not in top 20 by viewed_at)

// GET /users/recently-viewed
.from('recently_viewed')
.select('property_id, viewed_at')
.eq('user_id', userId)
.order('viewed_at', { ascending: false })
.limit(20)

// POST /properties/batch (new public endpoint)
.from('properties')
.select(PROPERTY_SUMMARY_COLUMNS)
.in('id', dto.ids)
// Note: preserves order via client-side sort after fetch
```

### 2. Enquiry History

**`apps/web/src/api/enquiries.ts`** — add:
```typescript
export function useMyEnquiries() {
  return useQuery({
    queryKey: ['my-enquiries'],
    queryFn: () => apiClient.get('/users/me/enquiries'),
    staleTime: 60_000,
  });
}
```

**Backend: `GET /users/me/enquiries`** — add to a new `UsersModule` or extend AuthModule:
```typescript
.from('enquiries')
.select('id, message, created_at, status, property:properties(id, headline, suburb, state, hero_image_url)')
.eq('sender_id', userId)
.order('created_at', { ascending: false })
.limit(50)
```

**`apps/web/src/features/account/pages/EnquiryHistoryPage.tsx`** (new, route `/account/enquiries`):
Timeline list (not grid). Each row: 64px property thumbnail, address, date, message preview, "View property" link.

### 3. Notes on Saved Properties

**Read `CollectionsPage.tsx` first. Then add inline note editing:**

```tsx
const [editingId, setEditingId] = useState<string | null>(null);
const [noteValue,  setNoteValue]  = useState('');

// Per saved property card — note toggle below card:
<div className="mt-2 px-1">
  {editingId === item.collectionPropertyId ? (
    <div>
      <textarea
        className="w-full text-sm border border-rea-border rounded-[4px] p-2 resize-none
                   focus:ring-1 focus:ring-rea-red focus:border-rea-red"
        maxLength={500}
        rows={3}
        value={noteValue}
        onChange={e => setNoteValue(e.target.value)}
        autoFocus
      />
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs text-rea-secondary">{noteValue.length}/500</span>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
          <Button size="sm" loading={savingNote}
                  onClick={() => saveNote(item.collectionId, item.propertyId, noteValue)}>
            Save note
          </Button>
        </div>
      </div>
    </div>
  ) : (
    <button
      onClick={() => { setEditingId(item.collectionPropertyId); setNoteValue(item.notes ?? ''); }}
      className="flex items-center gap-1 text-xs text-rea-secondary hover:text-rea-charcoal">
      <PenLine className="w-3 h-3" />
      {item.notes ? 'Edit note' : 'Add note'}
    </button>
  )}
  {item.notes && editingId !== item.collectionPropertyId && (
    <p className="text-xs text-rea-secondary italic mt-1 line-clamp-2">{item.notes}</p>
  )}
</div>
```

**Backend: `PATCH /collections/:collectionId/properties/:propertyId/notes`**:
```typescript
await supabase.from('collection_properties')
  .update({ notes: dto.notes.slice(0, 500) })
  .eq('collection_id', collectionId)
  .eq('property_id', propertyId);
```

**Mutation hook:**
```typescript
export function useUpdateCollectionNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ collectionId, propertyId, notes }: NoteInput) =>
      apiClient.patch(`/collections/${collectionId}/properties/${propertyId}/notes`, { notes }),
    onSuccess: (_, { collectionId }) =>
      qc.invalidateQueries({ queryKey: ['collections', collectionId] }),
  });
}
```

**Update account sidebar nav** — add links for new pages:
```typescript
{ label: 'My Saved',     href: '/account/saved',     icon: Heart },
{ label: 'Saved Searches', href: '/account/searches', icon: Bell },
{ label: 'Recently Viewed', href: '/account/history', icon: Clock },
{ label: 'Enquiries',    href: '/account/enquiries',  icon: MessageSquare },
{ label: 'My Offers',    href: '/account/offers',     icon: HandCoins },
```

---

## Git + Test Requirements per Session

### 2-C-1: Sold Card + Sold Search Page
```bash
git checkout -b feature/sold-search-page

git add apps/web/src/features/search/components/PropertyCard.tsx
git commit -m "feat(sold): add sold variant with red ribbon and sold price display to PropertyCard"
git add apps/web/src/features/sold/
git commit -m "feat(sold): add SoldSearchPage with date range and sale method filters"
git add apps/web/src/api/properties.ts  # useSoldSearch hook
git commit -m "feat(sold): add useSoldSearch infinite query hook"
git add apps/api/src/modules/properties/properties.service.ts
git commit -m "feat(sold): extend GET /properties/search for sold-specific filters"
git add apps/web/src/router.tsx
git commit -m "feat(routing): update /sold route to render SoldSearchPage"
```
**Tests:**
- `apps/web/src/features/search/utils/derive-badge.test.ts` ← all badge logic
- `apps/web/src/features/sold/pages/SoldSearchPage.test.tsx` (render + filter panel)
```bash
pnpm test --filter=web derive-badge
pnpm test --filter=web SoldSearchPage
```

### 2-C-2: Sold Detail + Price History
```bash
git checkout -b feature/sold-detail-price-history

git add apps/web/src/features/listing/components/SoldPricePanel.tsx
git commit -m "feat(sold): add SoldPricePanel component with sold date, method, delta"
git add apps/web/src/features/listing/components/PriceHistoryChart.tsx
git commit -m "feat(sold): add PriceHistoryChart using Recharts LineChart"
git add apps/web/src/features/listing/components/AppraisalCTA.tsx
git commit -m "feat(sold): add AppraisalCTA 'Thinking of selling?' section"
git add apps/web/src/features/listing/pages/ListingPage.tsx
git commit -m "feat(sold): conditionally render SoldPricePanel vs ActivePricePanel"
git add apps/web/src/api/properties.ts  # usePriceHistory hook
git commit -m "feat(sold): add usePriceHistory hook"
git add apps/api/src/modules/properties/properties.controller.ts
git add apps/api/src/modules/properties/properties.service.ts
git commit -m "feat(sold): add GET /properties/:id/price-history endpoint"
git commit -m "feat(sold): auto-create price history record on status → sold transition"
```
**Tests:**
- `apps/web/src/features/listing/components/PriceHistoryChart.test.tsx`
- `apps/api/src/modules/properties/properties.service.spec.ts` (price history + auto-create)
(see _test-cases-phase2.md → SESSION 2-C)
```bash
pnpm test --filter=web PriceHistoryChart
pnpm test --filter=api properties.service
pnpm test:e2e e2e/phase2/sold.spec.ts
```

### 2-C-3: Floor Plan, Virtual Tour, BHK, Badges
```bash
git checkout -b feature/property-floor-plan-tour-badges

git add apps/web/src/features/listing/components/PhotoGallery.tsx
git commit -m "feat(listing): add Floor Plan tab to PhotoGallery"
git commit -m "feat(listing): add 360° Tour iframe embed tab to PhotoGallery"
git add apps/web/src/features/search/utils/derive-badge.ts
git commit -m "feat(search): add deriveBadge utility with priority logic"
git add apps/web/src/features/search/components/PropertyCard.tsx
git commit -m "feat(search): apply deriveBadge to PropertyCard, add nextInspectionAt support"
git add apps/web/src/features/listing/components/PropertyStats.tsx
git commit -m "feat(listing): add BHK config display (overrides bedroom count)"
```
**Tests:** `derive-badge.test.ts` is the critical one (already spec'd above).
```bash
pnpm test --filter=web derive-badge
pnpm test --filter=web PropertyCard  # check badge rendering
```

### 2-C-4: User Account Enhancements
```bash
git checkout -b feature/user-account-history-notes

git add apps/web/src/features/listing/pages/ListingPage.tsx  # useTrackRecentlyViewed
git commit -m "feat(account): track recently viewed in localStorage + DB sync on mount"
git add apps/web/src/features/account/pages/RecentlyViewedPage.tsx
git commit -m "feat(account): add /account/history recently viewed page"
git add apps/web/src/features/account/pages/EnquiryHistoryPage.tsx
git commit -m "feat(account): add /account/enquiries enquiry history page"
git add apps/web/src/features/collections/pages/CollectionsPage.tsx
git commit -m "feat(collections): add inline note editing with 500-char limit"
git add apps/api/src/modules/  # users module endpoints
git commit -m "feat(account): add POST/GET /users/recently-viewed + GET /users/me/enquiries"
git add apps/api/src/modules/properties/properties.controller.ts
git commit -m "feat(properties): add POST /properties/batch endpoint for recently viewed"
git add apps/api/src/modules/collections/collections.controller.ts
git commit -m "feat(collections): add PATCH /collections/:id/properties/:id/notes endpoint"
```
**Tests:**
- `apps/web/src/features/account/pages/RecentlyViewedPage.test.tsx` (localStorage behaviour)
(see _test-cases-phase2.md → SESSION 2-C)
```bash
pnpm test --filter=web RecentlyViewed
pnpm test --filter=web useTrackRecentlyViewed
```
