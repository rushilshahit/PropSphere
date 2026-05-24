import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface SubmitOfferPayload {
  propertyId: string;
  agentId: string;
  amount: number;
  message?: string;
  isConfidential?: boolean;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
}

export interface MyOfferItem {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  property: {
    id: string;
    headline: string | null;
    suburb: string;
    state: string;
    heroImageUrl: string | null;
  } | null;
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

export function useSubmitOffer() {
  return useMutation({
    mutationFn: async (dto: SubmitOfferPayload) => {
      const res = await authFetch('/api/offers', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message ?? 'Failed to submit offer');
      }
      return res.json();
    },
  });
}

export function useMyOffers() {
  return useQuery({
    queryKey: ['my-offers'],
    queryFn: async (): Promise<MyOfferItem[]> => {
      const res = await authFetch('/api/users/me/offers');
      if (!res.ok) throw new Error('Failed to fetch offers');
      const json = await res.json() as { data: MyOfferItem[] };
      return json.data;
    },
    staleTime: 60_000,
  });
}
