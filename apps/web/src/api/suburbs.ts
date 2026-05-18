import { useQuery } from '@tanstack/react-query';
import type { Suburb } from '@propsphere/types';

export interface SuburbSuggestion {
  id: string;
  name: string;
  state: string;
  postcode: string;
  lat: number | null;
  lng: number | null;
}

export interface PricePoint {
  period: string;
  medianPrice: number;
  saleCount: number;
}

export interface SoldStats {
  totalSales: number;
  medianSoldPrice: number | null;
  clearanceRate: number | null;
  avgDaysOnMarket: number | null;
}

async function fetchSuburbSuggestions(query: string): Promise<SuburbSuggestion[]> {
  const res = await fetch(`/api/suburbs/autocomplete?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to fetch suburbs');
  const json = await res.json() as { data: SuburbSuggestion[] };
  return json.data;
}

async function fetchSuburb(state: string, slug: string): Promise<Suburb> {
  const res = await fetch(`/api/suburbs/${state}/${slug}`);
  if (!res.ok) throw new Error('Suburb not found');
  const json = await res.json() as { data: Suburb };
  return json.data;
}

async function fetchSuburbPriceHistory(suburbId: string): Promise<PricePoint[]> {
  const res = await fetch(`/api/suburbs/${suburbId}/price-history`);
  if (!res.ok) throw new Error('Failed to fetch price history');
  const json = await res.json() as { data: PricePoint[] };
  return json.data;
}

async function fetchSuburbSoldStats(suburbId: string): Promise<SoldStats> {
  const res = await fetch(`/api/suburbs/${suburbId}/sold-stats`);
  if (!res.ok) throw new Error('Failed to fetch sold stats');
  const json = await res.json() as { data: SoldStats };
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

export function useSuburb(state: string, slug: string) {
  return useQuery({
    queryKey: ['suburb', state, slug],
    queryFn: () => fetchSuburb(state, slug),
    staleTime: 5 * 60_000,
    enabled: !!state && !!slug,
  });
}

export function useSuburbPriceHistory(suburbId: string) {
  return useQuery({
    queryKey: ['suburb', suburbId, 'price-history'],
    queryFn: () => fetchSuburbPriceHistory(suburbId),
    staleTime: 60 * 60_000,
    enabled: !!suburbId,
  });
}

export function useSuburbSoldStats(suburbId: string) {
  return useQuery({
    queryKey: ['suburb', suburbId, 'sold-stats'],
    queryFn: () => fetchSuburbSoldStats(suburbId),
    staleTime: 60 * 60_000,
    enabled: !!suburbId,
  });
}
