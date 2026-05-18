import { useQuery } from '@tanstack/react-query';
import type { SoldProperty } from './agents';

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
