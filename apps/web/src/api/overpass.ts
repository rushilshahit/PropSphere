import { useQuery } from '@tanstack/react-query';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export type NearbyType = 'schools' | 'transport' | 'cafes' | 'health';

interface OverpassElement {
  id: number;
  type: 'node' | 'way' | 'relation';
  lat?: number;
  lon?: number;
  tags: Record<string, string>;
  center?: { lat: number; lon: number };
}

interface OverpassResponse {
  elements: OverpassElement[];
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

function haversineDistanceM(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function buildQuery(lat: number, lng: number, type: NearbyType, radius = 1500): string {
  const filters: Record<NearbyType, string> = {
    schools: '[amenity~"school|kindergarten|university|college"]',
    transport:
      '[public_transport~"stop_position|platform"]',
    cafes: '[amenity~"cafe|restaurant|supermarket|convenience|bakery"]',
    health: '[amenity~"hospital|clinic|pharmacy|doctors|dentist"]',
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
  const data = (await res.json()) as OverpassResponse;

  return data.elements
    .map((el) => {
      const elLat = el.lat ?? el.center?.lat ?? 0;
      const elLng = el.lon ?? el.center?.lon ?? 0;
      const distM = haversineDistanceM(lat, lng, elLat, elLng);
      return {
        id: String(el.id),
        name: el.tags.name ?? el.tags.operator ?? 'Unnamed',
        category: el.tags.amenity ?? el.tags.public_transport ?? type,
        lat: elLat,
        lng: elLng,
        distanceM: distM,
        distanceLabel: distM < 1000 ? `${distM}m` : `${(distM / 1000).toFixed(1)} km`,
      };
    })
    .filter((p) => p.name !== 'Unnamed' && p.distanceM <= 1500)
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, 5);
}

export function useNearbyPlaces(lat: number, lng: number, type: NearbyType) {
  return useQuery({
    queryKey: ['nearby', lat, lng, type],
    queryFn: () => fetchNearby(lat, lng, type),
    staleTime: 24 * 60 * 60 * 1000,
    enabled: !!lat && !!lng,
  });
}
