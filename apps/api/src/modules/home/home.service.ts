import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

const PROPERTY_SUMMARY_COLS =
  'id, headline, suburb, state, postcode, unit_number, street_number, street_name, price, price_display, is_price_hidden, bedrooms, bathrooms, car_spaces, land_size_sqm, listing_type, property_type, status, sale_method, published_at, lat, lng, agent_id, agency_id, created_at';

async function attachImages(
  supabase: SupabaseService,
  properties: Record<string, unknown>[],
): Promise<(Record<string, unknown> & { images: unknown[] })[]> {
  if (properties.length === 0) return [];
  const ids = properties.map((p) => p['id'] as string);
  const { data: images } = await supabase.client
    .from('property_images')
    .select('id, property_id, cdn_url, sort_order')
    .in('property_id', ids)
    .eq('is_floor_plan', false)
    .order('sort_order');
  const byProperty = new Map<string, unknown[]>();
  for (const img of images ?? []) {
    const pid = (img as { property_id: string }).property_id;
    if (!byProperty.has(pid)) byProperty.set(pid, []);
    byProperty.get(pid)!.push(img);
  }
  return properties.map((p) => ({ ...p, images: byProperty.get(p['id'] as string) ?? [] }));
}

@Injectable()
export class HomeService {
  constructor(private readonly supabase: SupabaseService) {}

  async getStats() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const [forSale, forRent, sold30] = await Promise.all([
      this.supabase.client
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('listing_type', 'buy'),
      this.supabase.client
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('listing_type', 'rent'),
      this.supabase.client
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'sold')
        .gte('sold_at', thirtyDaysAgo),
    ]);

    return {
      forSaleCount: forSale.count ?? 0,
      forRentCount: forRent.count ?? 0,
      soldLast30: sold30.count ?? 0,
    };
  }

  async getRecentListings() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const { data, error } = await this.supabase.client
      .from('properties')
      .select(PROPERTY_SUMMARY_COLS)
      .eq('status', 'active')
      .gte('published_at', sevenDaysAgo)
      .order('published_at', { ascending: false })
      .limit(8);

    if (error) throw error;
    return attachImages(this.supabase, (data ?? []) as Record<string, unknown>[]);
  }

  async getFeaturedListings() {
    const { data, error } = await this.supabase.client
      .from('properties')
      .select(PROPERTY_SUMMARY_COLS)
      .eq('status', 'active')
      .eq('is_featured', true)
      .limit(6);

    if (error) throw error;
    return attachImages(this.supabase, (data ?? []) as Record<string, unknown>[]);
  }

  async getSuburbs() {
    const { data: suburbs, error } = await this.supabase.client
      .from('suburbs')
      .select('id, name, state, slug, lat, lng, median_sale_price')
      .limit(8);

    if (error) throw error;
    if (!suburbs || suburbs.length === 0) return [];

    const suburbanCounts = await Promise.all(
      suburbs.map(async (suburb) => {
        const { count } = await this.supabase.client
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .eq('suburb', suburb.name);
        return { ...suburb, activeListingCount: count ?? 0, heroImageUrl: '' };
      }),
    );

    return suburbanCounts.sort((a, b) => b.activeListingCount - a.activeListingCount);
  }
}
