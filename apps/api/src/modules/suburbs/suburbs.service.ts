import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

export interface SuburbSuggestion {
  id: string;
  name: string;
  state: string;
  postcode: string;
  lat: number | null;
  lng: number | null;
}

export interface SuburbDetail {
  id: string;
  name: string;
  slug: string;
  postcode: string;
  state: string;
  lat: number | null;
  lng: number | null;
  median_sale_price: number | null;
  median_rent_price: number | null;
  days_on_market_avg: number | null;
  stats_updated_at: string | null;
  created_at: string;
}

export interface SuburbPricePoint {
  period: string;
  medianPrice: number;
  saleCount: number;
}

export interface SuburbSoldStats {
  totalSales: number;
  medianSoldPrice: number | null;
  clearanceRate: number | null;
  avgDaysOnMarket: number | null;
}

@Injectable()
export class SuburbsService {
  constructor(private readonly supabase: SupabaseService) {}

  async autocomplete(query: string): Promise<SuburbSuggestion[]> {
    const term = `%${query}%`;
    const { data, error } = await this.supabase.client
      .from('suburbs')
      .select('id, name, state, postcode, lat, lng')
      .or(`name.ilike.${term},postcode.ilike.${term}`)
      .order('name')
      .limit(8);

    if (error) throw error;
    return data ?? [];
  }

  async findByStateSlug(state: string, slug: string): Promise<SuburbDetail> {
    const { data, error } = await this.supabase.client
      .from('suburbs')
      .select(
        'id, name, slug, postcode, state, lat, lng, median_sale_price, median_rent_price, days_on_market_avg, stats_updated_at, created_at',
      )
      .eq('state', state.toUpperCase())
      .eq('slug', slug)
      .single();

    if (error || !data) throw new NotFoundException(`Suburb "${slug}" not found in ${state}`);
    return data as SuburbDetail;
  }

  async getPriceHistory(suburbId: string): Promise<SuburbPricePoint[]> {
    const { data, error } = await this.supabase.client
      .from('property_price_history')
      .select('period, median_price, sale_count')
      .eq('suburb_id', suburbId)
      .order('period', { ascending: true })
      .limit(24);

    if (error) throw error;
    return (data ?? []).map((row) => ({
      period: row.period as string,
      medianPrice: row.median_price as number,
      saleCount: row.sale_count as number,
    }));
  }

  async getSoldStats(suburbId: string): Promise<SuburbSoldStats> {
    const since = new Date(Date.now() - 365 * 86_400_000).toISOString();
    const { data, error } = await this.supabase.client
      .from('properties')
      .select('sold_price, sale_method, sold_at')
      .eq('suburb_id', suburbId)
      .eq('status', 'sold')
      .gte('sold_at', since);

    if (error) throw error;

    const rows = data ?? [];
    const prices = rows
      .map((p) => p.sold_price as number | null)
      .filter((v): v is number => v != null)
      .sort((a, b) => a - b);

    const median = prices.length ? prices[Math.floor(prices.length / 2)] : null;
    const auctions = rows.filter((p) => p.sale_method === 'auction');
    const clearanceRate = auctions.length
      ? Math.round(
          (auctions.filter((p) => p.sold_price != null).length / auctions.length) * 100,
        )
      : null;

    return {
      totalSales: rows.length,
      medianSoldPrice: median,
      clearanceRate,
      avgDaysOnMarket: null,
    };
  }
}
