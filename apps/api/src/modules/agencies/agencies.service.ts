import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

const SOLD_PROPERTY_COLS =
  'id, headline, suburb, state, postcode, unit_number, street_number, street_name, price, price_display, is_price_hidden, bedrooms, bathrooms, car_spaces, land_size_sqm, listing_type, property_type, status, sale_method, published_at, lat, lng, agent_id, agency_id, created_at, sold_price, sold_at';

const ACTIVE_PROPERTY_COLS =
  'id, headline, suburb, state, postcode, unit_number, street_number, street_name, price, price_display, is_price_hidden, bedrooms, bathrooms, car_spaces, land_size_sqm, listing_type, property_type, status, sale_method, published_at, lat, lng, agent_id, agency_id, created_at, bhk_config, virtual_tour_url, auction_at';

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

@Injectable()
export class AgenciesService {
  constructor(private readonly supabase: SupabaseService) {}

  async findBySlug(slug: string) {
    const { data: agency, error } = await this.supabase.client
      .from('agencies')
      .select('id, name, slug, logo_url, website, phone, address, suburb, state, postcode, created_at')
      .eq('slug', slug)
      .single();

    if (error || !agency) throw new NotFoundException('Agency not found');

    const typedAgency = agency as {
      id: string; name: string; slug: string; logo_url: string | null;
      website: string | null; phone: string | null; address: string | null;
      suburb: string | null; state: string | null; postcode: string | null; created_at: string;
    };

    const oneYearAgo = new Date(Date.now() - 365 * 86_400_000).toISOString();

    const [agentsRes, activeListingsRes, recentSalesRes, { count: activeCount }, { count: soldCount }] =
      await Promise.all([
        this.supabase.client
          .from('agents')
          .select('id, slug, is_verified, profile:profiles(full_name, avatar_url)')
          .eq('agency_id', typedAgency.id)
          .eq('is_verified', true),
        this.supabase.client
          .from('properties')
          .select(ACTIVE_PROPERTY_COLS)
          .eq('agency_id', typedAgency.id)
          .eq('status', 'active')
          .order('published_at', { ascending: false })
          .limit(9),
        this.supabase.client
          .from('properties')
          .select(SOLD_PROPERTY_COLS)
          .eq('agency_id', typedAgency.id)
          .eq('status', 'sold')
          .gte('sold_at', oneYearAgo)
          .order('sold_at', { ascending: false })
          .limit(6),
        this.supabase.client
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('agency_id', typedAgency.id)
          .eq('status', 'active'),
        this.supabase.client
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('agency_id', typedAgency.id)
          .eq('status', 'sold')
          .gte('sold_at', oneYearAgo),
      ]);

    const rawAgents = (agentsRes.data ?? []) as {
      id: string; slug: string | null; is_verified: boolean;
      profile: { full_name: string | null; avatar_url: string | null } | null;
    }[];

    // Batch-fetch active listing counts per agent
    const agentIds = rawAgents.map((a) => a.id);
    const listingCountsMap = new Map<string, number>();
    if (agentIds.length) {
      const { data: agentListings } = await this.supabase.client
        .from('properties')
        .select('agent_id')
        .in('agent_id', agentIds)
        .eq('status', 'active');
      for (const row of agentListings ?? []) {
        const r = row as { agent_id: string };
        listingCountsMap.set(r.agent_id, (listingCountsMap.get(r.agent_id) ?? 0) + 1);
      }
    }

    const agents = rawAgents.map((a) => ({
      id: a.id,
      slug: a.slug,
      is_verified: a.is_verified,
      full_name: a.profile?.full_name ?? null,
      avatar_url: a.profile?.avatar_url ?? null,
      active_listings: listingCountsMap.get(a.id) ?? 0,
    }));

    const [activeListings, recentSales] = await Promise.all([
      attachPropertyImages(this.supabase, (activeListingsRes.data ?? []) as { id: string }[]),
      attachPropertyImages(this.supabase, (recentSalesRes.data ?? []) as { id: string }[]),
    ]);

    return {
      ...typedAgency,
      agents,
      activeListingCount: activeCount ?? 0,
      soldLast12m: soldCount ?? 0,
      activeListings,
      recentSales,
    };
  }
}
