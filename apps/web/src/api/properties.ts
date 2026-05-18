import { useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import type { PropertyDetail, PropertyMapPin, PropertySummary, SearchFilters, SearchResult } from '@propsphere/types';

export interface SoldSearchFilters {
  query?: string;
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyTypes?: string[];
  saleMethod?: string;
  soldAfter?: string;
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'days_asc';
  page: number;
}

async function fetchProperties(
  filters: SearchFilters,
  page: number,
): Promise<SearchResult<PropertySummary>> {
  const params = new URLSearchParams();
  params.set('listingType', filters.listingType);
  if (filters.query) params.set('query', filters.query);
  if (filters.priceMin !== undefined) params.set('priceMin', String(filters.priceMin));
  if (filters.priceMax !== undefined) params.set('priceMax', String(filters.priceMax));
  if (filters.bedrooms !== undefined) params.set('bedrooms', String(filters.bedrooms));
  if (filters.bathrooms !== undefined) params.set('bathrooms', String(filters.bathrooms));
  if (filters.carSpaces !== undefined) params.set('carSpaces', String(filters.carSpaces));
  if (filters.propertyTypes.length) params.set('propertyTypes', filters.propertyTypes.join(','));
  if (filters.features.length) params.set('features', filters.features.join(','));
  if (filters.publishedSince) params.set('publishedSince', filters.publishedSince);
  params.set('sortBy', filters.sortBy);
  params.set('page', String(page));

  const res = await fetch(`/api/properties/search?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch properties');
  const json = await res.json() as { data: SearchResult<PropertySummary> };
  return json.data;
}

async function fetchProperty(id: string): Promise<PropertyDetail> {
  const res = await fetch(`/api/properties/${id}`);
  if (!res.ok) throw new Error('Failed to fetch property');
  const json = await res.json() as { data: PropertyDetail };
  return json.data;
}

export function usePropertySearch(filters: SearchFilters) {
  const { page: _page, ...filterKey } = filters;

  return useInfiniteQuery({
    queryKey: ['properties', 'search', filterKey],
    queryFn: ({ pageParam }) => fetchProperties(filters, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    staleTime: 30_000,
  });
}

export function useProperty(id: string, enabled = true) {
  return useQuery({
    queryKey: ['properties', id],
    queryFn: () => fetchProperty(id),
    enabled: enabled && !!id,
    staleTime: 60_000,
  });
}

type MapBbox = { swLat: number; swLng: number; neLat: number; neLng: number };

async function fetchMapProperties(bbox: MapBbox): Promise<PropertyMapPin[]> {
  const params = new URLSearchParams({
    swLat: String(bbox.swLat),
    swLng: String(bbox.swLng),
    neLat: String(bbox.neLat),
    neLng: String(bbox.neLng),
  });
  const res = await fetch(`/api/properties/map?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch map properties');
  const json = await res.json() as { data: PropertyMapPin[] };
  return json.data;
}

export function useMapProperties(bbox: MapBbox | null) {
  return useQuery({
    queryKey: ['properties', 'map', bbox],
    queryFn: () => fetchMapProperties(bbox!),
    enabled: bbox !== null,
    staleTime: 20_000,
  });
}

export function useIncrementViewCount(id: string) {
  const { mutate } = useMutation({
    mutationFn: () =>
      fetch(`/api/properties/${id}/view-count`, { method: 'PATCH' }),
  });

  useEffect(() => {
    mutate();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
}

async function fetchSoldProperties(
  filters: SoldSearchFilters,
  page: number,
): Promise<SearchResult<PropertySummary>> {
  const params = new URLSearchParams();
  params.set('listingType', 'sold');
  params.set('sortBy', filters.sortBy);
  params.set('page', String(page));
  if (filters.query) params.set('query', filters.query);
  if (filters.priceMin !== undefined) params.set('priceMin', String(filters.priceMin));
  if (filters.priceMax !== undefined) params.set('priceMax', String(filters.priceMax));
  if (filters.bedrooms !== undefined) params.set('bedrooms', String(filters.bedrooms));
  if (filters.bathrooms !== undefined) params.set('bathrooms', String(filters.bathrooms));
  if (filters.propertyTypes?.length) params.set('propertyTypes', filters.propertyTypes.join(','));
  if (filters.saleMethod) params.set('saleMethod', filters.saleMethod);
  if (filters.soldAfter) params.set('soldAfter', filters.soldAfter);

  const res = await fetch(`/api/properties/search?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch sold properties');
  const json = await res.json() as { data: SearchResult<PropertySummary> };
  return json.data;
}

export function useSoldSearch(filters: SoldSearchFilters) {
  const { page: _page, ...filterKey } = filters;

  return useInfiniteQuery({
    queryKey: ['properties', 'sold', filterKey],
    queryFn: ({ pageParam }) => fetchSoldProperties(filters, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    staleTime: 30_000,
  });
}
