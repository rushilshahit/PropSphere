import { useQuery } from '@tanstack/react-query';
import { MAPBOX_TOKEN } from '@/lib/mapbox';

export interface GeocodingFeature {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  place_type: string[];
}

interface GeocodingResponse {
  features?: GeocodingFeature[];
}

export function useMapboxAutocomplete(query: string, enabled = true) {
  return useQuery({
    queryKey: ['geocode', 'autocomplete', query],
    queryFn: async (): Promise<GeocodingFeature[]> => {
      if (!query || query.length < 2) return [];
      const url =
        `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
        `${encodeURIComponent(query)}.json` +
        `?access_token=${MAPBOX_TOKEN}` +
        `&autocomplete=true` +
        `&types=place,locality,neighborhood,address` +
        `&country=in` +
        `&limit=6`;
      const res = await fetch(url);
      const data = (await res.json()) as GeocodingResponse;
      return data.features ?? [];
    },
    enabled: enabled && query.length >= 2,
    staleTime: 10_000,
  });
}
