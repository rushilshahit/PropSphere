import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

const PAGE_SIZE = 12;
const ENQUIRIES_PAGE_SIZE = 20;

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

export interface AgentOfferItem {
  id: string;
  sender_name: string;
  sender_email: string;
  amount: number;
  status: string;
  created_at: string;
  property: { id: string; headline: string | null; suburb: string; state: string } | null;
}

@Injectable()
export class AgentsService {
  constructor(private readonly supabase: SupabaseService) {}

  async listAgents(params: { page?: number; suburb?: string }) {
    const page = params.page ?? 1;
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let agencyIds: string[] | null = null;
    if (params.suburb) {
      const { data: agencyRows } = await this.supabase.client
        .from('agencies')
        .select('id')
        .ilike('suburb', `%${params.suburb}%`);
      agencyIds = (agencyRows ?? []).map((a: { id: string }) => a.id);
      if (agencyIds.length === 0) {
        return { items: [], total: 0, page, totalPages: 0 };
      }
    }

    let query = this.supabase.client
      .from('agents')
      .select('id, profile_id, agency_id, bio, years_active, license_no', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (agencyIds) {
      query = query.in('agency_id', agencyIds);
    }

    const { data, count, error } = await query.range(from, to);
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

    const total = count ?? 0;

    return {
      items: enriched,
      total,
      page,
      totalPages: Math.ceil(total / PAGE_SIZE),
    };
  }

  async findByProfileId(profileId: string): Promise<{ id: string }> {
    const { data, error } = await this.supabase.client
      .from('agents')
      .select('id')
      .eq('profile_id', profileId)
      .single();
    if (error || !data) throw new NotFoundException('Agent record not found for this user');
    return data as { id: string };
  }

  async getMyStats(agentId: string): Promise<AgentStats> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      { count: activeListings },
      { count: enquiriesToday },
      { data: viewData },
    ] = await Promise.all([
      this.supabase.client
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId)
        .eq('status', 'active'),
      this.supabase.client
        .from('enquiries')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId)
        .gte('created_at', todayStart.toISOString()),
      this.supabase.client
        .from('properties')
        .select('view_count')
        .eq('agent_id', agentId),
    ]);

    const totalViews = (viewData ?? []).reduce(
      (sum, p: { view_count: number | null }) => sum + (p.view_count ?? 0),
      0,
    );

    return {
      activeListings: activeListings ?? 0,
      enquiriesToday: enquiriesToday ?? 0,
      totalViews,
    };
  }

  async getMyListings(agentId: string, status?: string): Promise<AgentListing[]> {
    let query = this.supabase.client
      .from('properties')
      .select('id, headline, suburb, state, postcode, status, listing_type, price, price_display, published_at, created_at')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as AgentListing[];
  }

  async getMyEnquiries(
    agentId: string,
    page: number,
  ): Promise<{ items: AgentEnquiryItem[]; total: number; totalPages: number }> {
    const from = (page - 1) * ENQUIRIES_PAGE_SIZE;
    const to = from + ENQUIRIES_PAGE_SIZE - 1;

    const { data, count, error } = await this.supabase.client
      .from('enquiries')
      .select(
        'id, sender_name, sender_email, message, status, created_at, property:properties(id, headline, suburb, state)',
        { count: 'exact' },
      )
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const total = count ?? 0;
    return {
      items: (data ?? []) as unknown as AgentEnquiryItem[],
      total,
      totalPages: Math.ceil(total / ENQUIRIES_PAGE_SIZE),
    };
  }

  async getMyOffers(agentId: string): Promise<AgentOfferItem[]> {
    const { data, error } = await this.supabase.client
      .from('offers')
      .select(
        'id, sender_name, sender_email, amount, status, created_at, property:properties(id, headline, suburb, state)',
      )
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return (data ?? []) as unknown as AgentOfferItem[];
  }
}
