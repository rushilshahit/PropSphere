# Frontend Implementation Prompt
## PropSphere — React + TypeScript

---

## Stack

- React 18 (with concurrent features — Suspense, transitions)
- TypeScript strict mode
- Vite (bundler)
- TailwindCSS v3
- Redux Toolkit (UI state only)
- TanStack Query v5 (server state, caching, mutations)
- React Router v6
- Mapbox GL JS + `react-map-gl`
- Recharts (suburb charts, finance calculator)
- `@dnd-kit` (photo reordering in listing wizard)
- `react-dropzone` (photo upload)
- `react-hook-form` + Zod (all forms)
- `date-fns` (date formatting)
- `react-hot-toast` (toasts)

---

## Project Bootstrap

```bash
pnpm create vite apps/web --template react-ts
cd apps/web
pnpm add @tanstack/react-query @reduxjs/toolkit react-redux react-router-dom
pnpm add react-map-gl mapbox-gl
pnpm add react-hook-form @hookform/resolvers zod
pnpm add recharts @dnd-kit/core @dnd-kit/sortable
pnpm add react-dropzone react-hot-toast date-fns
pnpm add -D tailwindcss postcss autoprefixer
```

---

## State Architecture

### What goes where

| State | Tool | Rationale |
|---|---|---|
| Properties search results | TanStack Query | Server state, auto-invalidate |
| Filter values (beds, price, etc.) | Redux slice | Shared between FilterPanel, URL sync, Map |
| Map viewport (center, zoom) | Redux slice | Shared between map and list |
| Auth user | Redux slice + Supabase listener | Session persisted |
| Collections | TanStack Query | Server state |
| Compare drawer open/closed | Redux slice | UI-only |
| Modal open/closed | Local state (useState) | Unshared |

### Search Filter Slice

```typescript
// features/search/store/searchSlice.ts
interface SearchFilters {
  listingType: 'buy' | 'rent' | 'sold';
  location: string;
  locationLat?: number;
  locationLng?: number;
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  carSpaces?: number;
  propertyTypes: PropertyType[];
  features: string[];
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'inspection_time';
  radius?: number;
}
```

Filter state syncs bidirectionally with URL query params — this is non-negotiable for shareability and back-button behaviour. Use a custom hook `useSearchParams` wrapper.

---

## API Layer

All API calls go through `apps/web/src/api/`. Each file exports TanStack Query hooks.

```typescript
// api/properties.ts
import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';

const PROPERTIES_KEY = 'properties' as const;

export function usePropertySearch(filters: SearchFilters) {
  return useInfiniteQuery({
    queryKey: [PROPERTIES_KEY, 'search', filters],
    queryFn: ({ pageParam = 1 }) =>
      fetch(`/api/properties/search?${buildQueryString(filters)}&page=${pageParam}`)
        .then(res => res.json()),
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    staleTime: 30_000,
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: [PROPERTIES_KEY, id],
    queryFn: () => fetch(`/api/properties/${id}`).then(res => res.json()),
    staleTime: 60_000,
  });
}
```

**Convention:** Never use `fetch` directly in a component. Always go through the `api/` layer.

---

## Routing

```typescript
// router.tsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'buy', element: <SearchResultsPage listingType="buy" /> },
      { path: 'rent', element: <SearchResultsPage listingType="rent" /> },
      { path: 'sold', element: <SearchResultsPage listingType="sold" /> },
      { path: ':listingType/:state/:suburb/:slug', element: <ListingPage /> },
      { path: 'suburb/:state/:slug', element: <SuburbPage /> },
      { path: 'agent/:slug', element: <AgentPage /> },
      { path: 'finance', element: <FinancePage /> },
      {
        path: 'account',
        element: <ProtectedRoute><AccountLayout /></ProtectedRoute>,
        children: [
          { path: 'saved', element: <CollectionsPage /> },
          { path: 'alerts', element: <AlertsPage /> },
          { path: 'searches', element: <SavedSearchesPage /> },
        ],
      },
      {
        path: 'dashboard',
        element: <ProtectedRoute roles={['agent']}><DashboardLayout /></ProtectedRoute>,
        children: [
          { index: true, element: <DashboardHome /> },
          { path: 'listings', element: <ListingManagement /> },
          { path: 'listings/new', element: <ListingWizard /> },
          { path: 'listings/:id/edit', element: <ListingWizard /> },
          { path: 'enquiries', element: <EnquiriesInbox /> },
        ],
      },
    ],
  },
]);
```

---

## Key Component Implementations

### SearchBar with URL sync

