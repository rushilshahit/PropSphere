# Map Integration — Free Hybrid Strategy
## Vibe Coding Prompt
# Paste _shared-context.md above this, then use this section.
# Replaces phase-google-maps.md entirely.

---

## Architecture Decision: What Goes Where (All Free)

```
Feature                  Library              Free Tier / Cost
──────────────────────────────────────────────────────────────
Main search map          Mapbox GL JS         50,000 loads/month free
Listing page base map    Mapbox GL JS         same free tier
Property pins            Mapbox GL JS         included
Cluster markers          Mapbox GL JS         included
Draw search area         Mapbox GL Draw       included
Map tiles (streets)      Mapbox               included

Street View              Google Maps JS       $200/month credit
                                              ≈28,000 views free

Location autocomplete    Mapbox Geocoding     100,000 req/month free
                         (NOT Google Places)

Directions / Route       Mapbox Directions    100,000 req/month free
                         (NOT Google Directions)

Nearby places            Overpass API         Completely free
(schools,transport,cafes)(OpenStreetMap)      No key needed

Distance to place        Mapbox Directions    included in free tier

Walk score derived       Local calculation    Free — no API
```

**Google Maps is loaded ONLY on listing pages, ONLY for Street View.**
No Google Maps on any other page.

---

## Free Alternative Libraries

| What you need | Recommended free lib | Notes |
|---|---|---|
| Geocoding / autocomplete | `@mapbox/search-js-react` | Official Mapbox, 100k/month free |
| Routing / directions | Mapbox Directions API | 100k/month free, same SDK |
| Nearby POI data | Overpass API (OSM) | Completely free, no key, rich data |
| Map rendering | `react-map-gl` + Mapbox | 50k loads/month free |
| Street View | `@vis.gl/react-google-maps` | Only for Street View component |
| Commute time | Mapbox Directions API | Duration + distance in response |

**Overpass API** is the key insight here. It queries OpenStreetMap data directly —
schools, bus stops, hospitals, cafes, parks — all free, no key required, updated by
the community. Query builder: `overpass-turbo.eu` to test queries.

---

## Environment Variables (Minimal)

```
# Frontend
VITE_MAPBOX_TOKEN=pk.eyJ...         ← existing, already in Phase 3
VITE_GOOGLE_MAPS_API_KEY=           ← new, domain-restricted, Maps JS only

# Backend
GOOGLE_MAPS_SERVER_KEY=             ← new, Street View Static proxy only
                                    (no Distance Matrix, no Places needed)
```

Google Cloud APIs to enable (minimal list):
```
Maps JavaScript API     ← Street View interactive panorama
Street View Static API  ← Street View thumbnail image
```
That's it. No Places API. No Distance Matrix. No Directions API.

---

## Session GMAP-A — Base Listing Map (Mapbox, not Google)

### Vibe Coding Instructions

Start this session by saying:
> "I'm rebuilding the listing page map in React + TypeScript.
> The map uses Mapbox GL JS (already installed via react-map-gl from Phase 3).
> Build the base map component for a property listing page.
> One component at a time — start with just the map and property pin."

### What to build

**`apps/web/src/features/listing/components/ListingMap.tsx`**

Dependencies: `react-map-gl`, `mapbox-gl` — already installed in Phase 3. Nothing new.

```tsx
import Map, { Marker, NavigationControl } from 'react-map-gl';
import { MAPBOX_TOKEN } from '@/lib/mapbox';
import { REA_MAP_STYLE } from '../data/map-style';

interface ListingMapProps {
  lat: number;
  lng: number;
  address: string;
  activeLayer?: 'streets' | 'satellite';
}
```

