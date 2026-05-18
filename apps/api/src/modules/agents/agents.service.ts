import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

const PAGE_SIZE = 12;
const ENQUIRIES_PAGE_SIZE = 20;

const SOLD_PROPERTY_COLS =
  'id, headline, suburb, state, postcode, unit_number, street_number, street_name, price, price_display, is_price_hidden, bedrooms, bathrooms, car_spaces, land_size_sqm, listing_type, property_type, status, sale_method, published_at, lat, lng, agent_id, agency_id, created_at, sold_price, sold_at';

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : ((sorted[mid - 1] + sorted[mid]) / 2);
}

async function attachPropertyImages(
  supabase: SupabaseService,
  properties: { id: string }[],
): Promise<({ id: string } & Record<string, unknown>)[]> {
  if (!properties.length) return properties.map((p) => ({ ...p, images: [] }));
  const ids = properties.map((p) => p.id);
  const { data: images } = await supabase.client
    .from('property_images')
    .select('id, property_id, storage_path, cdn_url, caption, sort_order, is_floor_plan, created_at')
    .in('property_id', ids)
    .eq('is_floor_plan', false)
    .order('sort_order');
  const byProperty = new Map<string, unknown[]>();
  for (const img of images ?? []) {
    const typed = img as { property_id: string };
    const arr = byProperty.get(typed.property_id) ?? [];
    arr.push(img);
    byProperty.set(typed.property_id, arr);
  }
  return properties.map((p) => ({ ...p, images: byProperty.get(p.id) ?? [] }));
}

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
  images: unknown[];
  sold_price: number | null;
  sold_at: string | null;
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

  async findBySlug(slug: string): Promise<{ id: string }> {
    const { data, error } = await this.supabase.client
      .from('agents')
      .select('id')
      .eq('slug', slug)
      .single();
    if (error || !data) throw new NotFoundException('Agent not found');
    return data as { id: string };
  }

  async getAgentProfile(slug: string): Promise<AgentProfile> {
    const { data: agent, error } = await this.supabase.client
      .from('agents')
      .select('id, slug, profile_id, agency_id, bio, years_active, license_no, is_verified')
      .eq('slug', slug)
      .single();

    if (error || !agent) throw new NotFoundException('Agent not found');

    const typed = agent as {
      id: string; slug: string | null; profile_id: string; agency_id: string;
      bio: string | null; years_active: number | null; license_no: string | null; is_verified: boolean;
    };

    const oneYearAgo = new Date(Date.now() - 365 * 86_400_000).toISOString();

    const [profileRes, agencyRes, activeListingsRes, soldStatsRes, { count: soldCount }] =
      await Promise.all([
        this.supabase.client.from('profiles').select('full_name, avatar_url, phone, email').eq('id', typed.profile_id).single(),
        this.supabase.client.from('agencies').select('id, name, slug, logo_url').eq('id', typed.agency_id).single(),
        this.supabase.client.from('properties').select(SOLD_PROPERTY_COLS).eq('agent_id', typed.id).eq('status', 'active').order('published_at', { ascending: false }).limit(9),
        this.supabase.client.from('properties').select('sold_price, sold_at, published_at').eq('agent_id', typed.id).eq('status', 'sold').gte('sold_at', oneYearAgo),
        this.supabase.client.from('properties').select('id', { count: 'exact', head: true }).eq('agent_id', typed.id).eq('status', 'sold').gte('sold_at', oneYearAgo),
      ]);

    const profile = profileRes.data as { full_name: string | null; avatar_url: string | null; phone: string | null; email: string } | null;
    const agency = agencyRes.data as { id: string; name: string; slug: string; logo_url: string | null } | null;

    const soldRecords = (soldStatsRes.data ?? []) as { sold_price: number | null; sold_at: string | null; published_at: string | null }[];
    const soldPrices = soldRecords.map((r) => r.sold_price).filter((p): p is number => p != null);
    const daysDiffs = soldRecords
      .map((r) => {
        if (!r.sold_at || !r.published_at) return null;
        return Math.round((new Date(r.sold_at).getTime() - new Date(r.published_at).getTime()) / 86_400_000);
      })
      .filter((d): d is number => d != null && d >= 0);

    const activeListingsWithImages = await attachPropertyImages(this.supabase, (activeListingsRes.data ?? []) as { id: string }[]);

    return {
      id: typed.id,
      slug: typed.slug,
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      phone: profile?.phone ?? null,
      email: profile?.email ?? '',
      bio: typed.bio,
      years_active: typed.years_active,
      license_no: typed.license_no,
      is_verified: typed.is_verified,
      agency,
      activeListings: activeListingsWithImages,
      activeListingCount: activeListingsRes.data?.length ?? 0,
      soldLast12m: soldCount ?? 0,
      avgDaysOnMarket: daysDiffs.length ? Math.round(daysDiffs.reduce((a, b) => a + b, 0) / daysDiffs.length) : null,
      medianSoldPrice: median(soldPrices),
    };
  }

  async getSoldHistory(slug: string): Promise<unknown[]> {
    const agent = await this.findBySlug(slug);
    const { data } = await this.supabase.client
      .from('properties')
      .select(SOLD_PROPERTY_COLS)
      .eq('agent_id', agent.id)
      .eq('status', 'sold')
      .order('sold_at', { ascending: false })
      .limit(24);
    return attachPropertyImages(this.supabase, (data ?? []) as { id: string }[]);
  }
}
