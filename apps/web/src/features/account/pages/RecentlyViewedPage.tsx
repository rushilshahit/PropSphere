import { Clock, History } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useClearRecentlyViewed, useRecentlyViewed } from '@/api/account';
import { useBatchProperties } from '@/api/properties';
import { PropertyCard } from '@/features/search/components/PropertyCard';
import { Spinner } from '@/components/ui';

function useRecentlyViewedProperties() {
  const { user } = useAuth();

  const localIds: string[] = JSON.parse(localStorage.getItem('rv') ?? '[]') as string[];

  const { data: dbHistory } = useRecentlyViewed(!!user);

  const allIds = user
    ? [...new Set([...(dbHistory?.map((r) => r.propertyId) ?? []), ...localIds])].slice(0, 20)
    : localIds;

  const { data: properties, isLoading } = useBatchProperties(allIds);

  return { properties: properties ?? [], allIds, isLoading };
}

export default function RecentlyViewedPage() {
  const { user } = useAuth();
  const { properties, allIds, isLoading } = useRecentlyViewedProperties();
  const clearRecentlyViewed = useClearRecentlyViewed();

  function handleClearHistory() {
    localStorage.removeItem('rv');
    if (user) {
      clearRecentlyViewed.mutate();
    } else {
      window.location.reload();
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-neutral-400" />
          <h1 className="text-xl font-bold text-neutral-900">Recently Viewed</h1>
          {allIds.length > 0 && (
            <span className="text-sm text-neutral-400">({allIds.length})</span>
          )}
        </div>
        {allIds.length > 0 && (
          <button
            type="button"
            onClick={handleClearHistory}
            className="text-sm text-neutral-400 hover:text-red-500 transition-colors"
          >
            Clear history
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <History className="w-12 h-12 text-neutral-300 mb-4" />
          <p className="text-neutral-500 text-sm">
            No recently viewed properties.
            <br />
            Start browsing and they'll appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
