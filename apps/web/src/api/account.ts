import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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

export interface RecentlyViewedItem {
  propertyId: string;
  viewedAt: string;
}

export interface EnquiryHistoryItem {
  id: string;
  message: string;
  createdAt: string;
  status: string;
  property: {
    id: string;
    headline: string | null;
    suburb: string;
    state: string;
    heroImageUrl: string | null;
  } | null;
}

export function useRecentlyViewed(enabled: boolean) {
  return useQuery({
    queryKey: ['recently-viewed'],
    queryFn: async (): Promise<RecentlyViewedItem[]> => {
      const res = await authFetch('/api/users/recently-viewed');
      if (!res.ok) throw new Error('Failed to fetch recently viewed');
      const json = await res.json() as { data: RecentlyViewedItem[] };
      return json.data;
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useMyEnquiries() {
  return useQuery({
    queryKey: ['my-enquiries'],
    queryFn: async (): Promise<EnquiryHistoryItem[]> => {
      const res = await authFetch('/api/users/me/enquiries');
      if (!res.ok) throw new Error('Failed to fetch enquiries');
      const json = await res.json() as { data: EnquiryHistoryItem[] };
      return json.data;
    },
    staleTime: 60_000,
  });
}
