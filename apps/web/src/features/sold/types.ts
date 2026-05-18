export interface SoldFiltersState {
  query: string;
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyTypes: string[];
  saleMethod?: string;
  soldAfter?: string;
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'days_asc';
}

export const DEFAULT_SOLD_FILTERS: SoldFiltersState = {
  query: '',
  propertyTypes: [],
  sortBy: 'newest',
};

export const SOLD_AFTER_PRESETS = [
  { label: 'Last 3 months', months: 3 },
  { label: 'Last 6 months', months: 6 },
  { label: 'Last year', months: 12 },
] as const;

export const SALE_METHOD_OPTIONS = [
  { value: 'auction', label: 'Auction' },
  { value: 'private_treaty', label: 'Private Treaty' },
  { value: 'tender', label: 'Expression of Interest' },
] as const;
