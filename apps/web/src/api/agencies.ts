import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface AgencySummary {
  id: string;
  name: string;
  logo_url: string | null;
  suburb: string;
  state: string;
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
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });
}

async function searchAgencies(q: string): Promise<AgencySummary[]> {
  const res = await fetch(`/api/agencies/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error('Agency search failed');
  const json = (await res.json()) as { data: AgencySummary[] };
  return json.data;
}

export function useAgencySearch(query: string) {
  return useQuery({
    queryKey: ['agencies', 'search', query],
    queryFn: () => searchAgencies(query),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}

async function applyAsAgent(payload: AgentApplicationPayload): Promise<void> {
  const res = await authFetch('/api/agents/apply', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ message: 'Application failed' }))) as { message: string };
    throw new Error(err.message);
  }
}

export function useApplyAsAgent() {
  return useMutation({ mutationFn: applyAsAgent });
}