**Map config:**
```tsx
<Map
  initialViewState={{ longitude: lng, latitude: lat, zoom: 15 }}
  style={{ width: '100%', height: '400px' }}
  mapStyle={activeLayer === 'satellite'
    ? 'mapbox://styles/mapbox/satellite-streets-v12'
    : 'mapbox://styles/mapbox/light-v11'}
  mapboxAccessToken={MAPBOX_TOKEN}
  attributionControl={false}
>
  <NavigationControl position="bottom-right" showCompass={false} />
  <PropertyHousePin lat={lat} lng={lng} />
</Map>
```

**`PropertyHousePin.tsx`** — custom SVG pin:
```tsx
// Red house shape matching REA brand
const svg = `<svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 2L1 15V42H13V28H23V42H35V15L18 2Z" fill="#E5001A" stroke="white" strokeWidth="2"/>
</svg>`;

// Use as Mapbox Marker with offset to pin bottom-centre
<Marker longitude={lng} latitude={lat} anchor="bottom">
  <div dangerouslySetInnerHTML={{ __html: svg }}
       className="animate-pin-drop cursor-pointer" />
</Marker>
```

Add `animate-pin-drop` keyframe to `globals.css`:
```css
@keyframes pin-drop {
  0%   { transform: translateY(-20px) scale(1.1); opacity: 0; }
  60%  { transform: translateY(4px) scale(0.95); opacity: 1; }
  100% { transform: translateY(0) scale(1); }
}
.animate-pin-drop { animation: pin-drop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
```

**Map/Satellite toggle button** — absolute top-right of map:
```tsx
<div className="absolute top-3 right-3 z-10 flex rounded-[4px] overflow-hidden
                border border-rea-border shadow-card bg-white">
  {(['streets','satellite'] as const).map(mode => (
    <button key={mode}
      onClick={() => setActiveLayer(mode)}
      className={activeLayer === mode
        ? 'bg-rea-red text-white text-xs px-3 py-1.5 font-medium capitalize'
        : 'bg-white text-rea-body text-xs px-3 py-1.5 font-medium capitalize hover:bg-rea-bg'}
    >{mode}</button>
  ))}
</div>
```

**Lazy init:** only initialise the map when the container enters the viewport.
```tsx
const mapRef = useRef<HTMLDivElement>(null);
const [inView, setInView] = useState(false);

useEffect(() => {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
  }, { threshold: 0.1 });
  if (mapRef.current) observer.observe(mapRef.current);
  return () => observer.disconnect();
}, []);

return (
  <div ref={mapRef} className="relative rounded-[8px] overflow-hidden">
    {inView
      ? <Map .../>
      : <div className="h-[400px] animate-shimmer rounded-[8px]" />}
  </div>
);
```

### End state check
Map loads centred on property. Red house pin animates in. Satellite toggle works.

---

## Session GMAP-B — Street View (Google Maps, minimal)

### Vibe Coding Instructions

Start this session by saying:
> "Mapbox listing map is working. Now add Street View using Google Maps.
> Google Maps is ONLY loaded for Street View — nothing else.
> Build a thumbnail that opens an interactive Street View panorama.
> Keep the Google SDK loaded lazily so it doesn't slow down the listing page."

### Install

```bash
pnpm add @vis.gl/react-google-maps
```

Show this command first before writing any code.

### What to build

**`apps/web/src/lib/google-maps.ts`**
```typescript
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
// Only Maps JS API — no places library loaded
```

**`apps/web/src/features/listing/components/StreetView.tsx`**

```tsx
import { APIProvider, Map, StreetViewPanorama } from '@vis.gl/react-google-maps';
import { GOOGLE_MAPS_API_KEY } from '@/lib/google-maps';
```

**Layout — tab switcher above the Mapbox map:**
```
[🗺 Map]  [📷 Street View]
```
Use existing `<Tabs>` component. `activeTab: 'map' | 'street-view'`.

When `activeTab === 'map'`: render `<ListingMap>` (Mapbox, from GMAP-A)
When `activeTab === 'street-view'`: lazy-load Google SDK + render Street View

