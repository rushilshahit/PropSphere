import { Bell, BellOff, Search, Trash2 } from 'lucide-react';
import type { AlertFrequency, SavedSearch } from '@propsphere/types';
import { useSavedSearches, useUpdateSavedSearch, useDeleteSavedSearch } from '@/api/notifications';
import { Button, Skeleton } from '@/components/ui';
import { useToast } from '@/components/providers/ToastProvider';

const FREQ_LABELS: Record<AlertFrequency, string> = {
  instant: 'Instant',
  daily: 'Daily',
  weekly: 'Weekly',
};

function filterSummary(search: SavedSearch): string {
  const parts: string[] = [];
  const f = search.filters;

  const type = f.listingType === 'buy' ? 'Buy' : f.listingType === 'rent' ? 'Rent' : 'Sold';
  parts.push(type);

  if (f.query) parts.push(f.query);

  if (f.priceMin !== undefined && f.priceMax !== undefined) {
    parts.push(`₹${formatShort(f.priceMin)}–₹${formatShort(f.priceMax)}`);
  } else if (f.priceMin !== undefined) {
    parts.push(`₹${formatShort(f.priceMin)}+`);
  } else if (f.priceMax !== undefined) {
    parts.push(`up to ₹${formatShort(f.priceMax)}`);
  }

  if (f.bedrooms !== undefined) parts.push(`${f.bedrooms}+ beds`);

  if (f.propertyTypes.length > 0) {
    parts.push(f.propertyTypes.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join('/'));
  }

  return parts.join(' · ');
}

function formatShort(n: number): string {
  if (n >= 1_00_00_000) return `${(n / 1_00_00_000).toFixed(1)}Cr`;
  if (n >= 1_00_000) return `${(n / 1_00_000).toFixed(0)}L`;
  return n.toLocaleString('en-IN');
}

function SearchRow({ search }: { search: SavedSearch }) {
  const { toast } = useToast();
  const { mutate: updateSearch, isPending: isUpdating } = useUpdateSavedSearch();
  const { mutate: deleteSearch, isPending: isDeleting } = useDeleteSavedSearch();

  function handleToggleAlert() {
    updateSearch(
      { id: search.id, alertEnabled: !search.alert_enabled },
      { onSuccess: () => toast(search.alert_enabled ? 'Alert disabled' : 'Alert enabled', 'success') },
    );
  }

  function handleDelete() {
    deleteSearch(search.id, {
      onSuccess: () => toast('Search deleted', 'success'),
    });
  }

  return (
    <div className="flex items-start gap-4 p-4 bg-white rounded-card shadow-card hover:shadow-card-hover transition-shadow">
      <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
        <Search className="w-5 h-5 text-brand-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-neutral-900 truncate">{search.name}</p>
          <span className="flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-badge bg-neutral-100 text-neutral-600">
            {FREQ_LABELS[search.alert_freq]}
          </span>
          {search.alert_enabled && (
            <span className="flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-badge bg-brand-primary/10 text-brand-primary">
              Active
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-500 truncate">{filterSummary(search)}</p>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={handleToggleAlert}
          disabled={isUpdating}
          title={search.alert_enabled ? 'Disable alert' : 'Enable alert'}
          className="p-2 rounded-btn text-neutral-400 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors disabled:opacity-50"
        >
          {search.alert_enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          title="Delete search"
          className="p-2 rounded-btn text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function SavedSearchesPage() {
  const { data: searches, isLoading, isError } = useSavedSearches();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Saved searches</h1>
        <p className="text-sm text-neutral-500 mt-1">Get notified when new matching listings appear.</p>
      </div>

      {isError && (
        <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-card shadow-card">
              <Skeleton height="40px" width="40px" className="rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton height="16px" width="40%" />
                <Skeleton height="12px" width="60%" />
              </div>
            </div>
          ))}
        </div>
      ) : !searches?.length ? (
        <div className="text-center py-16 bg-white rounded-card shadow-card">
          <Bell className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-base font-medium text-neutral-700 mb-1">No saved searches yet</p>
          <p className="text-sm text-neutral-500">
            Save a search from the results page to get alerted about new listings.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {searches.map((search) => (
            <SearchRow key={search.id} search={search} />
          ))}
        </div>
      )}
    </div>
  );
}