```typescript
// features/search/components/SearchBar.tsx
export function SearchBar() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(s => s.search.filters);
  const [, setSearchParams] = useSearchParams();

  const debouncedSync = useDebouncedCallback((filters: SearchFilters) => {
    setSearchParams(filtersToParams(filters));
  }, 200);

  function handleLocationChange(value: string) {
    dispatch(setLocation(value));
    debouncedSync({ ...filters, location: value });
  }

  // ...
}
```

### Property Card

```typescript
// features/search/components/PropertyCard.tsx
interface PropertyCardProps {
  property: PropertySummary;
  compact?: boolean;
}

export function PropertyCard({ property, compact = false }: PropertyCardProps) {
  const { isSaved, toggle } = useSaveProperty(property.id);

  return (
    <article className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden group">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={property.heroImageUrl}
          alt={property.fullAddress}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <button
          onClick={(e) => { e.preventDefault(); toggle(); }}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm"
          aria-label={isSaved ? 'Remove from saved' : 'Save property'}
        >
          <HeartIcon filled={isSaved} className="w-4 h-4 text-brand-primary" />
        </button>
        {property.badge && <ListingBadge type={property.badge} />}
        <PhotoCount count={property.imageCount} />
      </div>

      <div className="p-4">
        <p className="text-xl font-bold text-neutral-900 tabular-nums">
          {formatPrice(property)}
        </p>
        <p className="text-sm text-neutral-700 mt-1">{property.fullAddress}</p>
        <PropertyStats
          beds={property.bedrooms}
          baths={property.bathrooms}
          cars={property.carSpaces}
          landSize={property.landSizesqm}
          compact={compact}
        />
      </div>
    </article>
  );
}
```

### Map Integration

```typescript
// features/map/components/MapView.tsx
import Map, { Marker, NavigationControl } from 'react-map-gl';

export function MapView() {
  const { viewport, setViewport } = useAppSelector(s => s.map);
  const properties = useMapProperties(viewport);

  return (
    <Map
      {...viewport}
      onMove={e => dispatch(setViewport(e.viewState))}
      mapStyle="mapbox://styles/mapbox/light-v11"
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
    >
      <NavigationControl position="bottom-right" />
      {properties.map(p => (
        <PropertyMarker key={p.id} property={p} />
      ))}
    </Map>
  );
}
```

### Enquiry Form with react-hook-form + Zod

```typescript
const enquirySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Please write a message'),
});

type EnquiryFormValues = z.infer<typeof enquirySchema>;

export function EnquiryModal({ propertyId, agentId, onClose }: EnquiryModalProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
  });
  const { mutate, isPending } = useCreateEnquiry();

  function onSubmit(data: EnquiryFormValues) {
    mutate({ ...data, propertyId, agentId }, {
      onSuccess: () => { toast.success('Enquiry sent!'); onClose(); },
    });
  }

  // ...
}
```

---

## Finance Calculators (Client-Side Only)

```typescript
// packages/utils/src/calc-repayment.ts
export function calcMonthlyRepayment(
  principal: number,
  annualRate: number,
  termYears: number,
): number {
  const monthlyRate = annualRate / 100 / 12;
  const n = termYears * 12;
  if (monthlyRate === 0) return principal / n;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, n))
    / (Math.pow(1 + monthlyRate, n) - 1);
}
```

No API call. Calculators run entirely in the browser.

---

## Performance Requirements

- Virtualise search result lists > 50 items (`@tanstack/react-virtual`)
- Lazy load all feature routes via `React.lazy` + `Suspense`
- Property images: `loading="lazy"`, first image `loading="eager"` + `fetchpriority="high"`
- Mapbox: initialise only when MapView is in viewport (`IntersectionObserver`)
- TanStack Query staleTime: 30s for search results, 60s for listing detail, 300s for suburb data
- Debounce filter changes: 200ms before triggering API call

---

## Accessibility

- All interactive elements keyboard-navigable
- Map has a text-based fallback list always in DOM (visually hidden, not `display:none`)
- Images always have `alt` text
- Modals trap focus (`@radix-ui/react-dialog` or custom focus trap)
- Form errors announced via `aria-live` region
- Colour contrast ratios meet WCAG AA

---

## Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_MAPBOX_TOKEN=
VITE_API_BASE_URL=
```

---

## Testing

- Unit: Vitest + Testing Library
- Component tests: test behaviour, not implementation
- E2E: Playwright — test search flow, enquiry submit, auth

---

## SEO Note

The current plan uses client-side React with Vite. However, for listing pages, suburb pages, and agent pages, SEO matters (Google indexing). **See `docs/DISCUSSION.md` for the Next.js vs Vite debate.** If we stay with Vite, implement prerendering via `vite-plugin-prerender` or proxy SSR via a lightweight Express layer. If we switch to Next.js App Router, the `api/` layer and component structure stay mostly unchanged — only pages and data-fetching patterns shift.