**Lazy load Google SDK** — only when Street View tab is clicked:
```tsx
const [showStreetView, setShowStreetView] = useState(false);

function handleTabChange(tab: string) {
  if (tab === 'street-view') setShowStreetView(true);
  setActiveTab(tab as typeof activeTab);
}

// Only render APIProvider when Street View is actually needed
{showStreetView && (
  <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
    <StreetViewPanel lat={lat} lng={lng} />
  </APIProvider>
)}
```

**`StreetViewPanel.tsx`**
```tsx
function StreetViewPanel({ lat, lng }: { lat: number; lng: number }) {
  return (
    <div className="relative h-[400px] rounded-[8px] overflow-hidden">
      <Map
        style={{ width: '100%', height: '100%' }}
        defaultCenter={{ lat, lng }}
        defaultZoom={14}
        streetViewControl={false}
        mapTypeControl={false}
        zoomControl={false}
      >
        <StreetViewPanorama
          position={{ lat, lng }}
          visible={true}
          options={{
            addressControl: false,
            showRoadLabels: false,
            zoomControl: true,
            fullscreenControl: true,
            motionTracking: false,
            motionTrackingControl: false,
          }}
        />
      </Map>
    </div>
  );
}
```

**No Street View available state:**
- Use Google Street View Static API to probe if street view exists
- Backend proxy: `GET /api/maps/street-view-check?lat=&lng=`
- Returns `{ available: boolean }`
- If `available === false`: hide the "Street View" tab entirely

**Backend proxy** (`apps/api/src/modules/maps/`):
```typescript
// GET /maps/street-view-check?lat=&lng=
async checkStreetView(lat: number, lng: number): Promise<{ available: boolean }> {
  const url = `https://maps.googleapis.com/maps/api/streetview/metadata`
    + `?location=${lat},${lng}`
    + `&key=${this.config.get('GOOGLE_MAPS_SERVER_KEY')}`;
  const res = await fetch(url);
  const data = await res.json();
  return { available: data.status === 'OK' };
}
```

Street View Static metadata endpoint is **free** (zero cost).

### End state check
"Map" tab shows Mapbox. "Street View" tab lazy-loads Google SDK and shows panorama.
Tab is hidden if no street view coverage exists for the address.

---

## Session GMAP-C — Location Autocomplete (Mapbox Geocoding, free)

### Vibe Coding Instructions

Start this session by saying:
> "Now add location autocomplete using Mapbox Geocoding — NOT Google Places.
> Mapbox Geocoding is free up to 100,000 requests per month and already installed.
> Build: 1) Autocomplete for the search bar (Phase 1 SearchBar), 
>         2) Autocomplete for the commute calculator destination input.
> One hook, two usages."

### What to build

**`apps/web/src/features/search/hooks/useMapboxAutocomplete.ts`**

Uses the Mapbox Geocoding REST API directly — no extra package needed.

```typescript
import { useQuery } from '@tanstack/react-query';
import { MAPBOX_TOKEN } from '@/lib/mapbox';

interface GeocodingFeature {
  id: string;
  place_name: string;
  center: [number, number];   // [lng, lat]
  place_type: string[];
}

