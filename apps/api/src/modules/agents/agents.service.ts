import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

const PAGE_SIZE = 12;

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

@Injectable()
export class AgentsService {
  constructor(private readonly supabase: SupabaseService) {}

  async listAgents(params: { page?: number; suburb?: string }) {
    const page = params.page ?? 1;
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = this.supabase.client
      .from('agents')
      .select('id, profile_id, agency_id, bio, years_active, license_no', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    const items = data ?? [];
    const enriched = await Promise.all(
      items.map(async (a) => {
        const agent = a as { id: string; profile_id: string; agency_id: string; bio: string | null; years_active: number | null; license_no: string | null };
        const [{ data: profile }, { data: agency }, { count: listingCount }] = await Promise.all([
          this.supabase.client.from('profiles').select('full_name').eq('id', agent.profile_id).single(),
          this.supabase.client.from('agencies').select('name, suburb, state').eq('id', agent.agency_id).single(),
          this.supabase.client.from('properties').select('*', { count: 'exact', head: true }).eq('agent_id', agent.id).eq('status', 'active'),
        ]);

        const agencyData = agency as { name: string; suburb: string; state: string } | null;

        // apply suburb filter after join since we're filtering on agency.suburb
        if (params.suburb && agencyData?.suburb) {
          const suburbLower = params.suburb.toLowerCase();
          if (!agencyData.suburb.toLowerCase().includes(suburbLower)) return null;
        }

        return {
          id: agent.id,
          full_name: (profile as { full_name: string | null } | null)?.full_name ?? null,
          agency_name: agencyData?.name ?? '',
          agency_suburb: agencyData?.suburb ?? '',
          agency_state: agencyData?.state ?? '',
          bio: agent.bio,
          years_active: agent.years_active,
          license_no: agent.license_no,
          active_listings: listingCount ?? 0,
        } satisfies AgentSummary;
      }),
    );

    const filtered = enriched.filter((a): a is AgentSummary => a !== null);
    const total = params.suburb ? filtered.length : (count ?? 0);

    return {
      items: filtered,
      total,
      page,
      totalPages: Math.ceil((params.suburb ? filtered.length : (count ?? 0)) / PAGE_SIZE),
    };
  }
}
