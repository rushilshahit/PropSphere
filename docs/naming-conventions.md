# Naming Conventions
## PropSphere

---

## Files and Directories

| Type | Convention | Example |
|---|---|---|
| React component | PascalCase | `PropertyCard.tsx` |
| React hook | camelCase, `use` prefix | `usePropertySearch.ts` |
| Redux slice | camelCase, `Slice` suffix | `searchSlice.ts` |
| Page component | PascalCase, `Page` suffix | `SearchResultsPage.tsx` |
| NestJS module | camelCase, `module` suffix | `properties.module.ts` |
| NestJS controller | camelCase, `controller` suffix | `properties.controller.ts` |
| NestJS service | camelCase, `service` suffix | `properties.service.ts` |
| DTO file | camelCase, descriptive | `create-property.dto.ts` |
| Utility function | camelCase | `format-price.ts` |
| Type/interface file | camelCase | `property.ts` |
| Test file | mirrors source + `.spec.ts` | `properties.service.spec.ts` |
| Constants file | camelCase | `constants.ts` |
| Migration file | timestamp + description | `20240115_143022_add_virtual_tour.sql` |

---

## TypeScript

| Construct | Convention | Example |
|---|---|---|
| Interface | PascalCase | `PropertySummary` |
| Type alias | PascalCase | `ListingType` |
| Enum-style const object | PascalCase (object) + type | `const ListingType = {...}` |
| React component | PascalCase | `PropertyCard` |
| React hook | camelCase, `use` prefix | `usePropertySearch` |
| Function | camelCase | `formatPrice` |
| Variable | camelCase | `filteredProperties` |
| Constant | SCREAMING_SNAKE_CASE | `MAX_NOTES_LENGTH` |
| Generic type param | Single uppercase letter or PascalCase | `T`, `TData`, `TFilters` |

---

## React Components

```typescript
// Component name matches file name
// File: PropertyCard.tsx
export function PropertyCard(...) {}   // ✓ Named export
export default PropertyCard;           // ✗ Avoid default exports

// Props interface: ComponentNameProps
interface PropertyCardProps {
  property: PropertySummary;
  compact?: boolean;
}

// Event handlers: handleX (not onX — that's for props)
function handleSaveClick() {}  // ✓
function onSaveClick() {}      // ✗ (reserve 'on' prefix for prop names)
```

---

## API Layer (Frontend)

```typescript
// Query hooks: useEntityAction or useEntities
export function usePropertySearch(filters: SearchFilters) {}   // ✓
export function useProperty(id: string) {}                     // ✓
export function useCreateEnquiry() {}                          // ✓ mutation

// Query keys: [entity, action?, params?]
queryKey: ['properties', 'search', filters]
queryKey: ['properties', id]
queryKey: ['collections', userId]
```

---

## Redux

```typescript
// Slice name: matches feature folder name
// File: searchSlice.ts
const searchSlice = createSlice({ name: 'search', ... });

// Action creators: verb + noun camelCase
export const { setFilters, resetFilters, setLocation } = searchSlice.actions;

// Selector naming: selectX
export const selectSearchFilters = (state: RootState) => state.search.filters;
export const selectMapViewport = (state: RootState) => state.map.viewport;
```

---

## Database (PostgreSQL)

| Object | Convention | Example |
|---|---|---|
| Table | snake_case, plural | `properties`, `property_images` |
| Column | snake_case | `full_address`, `created_at` |
| Index | `idx_table_column(s)` | `idx_properties_location` |
| Foreign key | `table_id` suffix | `property_id`, `agent_id` |
| Enum type | snake_case | `listing_type`, `sale_method` |
| Function | snake_case verb | `update_agent_rating` |
| Trigger | `trg_table_event` | `trg_properties_updated_at` |
| View | snake_case, `v_` prefix | `v_active_properties` |
| Migration | `YYYYMMDD_HHMMSS_description` | `20240115_143022_add_virtual_tour.sql` |

---

## NestJS / Backend

```typescript
// DTOs: verb + noun + Dto
class CreatePropertyDto {}
class UpdatePropertyDto {}
class SearchPropertiesDto {}

// Services: inject with private readonly
constructor(
  private readonly propertiesService: PropertiesService,
  private readonly supabase: SupabaseService,
) {}

// Route paths: kebab-case, plural nouns
// GET /properties
// GET /properties/:id
// POST /properties
// PATCH /properties/:id
// DELETE /properties/:id
// GET /saved-searches
// POST /saved-searches/:id/alerts

// Module names in @Module decorator: match file name
@Module({ ... })
export class PropertiesModule {}
```

---

## CSS / Tailwind

- No custom class names — use Tailwind utilities only
- If a combination is repeated 3+ times, extract to a component, not a CSS class
- Tailwind config extensions use camelCase keys that match the design tokens: `brand.primary`, `shadow.card`

---

## Environment Variables

```
# Backend (no prefix)
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
TYPESENSE_HOST=
REDIS_URL=
RESEND_API_KEY=

# Frontend (VITE_ prefix)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_MAPBOX_TOKEN=
VITE_API_BASE_URL=
```

---

## Supabase Storage Buckets

```
property-media/          — property photos, floor plans, videos
agent-avatars/           — agent headshot uploads
agency-logos/            — agency brand assets
```

Path within bucket:
```
property-media/{userId}/{propertyId}/{timestamp}-{uuid}.{ext}
```
