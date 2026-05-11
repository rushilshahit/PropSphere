import type { ListingType, PropertyType } from './property';

export interface SearchFilters {
  listingType: ListingType;
  query: string;
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  carSpaces?: number;
  propertyTypes: PropertyType[];
  features: string[];
  sortBy: 'newest' | 'price_asc' | 'price_desc';
  page: number;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface BoundingBoxQuery {
  north: number;
  south: number;
  east: number;
  west: number;
  listingType?: ListingType;
  priceMin?: number;
  priceMax?: number;
  bedroomsMin?: number;
}