export function useMapboxAutocomplete(query: string, enabled = true) {
  return useQuery({
    queryKey: ['geocode', 'autocomplete', query],
    queryFn: async (): Promise<GeocodingFeature[]> => {
      if (!query || query.length < 2) return [];
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/`
        + `${encodeURIComponent(query)}.json`
        + `?access_token=${MAPBOX_TOKEN}`
        + `&autocomplete=true`
        + `&types=place,locality,neighborhood,address`
        + `&country=in`         // restrict to India (change to 'au' for Australia)
        + `&limit=6`;
      const res = await fetch(url);
      const data = await res.json();
      return data.features ?? [];
    },
    enabled: enabled && query.length >= 2,
    staleTime: 10_000,
  });
}
```

**Update `SearchBar.tsx`** — replace the existing `useSuburbAutocomplete` call:
```tsx
// Before (Phase 1-D — Postgres FTS):
const { data: suggestions } = useSuburbAutocomplete(debouncedQuery);

// After (Mapbox Geocoding):
const { data: suggestions } = useMapboxAutocomplete(debouncedQuery);
```

Map suggestion → display:
```tsx
// Each suggestion in the dropdown:
<li key={s.id} onClick={() => handleSelect(s)}>
  <MapPin className="w-4 h-4 text-rea-secondary shrink-0" />
  <div>
    <span className="text-sm font-medium text-rea-charcoal">
      {s.place_name.split(',')[0]}          {/* e.g. "Navrangpura" */}
    </span>
    <span className="text-xs text-rea-secondary ml-1">
      {s.place_name.split(',').slice(1).join(',')}  {/* state, country */}
    </span>
  </div>
</li>
```

On select:
```tsx
function handleSelect(feature: GeocodingFeature) {
  dispatch(setLocation(feature.place_name.split(',')[0]));
  dispatch(setLocationCoords({
    lat: feature.center[1],
    lng: feature.center[0],
  }));
  setQuery(feature.place_name.split(',')[0]);
  setOpen(false);
}
```

### Also update: Commute Calculator destination input

The `CommuteCalculator` (built in GMAP-D) uses the same `useMapboxAutocomplete` hook.
No Google Places Autocomplete needed anywhere.

### End state check
Type "Navrang" → Mapbox returns "Navrangpura, Gujarat, India" suggestions.
Selecting it sets lat/lng in Redux. URL updates.

---

## Session GMAP-D — Directions + Commute Time (Mapbox, free)

### Vibe Coding Instructions

Start this session by saying:
> "Now add a commute time calculator to the listing page.
> Use the Mapbox Directions API — it's free up to 100,000 requests/month.
> The user types a destination using the Mapbox autocomplete (from GMAP-C),
> picks a travel mode, and sees estimated travel time + a route drawn on the map."

### What to build

**`apps/web/src/api/maps.ts`** — new file:

```typescript
import { MAPBOX_TOKEN } from '@/lib/mapbox';

interface MapboxDirectionsResponse {
  routes: Array<{
    duration: number;       // seconds
    distance: number;       // metres
    geometry: {
      coordinates: [number, number][];
    };
  }>;
}

export async function getDirections(
  originLng: number,
  originLat: number,
  destLng: number,
  destLat: number,
  profile: 'driving' | 'walking' | 'cycling',
): Promise<{ duration: string; distance: string; geometry: [number,number][] }> {

  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/`
    + `${originLng},${originLat};${destLng},${destLat}`
    + `?access_token=${MAPBOX_TOKEN}`
    + `&geometries=geojson`
    + `&overview=full`;

  const res = await fetch(url);
  const data: MapboxDirectionsResponse = await res.json();
  const route = data.routes[0];

  if (!route) throw new Error('No route found');

  return {
    duration: formatDuration(route.duration),       // "23 min"
    distance: formatDistance(route.distance),       // "18.4 km"
    geometry: route.geometry.coordinates,
  };
}

function formatDuration(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  return `${Math.floor(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
}

function formatDistance(metres: number): string {
  return metres >= 1000
    ? `${(metres / 1000).toFixed(1)} km`
    : `${metres} m`;
}
```

Note: Mapbox Directions API is called **directly from the frontend** — the access token
is public and domain-restricted in the Mapbox dashboard. No backend proxy needed.

**`apps/web/src/features/listing/hooks/useDirections.ts`**
```typescript
export function useDirections(
  originLat: number, originLng: number,
  dest: GeocodingFeature | null,
  profile: 'driving' | 'walking' | 'cycling',
) {
  return useQuery({
    queryKey: ['directions', originLat, originLng, dest?.id, profile],
    queryFn: () => dest
      ? getDirections(originLng, originLat, dest.center[0], dest.center[1], profile)
      : null,
    enabled: !!dest,
    staleTime: 30 * 60 * 1000,  // 30 min
  });
}
```

**`apps/web/src/features/listing/components/CommuteCalculator.tsx`**

```
┌──────────────────────────────────────────────────────┐
│  🗺 How long to get there?                            │
│                                                      │
│  [📍 Enter destination...              ]             │
│     (Mapbox autocomplete dropdown)                   │
│                                                      │
│  [🚗 Drive]  [🚶 Walk]  [🚴 Cycle]                  │
│                                                      │
│  ──── Result ────                                    │
│  🚗  23 min  ·  18.4 km                              │
└──────────────────────────────────────────────────────┘
```

Props: `originLat: number`, `originLng: number`, `mapRef: RefObject<MapRef>`

Travel modes:
```typescript
const MODES = [
  { key: 'driving', icon: Car,     label: 'Drive'  },
  { key: 'walking', icon: Footprint, label: 'Walk'  },
  { key: 'cycling', icon: Bike,    label: 'Cycle'  },
] as const;
```

On result received — draw route on the Mapbox listing map:
```tsx
useEffect(() => {
  if (!directions?.geometry || !mapRef.current) return;

  const map = mapRef.current.getMap();

  // Remove previous route layer if exists
  if (map.getLayer('route')) map.removeLayer('route');
  if (map.getSource('route')) map.removeSource('route');

  map.addSource('route', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: directions.geometry },
      properties: {},
    },
  });

  map.addLayer({
    id: 'route',
    type: 'line',
    source: 'route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': activeMode === 'driving' ? '#E5001A' : '#007A78',
      'line-width': 4,
      'line-opacity': 0.85,
    },
  });

  // Fit map to show full route
  const coords = directions.geometry;
  const bounds = coords.reduce(
    (b, c) => b.extend(c as [number,number]),
    new mapboxgl.LngLatBounds(coords[0], coords[0]),
  );
  map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
}, [directions, activeMode]);
```

Pass `mapRef` from `ListingMap` up to the page via `forwardRef`, then down to `CommuteCalculator`.

### End state check
Type "SG Highway" → Mapbox autocomplete suggests it → select → red route draws on map.
"23 min · 18.4 km" displays. Switch to Walk → teal route redraws.

---

## Session GMAP-E — Nearby Places (Overpass API, completely free)

### Vibe Coding Instructions

Start this session by saying:
> "Final map feature: a 'What's nearby' section below the listing map.
> Use the Overpass API which queries OpenStreetMap data — completely free, no API key.
> Build 4 tabs: Schools, Transport, Cafes & Shops, Health.
> Show up to 5 nearest results per tab with distance and a pin on the map."

### What to build

**`apps/web/src/api/overpass.ts`** — Overpass API client:

```typescript
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

interface OverpassElement {
  id: number;
  type: 'node' | 'way' | 'relation';
  lat?: number;   // present on nodes
  lon?: number;
  tags: Record<string, string>;
  center?: { lat: number; lon: number };  // present on ways/relations
}

export interface NearbyPlace {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  distanceM: number;
  distanceLabel: string;
}

// Build Overpass QL query for a given type
function buildQuery(lat: number, lng: number, type: NearbyType, radius = 1500): string {
  const filters: Record<NearbyType, string> = {
    schools:   '[amenity~"school|kindergarten|university|college"]',
    transport: '[public_transport~"stop_position|platform"][~"bus|train|subway|tram"~"yes"]',
    cafes:     '[amenity~"cafe|restaurant|supermarket|convenience|bakery"]',
    health:    '[amenity~"hospital|clinic|pharmacy|doctors|dentist"]',
  };
  return `[out:json][timeout:10];
(
  node${filters[type]}(around:${radius},${lat},${lng});
  way${filters[type]}(around:${radius},${lat},${lng});
)->.all;
.all out center tags 10;`;
}

export async function fetchNearby(
  lat: number,
  lng: number,
  type: NearbyType,
): Promise<NearbyPlace[]> {
  const query = buildQuery(lat, lng, type);
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  const data = await res.json();

  return (data.elements as OverpassElement[])
    .map(el => {
      const elLat = el.lat ?? el.center?.lat ?? 0;
      const elLng = el.lon ?? el.center?.lon ?? 0;
      const distM = haversineDistanceM(lat, lng, elLat, elLng);
      return {
        id:            String(el.id),
        name:          el.tags.name ?? el.tags.operator ?? 'Unnamed',
        category:      el.tags.amenity ?? el.tags.public_transport ?? type,
        lat:           elLat,
        lng:           elLng,
        distanceM:     distM,
        distanceLabel: distM < 1000 ? `${distM}m` : `${(distM/1000).toFixed(1)} km`,
      };
    })
    .filter(p => p.name !== 'Unnamed' && p.distanceM <= 1500)
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, 5);
}

// Haversine formula — pure JS, no library needed
function haversineDistanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}
```

**TanStack Query hook** (`apps/web/src/api/overpass.ts`):
```typescript
export type NearbyType = 'schools' | 'transport' | 'cafes' | 'health';

export function useNearbyPlaces(lat: number, lng: number, type: NearbyType) {
  return useQuery({
    queryKey: ['nearby', lat, lng, type],
    queryFn: () => fetchNearby(lat, lng, type),
    staleTime: 24 * 60 * 60 * 1000,   // 24h — OSM data doesn't change hourly
    enabled: !!lat && !!lng,
  });
}
```

**`apps/web/src/features/listing/components/NearbyPlaces.tsx`**

```tsx
const TABS: { key: NearbyType; icon: LucideIcon; label: string }[] = [
  { key: 'schools',   icon: GraduationCap, label: 'Schools'   },
  { key: 'transport', icon: Bus,           label: 'Transport'  },
  { key: 'cafes',     icon: Coffee,        label: 'Shops'      },
  { key: 'health',    icon: HeartPulse,    label: 'Health'     },
];
```

Each place row:
```tsx
<li key={place.id}
    className="flex items-center gap-3 py-2.5 border-b border-rea-border-light
               last:border-0 cursor-pointer hover:bg-rea-bg rounded px-2"
    onClick={() => onPlaceSelect(place)}>
  <div className="w-8 h-8 rounded-full bg-rea-red-tint flex items-center justify-center shrink-0">
    <TabIcon className="w-4 h-4 text-rea-red" />
  </div>
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium text-rea-charcoal truncate">{place.name}</p>
    <p className="text-xs text-rea-secondary capitalize">{place.category}</p>
  </div>
  <span className="text-xs font-medium text-rea-secondary shrink-0">
    {place.distanceLabel}
  </span>
</li>
```

On place select — add secondary marker to Mapbox listing map:
```tsx
// Pass selectedPlace up to ListingMap via prop
// ListingMap adds a teal marker at selectedPlace.lat/lng
<Marker longitude={selectedPlace.lng} latitude={selectedPlace.lat} anchor="bottom">
  <div className="w-3 h-3 rounded-full bg-rea-teal border-2 border-white shadow" />
</Marker>
```

**Overpass rate limiting note:**
Overpass API has a fair-use policy. These query sizes (radius 1500m, limit 10 results)
are tiny. For production, add a request cache in the browser (TanStack Query staleTime 24h
means each lat/lng/type combination is only queried once per day per user).
Optionally: run your own Overpass instance on a VPS for zero rate limit concerns.

### End state check
"Schools" tab shows 5 nearest schools with distances. Click a school → teal pin appears
on the Mapbox map at the school's location.

---

## Full Listing Page Map Section — Final Assembly

```tsx
// In ListingPage.tsx — map section
<section className="mt-8">
  <h2 className="text-xl font-bold text-rea-charcoal mb-4">Location</h2>

  {/* Map + Street View tabs — StreetView wraps ListingMap */}
  <StreetView
    lat={property.lat}
    lng={property.lng}
    address={property.fullAddress}
    mapRef={mapRef}                  {/* forwarded from ListingMap */}
  />

  {/* Nearby places */}
  <NearbyPlaces
    lat={property.lat}
    lng={property.lng}
    onPlaceSelect={setSelectedPlace}
    className="mt-4"
  />

  {/* Commute calculator */}
  <CommuteCalculator
    originLat={property.lat}
    originLng={property.lng}
    mapRef={mapRef}
    className="mt-4"
  />
</section>
```

---

## Cost Summary (Monthly, at Medium Scale)

```
Library          Free Tier          Approximate usage
─────────────────────────────────────────────────────
Mapbox Maps      50,000 loads/mo    Map renders (listing + search pages)
Mapbox Geocoding 100,000 req/mo     Autocomplete keystrokes (debounced)
Mapbox Directions 100,000 req/mo   Commute calculations
Overpass API     Unlimited (fair use) Nearby places queries
Google Maps JS   $200/mo credit     Street View loads only
  (~28,000 SV    at $0.007 each)    Only loaded when user clicks tab

At 1,000 DAU with 5 listing views each:
  → ~150,000 map loads/month        → Paid Mapbox (~$50–100/mo)
  → ~5,000 Street View loads/mo     → Free (within $200 credit)
  → ~50,000 direction queries/mo    → Free Mapbox
  → ~30,000 nearby queries/mo       → Free (Overpass)

Total estimated cost: $0–$100/month for first 6 months at this scale.
```

---

## File Summary

### New files
```
apps/web/src/lib/google-maps.ts
apps/web/src/features/listing/components/ListingMap.tsx       (rebuilt)
apps/web/src/features/listing/components/StreetView.tsx       (new)
apps/web/src/features/listing/components/PropertyHousePin.tsx (new)
apps/web/src/features/listing/components/NearbyPlaces.tsx     (new)
apps/web/src/features/listing/components/CommuteCalculator.tsx (new)
apps/web/src/features/listing/data/map-style.ts               (new)
apps/web/src/features/listing/hooks/useDirections.ts          (new)
apps/web/src/api/maps.ts                                      (new)
apps/web/src/api/overpass.ts                                  (new)
apps/web/src/features/search/hooks/useMapboxAutocomplete.ts   (new)
apps/api/src/modules/maps/maps.module.ts                      (new)
apps/api/src/modules/maps/maps.controller.ts                  (new)
apps/api/src/modules/maps/maps.service.ts                     (new)
```

### Modified files
```
apps/web/src/features/listing/pages/ListingPage.tsx    (add map section)
apps/web/src/features/search/components/SearchBar.tsx  (swap autocomplete hook)
apps/web/src/styles/globals.css                        (add pin-drop keyframe)
packages/types/src/index.ts                            (export NearbyPlace, etc.)
```

---

## Session Checklist
```
[ ] pnpm add @vis.gl/react-google-maps
[ ] VITE_GOOGLE_MAPS_API_KEY in .env (domain-restricted, Maps JS only)
[ ] GOOGLE_MAPS_SERVER_KEY in .env backend (Street View metadata only)
[ ] Google Cloud: enable Maps JS API + Street View Static API only

[ ] GMAP-A: ListingMap (Mapbox, house pin, satellite toggle, lazy init)
[ ] GMAP-B: StreetView (tabs, lazy Google SDK load, no-coverage hiding)
[ ]         Backend: GET /maps/street-view-check proxy
[ ] GMAP-C: useMapboxAutocomplete hook (Mapbox Geocoding)
[ ]         SearchBar updated to use Mapbox autocomplete
[ ] GMAP-D: getDirections (Mapbox Directions API, frontend call)
[ ]         CommuteCalculator (3 modes, route drawn on Mapbox map)
[ ] GMAP-E: fetchNearby (Overpass API, haversine distance)
[ ]         NearbyPlaces (4 tabs, secondary pins on map)
[ ]         ListingPage final assembly
```
