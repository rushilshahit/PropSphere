import type { Agent, Agency } from './agent';
import type { PriceHistoryRecord } from './price-history';

export const PropertyType = {
  HOUSE: 'house',
  APARTMENT: 'apartment',
  TOWNHOUSE: 'townhouse',
  UNIT: 'unit',
  LAND: 'land',
  RURAL: 'rural',
} as const;
export type PropertyType = (typeof PropertyType)[keyof typeof PropertyType];

export const ListingType = {
  BUY: 'buy',
  RENT: 'rent',
  SOLD: 'sold',
} as const;
export type ListingType = (typeof ListingType)[keyof typeof ListingType];

export const ListingStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  UNDER_OFFER: 'under_offer',
  UNDER_CONTRACT: 'under_contract',
  SOLD: 'sold',
  LEASED: 'leased',
  WITHDRAWN: 'withdrawn',
} as const;
export type ListingStatus = (typeof ListingStatus)[keyof typeof ListingStatus];

export const SaleMethod = {
  PRIVATE_TREATY: 'private_treaty',
  AUCTION: 'auction',
  TENDER: 'tender',
} as const;
export type SaleMethod = (typeof SaleMethod)[keyof typeof SaleMethod];

export interface PropertyImage {
  id: string;
  property_id: string;
  storage_path: string;
  cdn_url: string;
  caption: string | null;
  sort_order: number;
  is_floor_plan: boolean;
  created_at: string;
}

export interface PropertySummary {
  id: string;
  listing_type: ListingType;
  property_type: PropertyType;
  status: ListingStatus;
  unit_number: string | null;
  street_number: string;
  street_name: string;
  suburb: string;
  state: string;
  postcode: string;
  lat: number | null;
  lng: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  car_spaces: number | null;
  land_size_sqm: number | null;
  price: number | null;
  price_display: string | null;
  is_price_hidden: boolean;
  sale_method: SaleMethod | null;
  headline: string | null;
  images: PropertyImage[];
  agent_id: string;
  agency_id: string;
  published_at: string | null;
  created_at: string;
  virtual_tour_url?: string;
  bhk_config?: string;
  feature_order?: number;
  sold_price_is_confidential?: boolean;
  sold_at?: string | null;
  sold_price?: number | null;
  agent_slug?: string | null;
  under_contract_at?: string;
  next_inspection_at?: string;
  auction_at?: string | null;
}

export interface PropertyDetail extends PropertySummary {
  build_size_sqm: number | null;
  price_min: number | null;
  price_max: number | null;
  description: string | null;
  features: {
    indoor: string[];
    outdoor: string[];
    climate: string[];
  };
  available_from: string | null;
  auction_at: string | null;
  sold_at: string | null;
  sold_price: number | null;
  is_featured: boolean;
  view_count: number;
  enquiry_count: number;
  updated_at: string;
  inspections: Inspection[];
  agent: Agent;
  agency: Agency;
  price_history?: PriceHistoryRecord[];
}

export interface Inspection {
  id: string;
  type: 'open_home' | 'private';
  starts_at: string;
  ends_at: string;
  cancelled: boolean;
}

export interface PropertyMapPin {
  id: string;
  lat: number;
  lng: number;
  price: number | null;
  price_display: string | null;
  property_type: PropertyType;
  listing_type: ListingType;
  bedrooms: number | null;
}
