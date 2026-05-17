export interface PriceHistoryRecord {
  id: string;
  property_id: string;
  address_key: string;
  sold_price: number;
  sold_date: string;
  sale_method?: string;
  source: string;
  is_seed_data: boolean;
  created_at: string;
}
