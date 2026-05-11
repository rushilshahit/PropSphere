export interface SuburbStats {
  median_sale_price: number | null;
  median_rent_price: number | null;
  days_on_market_avg: number | null;
  stats_updated_at: string | null;
}

export interface Suburb extends SuburbStats {
  id: string;
  name: string;
  slug: string;
  postcode: string;
  state: string;
  lat: number | null;
  lng: number | null;
  created_at: string;
}
