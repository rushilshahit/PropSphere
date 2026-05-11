# Phase 1 Prompt — Core Search
# Paste _shared-context.md above this, then use this section.
# Prerequisite: Phase 0 complete. DB seeded. Apps run.

---

## Phase Goal
User can type a location, apply filters, see property cards, scroll through results, and share the URL. Filter state lives in Redux and syncs to URL params.

---

## Session 1-A — Shared Types + Redux Slice

### Task
Create `SearchFilters` type and the search Redux slice with URL sync.

**1. `packages/types/src/search.ts`** (if not done in Phase 0)
```typescript
interface SearchFilters {
  listingType: 'buy' | 'rent' | 'sold'
  query: string              // free text + location
  priceMin?: number
  priceMax?: number
  bedrooms?: number
  bathrooms?: number
  carSpaces?: number
  propertyTypes: PropertyType[]
  features: string[]
  sortBy: 'newest' | 'price_asc' | 'price_desc'
  page: number
}
interface SearchResult<T> {
  items: T[]
  total: number
  page: number
  totalPages: number
}
```

**2. `apps/web/src/features/search/store/searchSlice.ts`**
- State: `filters: SearchFilters` with sensible defaults
- Actions: `setFilters`, `resetFilters`, `setListingType`, `setLocation`, `setPriceRange`, `setBedrooms`, `setSortBy`
- Selectors: `selectSearchFilters`, `selectListingType`, `selectActiveFilterCount` (how many non-default filters are set)
- Register in `apps/web/src/store/rootReducer.ts`

**3. `apps/web/src/features/search/hooks/useSearchParams.ts`**
- Custom hook: bidirectional sync of `SearchFilters` ↔ URL query params
- `filtersToParams(filters): URLSearchParams`
- `paramsToFilters(params: URLSearchParams): Partial<SearchFilters>`
- Uses React Router `useSearchParams`
- Debounce URL write 200ms

### End state check
Redux devtools show search slice. Changing filters updates URL. Refreshing page restores filter state.

---

## Session 1-B — UI Primitives

### Task
Build the shared UI primitives needed by search. These live in `apps/web/src/components/ui/`.

**Build each component:**

**`Button.tsx`**
- Props: `variant: 'primary'|'secondary'|'ghost'|'danger'`, `size: 'sm'|'md'|'lg'`, `loading?: boolean`, `disabled?: boolean`, all standard button attrs
- Loading: shows `<Spinner />` inline, pointer-events-none
- All variants defined in `.claude/design.md`

**`Input.tsx`**
- Props: `label?: string`, `error?: string`, `helper?: string`, all standard input attrs
- Renders label above, error/helper below
- Focus ring: `ring-2 ring-brand-primary`

**`Badge.tsx`**
- Props: `type: 'new'|'auction'|'price_reduced'|'under_offer'|'sold'|'rent'`
- Pill shape, colours from design system

**`Spinner.tsx`**
- SVG animate-spin, sizes: sm/md/lg, inherits text colour

**`Skeleton.tsx`**
- Props: `width?: string`, `height: string`, `className?: string`
- Uses `.animate-shimmer` from globals.css

**`RangeSlider.tsx`**
- Props: `min, max, value: [number, number], onChange: (val: [number,number]) => void, step?, formatLabel?: (n: number) => string`
- Dual-handle, brand-primary fill track

**`Tabs.tsx`**
- Props: `tabs: {label, value}[]`, `value, onChange`
- Style: pill switcher (listing type tab design from `.claude/design.md`)

**`Dropdown.tsx`**
- Props: `options: {label, value}[]`, `value, onChange, placeholder?`
- Native `<select>` with custom chevron overlay

**`index.ts`** — re-export all

### End state check
Import any primitive in isolation — renders correctly, no TypeScript errors.

---

## Session 1-C — PropertyCard + FilterPanel

### Task
Build the two most complex search UI components.

**`apps/web/src/features/search/components/PropertyCard.tsx`**
- Props: `property: PropertySummary`, `compact?: boolean`
- Exact structure from `.claude/design.md` PropertyCard section
- Save button: heart icon, calls `useSaveProperty(id)` hook stub (returns `{ isSaved: false, toggle: () => {} }` for now — real impl in Phase 4)
- Badge: top-left, derived from `property.status` + `property.saleMethod`
- Photo count badge: bottom-right of image
- Stats row: BedDouble, Bath, Car, Maximize2 icons from lucide-react
- Price: formatted via `formatPrice()` from `@propsphere/utils`
- Wraps in `<Link to={`/${property.listingType}/${property.id}`}>` — prevent default on save button click

**`apps/web/src/features/search/components/FilterPanel.tsx`**
- Props: `onClose?: () => void` (for mobile drawer)
- Reads from Redux `selectSearchFilters`, dispatches on change
- Sections (each collapsible with ChevronDown/Up):
  1. Price Range — RangeSlider + two Input fields (min/max), labels formatted with `formatPrice`
  2. Property Type — grid of toggle buttons, each with icon + label
  3. Bedrooms — SegmentedControl: Any/1/2/3/4/5+
  4. Bathrooms — SegmentedControl: Any/1/2/3+
  5. Car Spaces — SegmentedControl: Any/1/2/3+
  6. Features — scrollable checklist (pool, gym, parking, garden, balcony, pet-friendly, furnished, lift)
