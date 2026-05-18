import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { SearchFilters } from '@propsphere/types';
import { usePropertySearch } from '@/api/properties';
import { PropertyCard } from '@/features/search/components/PropertyCard';
import { Skeleton } from '@/components/ui';

interface SuburbListingsProps {
  suburb: string;
  state: string;
}

const BASE_FILTERS: Omit<SearchFilters, 'query'> = {
  listingType: 'buy',
  propertyTypes: [],
  features: [],
  sortBy: 'newest',
  page: 1,
};

export function SuburbListings({ suburb, state }: SuburbListingsProps) {
  const filters: SearchFilters = { ...BASE_FILTERS, query: suburb };
  const { data, isLoading } = usePropertySearch(filters);

  const listings = data?.pages[0]?.items.slice(0, 6) ?? [];

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-7 w-64 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  if (listings.length === 0) return null;

  const viewAllHref = `/buy?query=${encodeURIComponent(suburb)}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-neutral-900">
          Properties for sale in {suburb}, {state.toUpperCase()}
        </h3>
        <Link
          to={viewAllHref}
          className="flex items-center gap-1 text-sm text-brand-primary hover:underline"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((property) => (
          <PropertyCard key={property.id} property={property} compact />
        ))}
      </div>
    </div>
  );
}
