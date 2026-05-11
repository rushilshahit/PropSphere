import { useQuery } from '@tanstack/react-query';
import type { PropertySummary } from '@propsphere/types';

export interface HomeStats {
  forSaleCount: number;
  forRentCount: number;
  soldLast30: number;
}

export interface SuburbCardData {
  id: string;
  name: string;
  state: string;
  slug: string;
  lat: number;
  lng: number;
  medianSalePrice?: number;
  activeListingCount: number;
  heroImageUrl: string;
}

async function fetchHomeStats(): Promise<HomeStats> {
  const res = await fetch('/api/home/stats');
  if (!res.ok) throw new Error('Failed to fetch home stats');
  return res.json() as Promise<HomeStats>;
}

async function fetchRecentListings(): Promise<PropertySummary[]> {
  const res = await fetch('/api/home/recent');
  if (!res.ok) throw new Error('Failed to fetch recent listings');
  const json = await res.json() as { data: PropertySummary[] };
  return json.data;
}

async function fetchFeaturedListings(): Promise<PropertySummary[]> {
  const res = await fetch('/api/home/featured');
  if (!res.ok) throw new Error('Failed to fetch featured listings');
  const json = await res.json() as { data: PropertySummary[] };
  return json.data;
}

async function fetchHomeSuburbs(): Promise<SuburbCardData[]> {
  const res = await fetch('/api/home/suburbs');
  if (!res.ok) throw new Error('Failed to fetch suburbs');
  const json = await res.json() as { data: SuburbCardData[] };
  return json.data;
}

export function useHomeStats() {
  return useQuery({
    queryKey: ['home', 'stats'],
    queryFn: fetchHomeStats,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecentListings() {
  return useQuery({
    queryKey: ['home', 'recent'],
    queryFn: fetchRecentListings,
    staleTime: 60_000,
  });
}

export function useFeaturedListings() {
  return useQuery({
    queryKey: ['home', 'featured'],
    queryFn: fetchFeaturedListings,
    staleTime: 60_000,
  });
}

export function useHomeSuburbs() {
  return useQuery({
    queryKey: ['home', 'suburbs'],
    queryFn: fetchHomeSuburbs,
    staleTime: 5 * 60 * 1000,
  });
}
