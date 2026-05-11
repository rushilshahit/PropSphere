# Phase 3 Prompt — Map View
# Paste _shared-context.md above this, then use this section.
# Prerequisite: Phase 1 complete. PropertyCard and SearchResultsPage exist.

---

## Phase Goal
Full-screen map browsing. User sees property pins, clusters, can click pins for a mini card, draw a search area, and toggle school layer. Split view: list left, map right.

---

## Session 3-A — Map Redux Slice + Mapbox Setup

### Task
Map state management and Mapbox client setup.

**`apps/web/src/lib/mapbox.ts`**
- Export `MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN`
- Export default map style: `'mapbox://styles/mapbox/light-v11'`
- Export `DEFAULT_VIEWPORT` centred on Ahmedabad: `{ longitude: 72.5714, latitude: 23.0225, zoom: 11 }`

**`apps/web/src/features/map/store/mapSlice.ts`**
```typescript
interface MapState {
  viewport: { longitude: number; latitude: number; zoom: number }
  activePropertyId: string | null
  showSchoolsLayer: boolean
  isDrawMode: boolean
  drawnBounds: [number, number][] | null  // polygon coords from draw tool
  searchBbox: { swLat: number; swLng: number; neLat: number; neLng: number } | null
}
```
- Actions: `setViewport`, `setActiveProperty`, `clearActiveProperty`, `toggleSchoolsLayer`, `setDrawMode`, `setDrawnBounds`, `setSearchBbox`
- Selectors: `selectViewport`, `selectActivePropertyId`, `selectShowSchoolsLayer`
- Register in rootReducer

**`apps/web/src/api/properties.ts`** — add:
- `useMapProperties(bbox: BoundingBoxQuery | null)` — `useQuery`, calls `GET /api/properties/map`, enabled when bbox is not null, staleTime: 20s

### End state check
mapSlice in Redux devtools. DEFAULT_VIEWPORT renders Ahmedabad.

---

## Session 3-B — Map Components

### Task
Build all map-specific components.

**`apps/web/src/features/map/components/PropertyMarker.tsx`**
- Props: `property: PropertyMapPin`, `isActive: boolean`, `onClick: () => void`
- `PropertyMapPin: { id, lat, lng, price, price_display, property_type }`
- Normal pin: white bg, `border-2 border-brand-primary`, rounded-full, `text-xs font-bold text-brand-primary`, shows `price_display`
- Active pin: `bg-brand-primary text-white`, scale-110
- Transition: `transition-all duration-150`
- Uses `<Marker>` from react-map-gl

**`apps/web/src/features/map/components/PropertyPopup.tsx`**
- Props: `property: PropertySummary`, `onClose: () => void`
- Compact property card in a popup: image (aspect-[4/3] max-w-[240px]), price, address, beds/baths icons
- "View listing" link button
- Uses `<Popup>` from react-map-gl, offset 20px above pin
- Close on X button click or clicking elsewhere on map

**`apps/web/src/features/map/components/ClusterMarker.tsx`**
- Props: `count: number`, `lat: number`, `lng: number`, `onClick: () => void`
- Circle: `bg-neutral-700 text-white border-2 border-white shadow-md`
- Size scales: count<10→w-8 h-8, count<50→w-10 h-10, count≥50→w-12 h-12
- Shows count number
- Note: real clustering needs supercluster. For now: show individual pins, limit to 50 per bbox.
  Comment: `// TODO Phase 9: add supercluster for true clustering`

**`apps/web/src/features/map/components/LayerToggles.tsx`**
- Props: none (reads from Redux)
- Positioned: `absolute bottom-8 left-4 z-10`
- Toggle button: "Schools" with School icon
- Active: `bg-brand-primary text-white`, inactive: `bg-white text-neutral-700 border`
- Dispatches `toggleSchoolsLayer`

**`apps/web/src/features/map/components/SchoolsLayer.tsx`**
- Only renders when `selectShowSchoolsLayer` is true
- Calls `GET /api/schools/nearby?lat=&lng=&radius=5` (returns schools in view)
- Renders each school as a small `<Marker>`: green dot + school name tooltip on hover

### End state check
PropertyMarker renders at correct coordinates. Active state works. Popup closes cleanly.

---

## Session 3-C — MapView Page + Split Layout

### Task
Full map page with split view and draw area.

