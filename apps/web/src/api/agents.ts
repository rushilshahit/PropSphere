import { useQuery } from '@tanstack/react-query';

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
