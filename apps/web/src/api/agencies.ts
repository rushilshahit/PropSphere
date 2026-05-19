import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { SoldProperty } from './agents';

export interface AgencySummary {
  id: string;
  name: string;
  logo_url: string | null;
  suburb: string;
  state: string;
}

export interface AgentMiniCard {
  id: string;
  slug: string | null;
  is_verified: boolean;
  full_name: string | null;
  avatar_url: string | null;
  active_listings: number;
}

export interface AgencyProfile {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  created_at: string;
  agents: AgentMiniCard[];
  activeListingCount: number;
  soldLast12m: number;
  activeListings: unknown[];
  recentSales: SoldProperty[];
}

interface AgentApplicationPayload {
  agencyMode: 'join' | 'create';
  existingAgencyId?: string;
  newAgency?: { name: string; address: string; phone: string };
  licenseNo: string;
  licenseDocUrl?: string;
  bio: string;
  yearsActive: number;
  avatarUrl?: string;
}

async function authFetch(url: string, options?: RequestInit): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        ...(options?.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

export function useAgencyBySlug(slug: string) {
  return useQuery({
    queryKey: ['agencies', slug],
    queryFn: async () => {
      const res = await fetch(`/api/agencies/${slug}`);
      if (!res.ok) throw new Error('Agency not found');
      const json = (await res.json()) as { data: AgencyProfile };
      return json.data;
    },
    staleTime: 5 * 60_000,
    enabled: !!slug,
  });
}

export function useAgencySearch(query: string) {
  return useQuery({
    queryKey: ['agencies', 'search', query],
    queryFn: async (): Promise<AgencySummary[]> => {
      const res = await fetch(`/api/agencies/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Agency search failed');
      const json = (await res.json()) as { data: AgencySummary[] };
      return json.data;
    },
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}

async function applyAsAgent(payload: AgentApplicationPayload): Promise<void> {
  let res: Response;
  try {
    res = await authFetch('/api/agents/apply', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    const message = err instanceof Error && err.name === 'AbortError'
      ? 'Request timed out. Please try again.'
      : 'Unable to connect to server. Make sure the API is running.';
    throw new Error(message);
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ message: 'Application failed' }))) as { message: string };
    throw new Error(typeof err.message === 'string' ? err.message : 'Application failed');
  }
}

export function useApplyAsAgent() {
  return useMutation({ mutationFn: applyAsAgent });
}
