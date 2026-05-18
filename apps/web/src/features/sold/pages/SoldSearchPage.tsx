import { useEffect, useRef, useState } from 'react';
import { useSoldSearch } from '@/api/properties';
import { Button, Skeleton } from '@/components/ui';
import { PropertyCard } from '@/features/search/components/PropertyCard';
import { cn } from '@/lib/cn';
import { SoldFilterPanel } from '../components/SoldFilterPanel';
import { DEFAULT_SOLD_FILTERS, type SoldFiltersState } from '../types';

const SORT_OPTIONS = [
  { label: 'Most recent', value: 'newest' },
  { label: 'Price high–low', value: 'price_desc' },
  { label: 'Price low–high', value: 'price_asc' },
  { label: 'Days on market', value: 'days_asc' },
] as const;

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

export default function SoldSearchPage() {
  const [filters, setFilters] = useState<SoldFiltersState>(DEFAULT_SOLD_FILTERS);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  function handleFilterChange(patch: Partial<SoldFiltersState>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  function handleReset() {
    setFilters(DEFAULT_SOLD_FILTERS);
  }

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useSoldSearch({ ...filters, page: 1 });

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Sold Properties</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Browse recently sold properties to understand market prices.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Filter sidebar — desktop */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="bg-white rounded-card shadow-card p-5 sticky top-24">
            <h2 className="text-sm font-semibold text-neutral-900 mb-4">Filters</h2>
            <SoldFilterPanel
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleReset}
            />
          </div>
        </aside>

        {/* Results */}
        <main className="flex-1 min-w-0">
          {/* Sort + count bar */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-neutral-500">
              <span className="font-semibold text-neutral-900">{total.toLocaleString()}</span>{' '}
              {total === 1 ? 'property' : 'properties'} sold
            </p>
            <div className="flex gap-1">
              {SORT_OPTIONS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleFilterChange({ sortBy: value })}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-btn border transition-all',
                    filters.sortBy === value
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-neutral-600 border-neutral-300 hover:border-red-600',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {isError && (
            <div className="text-center py-16 text-neutral-500">
              Something went wrong. Please try again.
            </div>
          )}

          {!isLoading && !isError && allItems.length === 0 && (
            <div className="text-center py-16">
              <p className="text-lg font-medium text-neutral-700 mb-2">No sold properties found</p>
              <p className="text-sm text-neutral-500 mb-6">Try adjusting your filters.</p>
              <Button variant="secondary" onClick={handleReset}>
                Reset filters
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)
              : allItems.map((property) => (
                  <PropertyCard key={property.id} property={property} variant="sold" />
                ))}
          </div>

          <div ref={bottomRef} className="h-4" />

          {isFetchingNextPage && (
            <div className="flex justify-center py-6">
              <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
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
        <Button onClick={() => setShowMobileFilters(true)} className="shadow-modal px-6 bg-red-600 hover:bg-red-700">
          Filters
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
            <SoldFilterPanel
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleReset}
              onClose={() => setShowMobileFilters(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