- Footer: "Reset filters" ghost button + "Show results" primary button (shows `selectActiveFilterCount`)
- Desktop: always visible sidebar. Mobile: rendered inside a slide-in drawer.

**`apps/web/src/features/search/components/SortControls.tsx`**
- Left: "X properties found" (total from search result)
- Right: Dropdown with newest/price_asc/price_desc options
- Dispatches `setSortBy` on change

### End state check
PropertyCard renders with seed data. FilterPanel dispatches correctly to Redux. No TS errors.

---

## Session 1-D — SearchBar + Autocomplete

### Task
Build the SearchBar with live suburb autocomplete.

**`apps/web/src/api/suburbs.ts`**
- `useSuburbAutocomplete(query: string)` — `useQuery`, calls `GET /api/suburbs/autocomplete?q=query`, disabled when query < 2 chars, staleTime: 10s

**`apps/web/src/features/search/components/SearchBar.tsx`**
- Large search input (56px height) with MapPin icon left, Search button right
- Below input: autocomplete dropdown (absolutely positioned)
- Shows suburb name + state + postcode in each suggestion
- Keyboard nav: Arrow up/down, Enter to select, Escape to close
- On select: dispatches `setLocation` with the suburb name, sets `locationLat`/`locationLng` if available
- Listing type tabs above the input (Buy/Rent/Sold pill switcher)
- Dispatches `setListingType` on tab change
- On submit (button or Enter): navigates to `/{listingType}?query=...`

**Backend: `apps/api/src/modules/suburbs/`**
- `suburbs.module.ts`, `suburbs.controller.ts`, `suburbs.service.ts`
- `GET /suburbs/autocomplete?q=query`
- Postgres FTS: `WHERE name ILIKE '%query%' OR postcode ILIKE '%query%'` (simple ILIKE — no tsvector needed for autocomplete)
- Returns: `{ id, name, state, postcode, lat, lng }[]`, limit 8

### End state check
Type "Nav" in search → dropdown shows "Navrangpura, Gujarat 380009". Select it → URL updates.

---

## Session 1-E — Search Results Page + API

### Task
Wire everything together into a working search results page.

**`apps/web/src/api/properties.ts`**
- `usePropertySearch(filters: SearchFilters)` — `useInfiniteQuery`
  - Calls `GET /api/properties/search`
  - `queryKey: ['properties', 'search', filters]`
  - `staleTime: 30_000`
  - `getNextPageParam: (last) => last.page < last.totalPages ? last.page + 1 : undefined`

**`apps/web/src/features/search/pages/SearchResultsPage.tsx`**
- Reads filters from Redux
- Calls `usePropertySearch`
- Layout: `<FilterPanel>` sidebar (hidden on mobile) + main area
- Main area: `<SortControls>` + property grid + load-more trigger
- Load more: `<div ref={bottomRef}>` + IntersectionObserver → `fetchNextPage()`
- Skeleton: show 6 `<PropertyCard>` skeletons while loading
- Empty state: illustration + "No properties found. Try adjusting your filters." + Reset button
- Mobile: floating "Filters" button bottom-left, opens `<FilterPanel>` in a bottom sheet (fixed positioned overlay)

**Backend: `apps/api/src/modules/properties/`**
- `properties.module.ts`, `properties.controller.ts`, `properties.service.ts`
- `GET /properties/search` — full implementation:
  ```
  Base query: status='active', listing_type=dto.listingType
  FTS: .textSearch('search_vector', dto.query, { type: 'plain', config: 'english' })
       skip textSearch entirely if dto.query is empty
  Filters: priceMin/Max, bedrooms, bathrooms, propertyTypes
  Sort: published_at desc (newest) | price asc/desc
  Pagination: .range((page-1)*24, page*24-1)
  Select: id, headline, suburb, state, price, price_display, bedrooms, bathrooms,
          car_spaces, land_size_sqm, listing_type, property_type, status, sale_method,
          published_at, lat, lng
  Join images: separate query for hero image (sort_order=0, is_floor_plan=false)
  ```
- `SearchPropertiesDto` Zod schema

**`apps/web/src/router.tsx`** — update `/buy`, `/rent`, `/sold` routes to `<SearchResultsPage>`

### End state check
Navigate to `/buy` → 10 seeded properties appear. Filter by bedrooms → results update. URL has params. Infinite scroll loads more (or shows end-of-results when all 10 loaded).

---

## Phase 1 Checklist
```
[x] SearchFilters type + SearchResult<T> type
[x] searchSlice (filters, actions, selectors)
[x] URL ↔ filter sync hook
[x] UI primitives (Button, Input, Badge, Spinner, Skeleton, RangeSlider, Tabs, Dropdown)
[x] PropertyCard
[x] FilterPanel
[x] SortControls
[x] SearchBar + autocomplete
[x] useSuburbAutocomplete hook
[x] SuburbsModule: GET /suburbs/autocomplete
[x] usePropertySearch hook (useInfiniteQuery)
[x] SearchResultsPage (infinite scroll, skeleton, empty state)
[x] PropertiesModule: GET /properties/search
```
