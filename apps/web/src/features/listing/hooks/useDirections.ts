import { useQuery } from '@tanstack/react-query';
import { getDirections } from '@/api/maps';
import type { GeocodingFeature } from '@/features/search/hooks/useMapboxAutocomplete';

export function useDirections(
  originLat: number,
  originLng: number,
  dest: GeocodingFeature | null,
  profile: 'driving' | 'walking' | 'cycling',
) {
  return useQuery({
    queryKey: ['directions', originLat, originLng, dest?.id, profile],
    queryFn: () =>
      dest
        ? getDirections(originLng, originLat, dest.center[0], dest.center[1], profile)
        : null,
    enabled: !!dest,
    staleTime: 30 * 60 * 1000,
  });
}
