import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { formatPrice } from '@propsphere/utils';
import { useAgentListings, useUpdateListingStatus } from '@/api/agents';
import { Skeleton, Button } from '@/components/ui';

const STATUS_TABS = [
  { label: 'All', value: undefined },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Under Offer', value: 'under_offer' },
  { label: 'Sold', value: 'sold' },
] as const;

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-neutral-100 text-neutral-600',
  under_offer: 'bg-yellow-100 text-yellow-700',
  under_contract: 'bg-orange-100 text-orange-700',
  sold: 'bg-blue-100 text-blue-700',
  leased: 'bg-purple-100 text-purple-700',
  withdrawn: 'bg-red-100 text-red-700',
};

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-btn" />
      ))}
    </div>
  );
}

export default function ListingManagement() {
  const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);
  const { data: listings, isLoading } = useAgentListings(activeStatus);
  const updateStatus = useUpdateListingStatus();

  function handleStatusChange(id: string, status: string) {
    updateStatus.mutate({ id, status });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Listings</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Manage your property listings</p>
        </div>
        <Link to="/dashboard/listings/new">
          <Button className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            Create listing
          </Button>
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 border-b border-neutral-200">
        {STATUS_TABS.map(({ label, value }) => (
          <button
            key={label}
            type="button"
            onClick={() => setActiveStatus(value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeStatus === value
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && <TableSkeleton />}

      {!isLoading && listings && listings.length === 0 && (
        <div className="text-center py-16 text-neutral-400">
          No listings found.{' '}
          <Link to="/dashboard/listings/new" className="text-brand-primary hover:underline">
            Create your first listing.
          </Link>
        </div>
      )}

      {!isLoading && listings && listings.length > 0 && (
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left">
                <th className="px-4 py-3 font-medium text-neutral-500">Address</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Type</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Price</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Status</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Published</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900 line-clamp-1">
                      {listing.headline ?? `${listing.suburb}, ${listing.state.toUpperCase()}`}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {listing.suburb}, {listing.state.toUpperCase()} {listing.postcode}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 capitalize">
                    {listing.listing_type}
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900 tabular-nums">
                    {listing.price ? formatPrice(listing.price) : listing.price_display ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_BADGE[listing.status] ?? 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {listing.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {listing.published_at
                      ? new Date(listing.published_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {listing.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(listing.id, 'withdrawn')}
                        disabled={updateStatus.isPending}
                        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                      >
                        Withdraw
                      </button>
                    )}
                    {listing.status === 'draft' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(listing.id, 'active')}
                        disabled={updateStatus.isPending}
                        className="text-xs text-brand-primary hover:text-brand-primary/80 disabled:opacity-50"
                      >
                        Publish
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
