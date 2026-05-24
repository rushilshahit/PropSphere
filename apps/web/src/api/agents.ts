import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// ── Public profile types ──────────────────────────────────────────────────────
export interface AgentProfile {
  id: string;
  slug: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  email: string;
  bio: string | null;
  years_active: number | null;
  license_no: string | null;
  is_verified: boolean;
  agency: { id: string; name: string; slug: string; logo_url: string | null } | null;
  activeListings: unknown[];
  activeListingCount: number;
  soldLast12m: number;
  avgDaysOnMarket: number | null;
  medianSoldPrice: number | null;
}

export interface SoldProperty {
  id: string;
  headline: string | null;
  suburb: string;
  state: string;
  postcode: string;
  unit_number: string | null;
  street_number: string;
  street_name: string;
  price: number | null;
  price_display: string | null;
  is_price_hidden: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  car_spaces: number | null;
  listing_type: string;
  property_type: string;
  status: string;
  images: { cdn_url: string; sort_order: number }[];
  sold_price: number | null;
  sold_at: string | null;
  published_at: string | null;
}

export interface AgentSearchResult {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  agency_name: string | null;
  suburb: string | null;
}

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
      if (res.status === 404) return { activeListings: 0, enquiriesToday: 0, totalViews: 0 };
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
      if (res.status === 404) return [] as AgentListing[];
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

export interface AnalyticsListing {
  id: string;
  headline: string | null;
  suburb: string;
  status: string;
  published_at: string | null;
  view_count: number;
  enquiry_count: number;
  enquiryRate: number;
  daysLive: number;
}

export interface AgentAnalytics {
  totalViews: number;
  totalEnquiries: number;
  totalOffers: number;
  avgEnquiryRate: number;
  listings: AnalyticsListing[];
}

export function useAgentAnalytics() {
  return useQuery({
    queryKey: ['agent', 'analytics'],
    queryFn: async () => {
      const res = await authFetch('/api/agents/me/analytics');
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const json = (await res.json()) as { data: AgentAnalytics };
      return json.data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useAgentBySlug(slug: string) {
  return useQuery({
    queryKey: ['agents', slug],
    queryFn: async () => {
      const res = await fetch(`/api/agents/${slug}`);
      if (!res.ok) throw new Error('Agent not found');
      const json = (await res.json()) as { data: AgentProfile };
      return json.data;
    },
    staleTime: 5 * 60_000,
    enabled: !!slug,
  });
}

export function useAgentSearch(query: string) {
  return useQuery({
    queryKey: ['agents', 'search', query],
    queryFn: async () => {
      const params = new URLSearchParams({ q: query });
      const res = await fetch(`/api/agents/search?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to search agents');
      const json = (await res.json()) as { data: AgentSearchResult[] };
      return json.data;
    },
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}

export function useAgentSoldHistory(slug: string) {
  return useQuery({
    queryKey: ['agents', slug, 'sold'],
    queryFn: async () => {
      const res = await fetch(`/api/agents/${slug}/sold`);
      if (!res.ok) throw new Error('Failed to fetch sold history');
      const json = (await res.json()) as { data: SoldProperty[] };
      return json.data;
    },
    staleTime: 5 * 60_000,
    enabled: !!slug,
  });
}
