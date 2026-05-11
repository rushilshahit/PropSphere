import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

const PROPERTY_SUMMARY_COLS =
  'id, headline, suburb, state, postcode, unit_number, street_number, street_name, price, price_display, is_price_hidden, bedrooms, bathrooms, car_spaces, land_size_sqm, listing_type, property_type, status, sale_method, published_at, lat, lng, agent_id, agency_id, created_at, images:property_images(id, cdn_url, display_order)';

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
    const { data, error } = await this.supabase.client
      .from('properties')
      .select(PROPERTY_SUMMARY_COLS)
      .eq('status', 'active')
      .order('published_at', { ascending: false })
      .limit(8);

    if (error) throw error;
    return data ?? [];
  }

  async getFeaturedListings() {
    const { data, error } = await this.supabase.client
      .from('properties')
      .select(PROPERTY_SUMMARY_COLS)
      .eq('status', 'active')
      .eq('is_featured', true)
      .limit(6);

    if (error) throw error;
    return data ?? [];
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
