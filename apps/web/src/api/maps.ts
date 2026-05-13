import { MAPBOX_TOKEN } from '@/lib/mapbox';

interface MapboxRoute {
  duration: number;
  distance: number;
  geometry: {
    coordinates: [number, number][];
  };
}

interface MapboxDirectionsResponse {
  routes: MapboxRoute[];
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
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/${profile}/` +
    `${originLng},${originLat};${destLng},${destLat}` +
    `?access_token=${MAPBOX_TOKEN}` +
    `&geometries=geojson` +
    `&overview=full`;

  const res = await fetch(url);
  const data = (await res.json()) as MapboxDirectionsResponse;
  const route = data.routes[0];

  if (!route) throw new Error('No route found');

  return {
    duration: formatDuration(route.duration),
    distance: formatDistance(route.distance),
    geometry: route.geometry.coordinates,
  };
}
