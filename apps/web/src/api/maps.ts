// Routing via OSRM public API (free, no key required)
// Profile names: driving → car, walking → foot, cycling → bike

const OSRM_PROFILE_MAP: Record<'driving' | 'walking' | 'cycling', string> = {
  driving: 'car',
  walking: 'foot',
  cycling: 'bike',
};

interface OsrmRoute {
  duration: number;
  distance: number;
  geometry: {
    coordinates: [number, number][];
  };
}

interface OsrmResponse {
  routes: OsrmRoute[];
}

function formatDuration(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  return `${Math.floor(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
}

function formatDistance(metres: number): string {
  return metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${metres} m`;
}

export async function getDirections(
  originLng: number,
  originLat: number,
  destLng: number,
  destLat: number,
  profile: 'driving' | 'walking' | 'cycling',
): Promise<{ duration: string; distance: string; geometry: [number, number][] }> {
  const osrmProfile = OSRM_PROFILE_MAP[profile];
  const url =
    `https://router.project-osrm.org/route/v1/${osrmProfile}/` +
    `${originLng},${originLat};${destLng},${destLat}` +
    `?overview=full&geometries=geojson`;

  const res = await fetch(url);
  const data = (await res.json()) as OsrmResponse;
  const route = data.routes[0];

  if (!route) throw new Error('No route found');

  return {
    duration: formatDuration(route.duration),
    distance: formatDistance(route.distance),
    geometry: route.geometry.coordinates,
  };
}
