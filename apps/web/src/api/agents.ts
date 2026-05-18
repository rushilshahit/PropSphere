import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface AgentSummary {
  id: string;
  full_name: string | null;
  agency_name: string;
  agency_suburb: string;
  agency_state: string;
  bio: string | null;
  years_active: number | null;
  license_no: string | null;
  active_listings: number;
}

interface AgentsResult {
  items: AgentSummary[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AgentStats {
  activeListings: number;
  enquiriesToday: number;
  totalViews: number;
}

export interface AgentListing {
  id: string;
  headline: string | null;
  suburb: string;
  state: string;
  postcode: string;
  status: string;
  listing_type: string;
  price: number | null;
  price_display: string | null;
  published_at: string | null;
  created_at: string;
}

export interface AgentEnquiryItem {
  id: string;
  sender_name: string;
  sender_email: string;
  message: string;
  status: string;
  created_at: string;
  property: { id: string; headline: string | null; suburb: string; state: string } | null;
}

export interface AgentEnquiriesResult {
  items: AgentEnquiryItem[];
  total: number;
  totalPages: number;
}

export interface AgentOfferItem {
  id: string;
  sender_name: string;
  sender_email: string;
  amount: number;
  status: string;
  created_at: string;
  property: { id: string; headline: string | null; suburb: string; state: string } | null;
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

async function fetchAgents(suburb: string, page: number): Promise<AgentsResult> {
  const params = new URLSearchParams({ page: String(page) });
  if (suburb) params.set('suburb', suburb);
  const res = await fetch(`/api/agents?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch agents');
  const json = await res.json() as { data: AgentsResult };
  return json.data;
}

export function useAgents(suburb: string, page: number) {
  return useQuery({
    queryKey: ['agents', suburb, page],
    queryFn: () => fetchAgents(suburb, page),
    staleTime: 60_000,
  });
}

export function useAgentStats() {
  return useQuery({
    queryKey: ['agent', 'stats'],
    queryFn: async () => {
      const res = await authFetch('/api/agents/me/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const json = (await res.json()) as { data: AgentStats };
      return json.data;
    },
    staleTime: 60_000,
  });
}

export function useAgentListings(status?: string) {
  return useQuery({
    queryKey: ['agent', 'listings', status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      const res = await authFetch(`/api/agents/me/listings?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch listings');
      const json = (await res.json()) as { data: AgentListing[] };
      return json.data;
    },
    staleTime: 30_000,
  });
}

export function useUpdateListingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await authFetch(`/api/properties/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update listing status');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['agent', 'listings'] });
    },
  });
}

export function useAgentEnquiries(page = 1) {
  return useQuery({
    queryKey: ['agent', 'enquiries', page],
    queryFn: async () => {
      const res = await authFetch(`/api/agents/me/enquiries?page=${page}`);
      if (!res.ok) throw new Error('Failed to fetch enquiries');
      const json = (await res.json()) as { data: AgentEnquiriesResult };
      return json.data;
    },
    staleTime: 30_000,
  });
}

export function useAgentOffers() {
  return useQuery({
    queryKey: ['agent', 'offers'],
    queryFn: async () => {
      const res = await authFetch('/api/agents/me/offers');
      if (!res.ok) throw new Error('Failed to fetch offers');
      const json = (await res.json()) as { data: AgentOfferItem[] };
      return json.data;
    },
    staleTime: 30_000,
  });
}

export function useUpdateOfferStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await authFetch(`/api/offers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update offer status');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['agent', 'offers'] });
    },
  });
}
