import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface OwnerListing {
  id: string;
  status: string;
  headline: string | null;
  suburb: string;
  state: string;
  postcode: string;
  unit_number: string | null;
  street_number: string;
  street_name: string;
  price: number | null;
  price_display: string | null;
  listing_type: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  published_at: string | null;
  created_at: string;
  view_count: number;
  enquiry_count: number;
}

export interface OwnerListingStats {
  view_count: number;
  enquiry_count: number;
  days_listed: number;
}

export interface OwnerListingEnquiry {
  id: string;
  sender_name: string;
  sender_email: string;
  sender_phone: string | null;
  message: string;
  status: string;
  created_at: string;
}

async function authFetch(url: string, options?: RequestInit): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });
}

export function useMyOwnerListings() {
  return useQuery({
    queryKey: ['owner-listings', 'me'],
    queryFn: async () => {
      const res = await authFetch('/api/owner-listings/me');
      if (!res.ok) throw new Error('Failed to fetch listings');
      const json = (await res.json()) as { data: OwnerListing[] };
      return json.data;
    },
    staleTime: 30_000,
  });
}

export function useOwnerListingStats(id: string) {
  return useQuery({
    queryKey: ['owner-listings', id, 'stats'],
    queryFn: async () => {
      const res = await authFetch(`/api/owner-listings/${id}/stats`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      const json = (await res.json()) as { data: OwnerListingStats };
      return json.data;
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useOwnerListingEnquiries(id: string) {
  return useQuery({
    queryKey: ['owner-listings', id, 'enquiries'],
    queryFn: async () => {
      const res = await authFetch(`/api/owner-listings/${id}/enquiries`);
      if (!res.ok) throw new Error('Failed to fetch enquiries');
      const json = (await res.json()) as { data: OwnerListingEnquiry[] };
      return json.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useUpdateOwnerListingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await authFetch(`/api/owner-listings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
    },
  });
}

export function useDeleteOwnerListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/owner-listings/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete listing');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
    },
  });
}
