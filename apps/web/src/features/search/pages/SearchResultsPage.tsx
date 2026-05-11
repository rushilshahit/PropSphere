import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Bell } from 'lucide-react';
import type { ListingType } from '@propsphere/types';
import { usePropertySearch } from '@/api/properties';
import { Button, Skeleton } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { resetFilters, selectSearchFilters, setListingType } from '../store/searchSlice';
import { FilterPanel } from '../components/FilterPanel';
import { PropertyCard } from '../components/PropertyCard';
import { SearchBar } from '../components/SearchBar';
import { SortControls } from '../components/SortControls';
import { useSearchParamsSync } from '../hooks/useSearchParams';
import { SaveSearchModal } from '@/features/alerts/components/SaveSearchModal';

function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-card shadow-card overflow-hidden">
      <Skeleton height="200px" />
      <div className="p-4 space-y-2">
        <Skeleton height="24px" width="60%" />
        <Skeleton height="16px" width="80%" />
        <Skeleton height="16px" width="40%" />
      </div>
    </div>
  );
}

export function SearchResultsPage() {
  const dispatch = useDispatch();
  const { listingType: routeListingType } = useParams<{ listingType?: string }>();
  const filters = useSelector(selectSearchFilters);
  const { isAuthenticated } = useAuth();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showSaveSearch, setShowSaveSearch] = useState(false);

  // Sync listing type from URL segment on mount
  useEffect(() => {
    const validTypes: ListingType[] = ['buy', 'rent', 'sold'];
    if (routeListingType && validTypes.includes(routeListingType as ListingType)) {
      dispatch(setListingType(routeListingType as ListingType));
    }
  }, [routeListingType, dispatch]);

  // Bidirectional URL ↔ Redux sync
  useSearchParamsSync();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    usePropertySearch(filters);

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  // Infinite scroll trigger
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!bottomRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Search bar + save button */}
      <div className="mb-6 flex items-end gap-3 max-w-2xl">
        <div className="flex-1">
          <SearchBar />
        </div>
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => setShowSaveSearch(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-brand-primary border border-brand-primary rounded-btn hover:bg-brand-primary/5 transition-colors whitespace-nowrap"
          >
            <Bell className="w-4 h-4" />
            Save search
          </button>
        )}
      </div>

      <SaveSearchModal isOpen={showSaveSearch} onClose={() => setShowSaveSearch(false)} />

      <div className="flex gap-6">
        {/* Filter sidebar — desktop */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="bg-white rounded-card shadow-card p-5 sticky top-24">
            <h2 className="text-sm font-semibold text-neutral-900 mb-4">Filters</h2>
            <FilterPanel />
          </div>
        </aside>

        {/* Results */}
        <main className="flex-1 min-w-0">
          <SortControls total={total} />

          {isError && (
            <div className="text-center py-16 text-neutral-500">
              Something went wrong. Please try again.
            </div>
          )}

          {!isLoading && !isError && allItems.length === 0 && (
            <div className="text-center py-16">
              <p className="text-lg font-medium text-neutral-700 mb-2">No properties found</p>
              <p className="text-sm text-neutral-500 mb-6">Try adjusting your filters.</p>
              <Button variant="secondary" onClick={() => dispatch(resetFilters())}>
                Reset filters
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)
              : allItems.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={bottomRef} className="h-4" />

          {isFetchingNextPage && (
            <div className="flex justify-center py-6">
              <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && !hasNextPage && allItems.length > 0 && (
            <p className="text-center text-sm text-neutral-400 py-6">
              All {total} {total === 1 ? 'property' : 'properties'} loaded
            </p>
          )}
        </main>
      </div>

      {/* Mobile filter button */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <Button onClick={() => setShowMobileFilters(true)} className="shadow-modal px-6">
          Filters{filters.listingType && ` · ${filters.listingType}`}
        </Button>
      </div>

      {/* Mobile filter overlay */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-card p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-neutral-900">Filters</h2>
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>
            <FilterPanel onClose={() => setShowMobileFilters(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