**`apps/web/src/features/map/components/MapView.tsx`**
- Full implementation using `<Map>` from react-map-gl
- Props: none (reads from Redux + TanStack Query)
- On map move: dispatch `setViewport` + `setSearchBbox` with new bounds
- On move end: trigger `useMapProperties` refetch
- Renders: PropertyMarker for each property, SchoolsLayer when toggled, draw controls
- Click on map (not on pin): dispatch `clearActiveProperty`

**`apps/web/src/features/map/pages/MapPage.tsx`**
- Route: `/map`
- Layout: `flex h-[calc(100vh-64px)]` (full height minus header)
- Left panel (w-80 shrink-0 overflow-y-auto): search result cards in compact mode
  - Reuse `usePropertySearch` with current filters from Redux
  - CompactPropertyCard list (no grid, vertical stack)
  - Hover on card → dispatch `setActiveProperty` (highlights pin on map)
- Right panel (flex-1): `<MapView />`
- Top-right of map: "Draw area" button → dispatches `setDrawMode(true)`
- When draw mode: show `@mapbox/mapbox-gl-draw` polygon tool
  - On draw complete: dispatch `setDrawnBounds`, dispatch `setDrawMode(false)`
  - Show "Search this area" banner: `fixed bottom-4 left-1/2 -translate-x-1/2`
  - Clicking "Search this area": navigate to `/buy` with drawn polygon as filter
- Current location button: `absolute bottom-8 right-4`, calls `navigator.geolocation.getCurrentPosition`, flies map to location
- `LayerToggles` bottom-left of map

**Mobile `/map` fallback:**
- Below `md:` breakpoint: show only the map full-screen (no list panel)
- Floating button top-left: "List" → navigates back to `/buy`

### End state check
`/map` loads with Ahmedabad centred. 10 seeded pins appear. Click pin → popup shows. "Draw area" activates polygon draw.

---

## Session 3-D — Backend: Map Endpoints + Schools

### Task
Backend endpoints for map view.

**`GET /properties/map`** in PropertiesController:
- Query params: `swLat, swLng, neLat, neLng` (bounding box)
- `BoundingBoxDto` Zod: all four as `z.coerce.number()`
- Service: simple Postgres range query
  ```
  .gte('lat', dto.swLat).lte('lat', dto.neLat)
  .gte('lng', dto.swLng).lte('lng', dto.neLng)
  .eq('status', 'active')
  .select('id, lat, lng, price, price_display, property_type, listing_type')
  .limit(50)
  ```
- Returns `PropertyMapPin[]`

**`SchoolsModule`** — new module:
- `schools.module.ts`, `schools.controller.ts`, `schools.service.ts`
- `GET /schools/nearby?lat=&lng=&radius=` (radius in km, default 5)
- Service: calls PostGIS RPC `search_schools_radius(lat, lng, radius_km)`

```sql
-- Add to 008_rpc.sql
CREATE OR REPLACE FUNCTION search_schools_radius(lat float, lng float, radius_km float)
RETURNS TABLE(id UUID, name TEXT, type school_type, sector school_sector, lat NUMERIC, lng NUMERIC) AS $$
  SELECT id, name, type, sector, lat, lng
  FROM   schools
  WHERE  ST_DWithin(
           location,
           ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
           radius_km * 1000
         )
  LIMIT 20;
$$ LANGUAGE SQL STABLE;
```

### End state check
`GET /properties/map?swLat=22.9&swLng=72.4&neLat=23.1&neLng=72.7` returns pins.
`GET /schools/nearby?lat=23.02&lng=72.57&radius=3` returns seeded schools.

---

## Phase 3 Checklist
```
[x] mapSlice (viewport, activeProperty, schoolsLayer, drawMode, bbox)
[x] MAPBOX_TOKEN setup + DEFAULT_VIEWPORT (Ahmedabad)
[x] useMapProperties hook
[x] PropertyMarker (normal + active states)
[x] PropertyPopup (mini card)
[x] ClusterMarker (count circle)
[x] LayerToggles (schools toggle)
[x] SchoolsLayer (renders nearby school markers)
[x] MapView component (full map with all markers)
[x] MapPage (split view: list left, map right)
[x] Draw area (@mapbox/mapbox-gl-draw)
[x] Current location button
[x] Mobile map fallback
[x] GET /properties/map (bounding box)
[x] SchoolsModule: GET /schools/nearby (PostGIS radius)
[x] search_schools_radius RPC function
```
