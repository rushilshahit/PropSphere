import { useQuery } from '@tanstack/react-query';

export interface SuburbSuggestion {
  id: string;
  name: string;
  state: string;
  postcode: string;
  lat: number | null;
  lng: number | null;
}

async function fetchSuburbSuggestions(query: string): Promise<SuburbSuggestion[]> {
  const res = await fetch(`/api/suburbs/autocomplete?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to fetch suburbs');
  const json = await res.json() as { data: SuburbSuggestion[] };
  return json.data;
}

export function useSuburbAutocomplete(query: string) {
  return useQuery({
    queryKey: ['suburbs', 'autocomplete', query],
    queryFn: () => fetchSuburbSuggestions(query),
    enabled: query.length >= 2,
    staleTime: 10_000,
  });
}
