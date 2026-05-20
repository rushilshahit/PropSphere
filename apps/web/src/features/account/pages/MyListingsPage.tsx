import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ExternalLink, Eye, MessageSquare, Clock, Plus, UserPlus } from 'lucide-react';
import { formatPrice } from '@propsphere/utils';
import {
  useMyOwnerListings,
  useUpdateOwnerListingStatus,
  useDeleteOwnerListing,
  type OwnerListing,
} from '@/api/owner-listings';
import { InviteAgentModal } from '@/features/owner-listing/components/InviteAgentModal';
import { Skeleton } from '@/components/ui';

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  withdrawn: 'bg-red-100 text-red-700',
  sold: 'bg-blue-100 text-blue-700',
  leased: 'bg-purple-100 text-purple-700',
};

function daysListed(publishedAt: string | null): string {
  if (!publishedAt) return '—';
  const days = Math.ceil((Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24));
  return `${days}d`;
}

function formatAddress(listing: OwnerListing): string {
  const parts = [
    listing.unit_number ? `${listing.unit_number}/${listing.street_number}` : listing.street_number,
    listing.street_name,
  ];
  return parts.filter(Boolean).join(' ');
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-btn" />
      ))}
    </div>
  );
}

export default function MyListingsPage() {
  const { data: listings, isLoading } = useMyOwnerListings();
  const updateStatus = useUpdateOwnerListingStatus();
  const deleteListing = useDeleteOwnerListing();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [inviteListing, setInviteListing] = useState<OwnerListing | null>(null);

  function handleMarkSold(id: string) {
    updateStatus.mutate({ id, status: 'sold' });
  }

  function handleMarkLeased(id: string) {
    updateStatus.mutate({ id, status: 'leased' });
  }

  function handleDeactivate(id: string) {
    updateStatus.mutate({ id, status: 'withdrawn' });
  }

  function handleReactivate(id: string) {
    updateStatus.mutate({ id, status: 'active' });
  }

  function handleDeleteConfirm(id: string) {
    deleteListing.mutate(id);
    setConfirmDelete(null);
  }

  const isEmpty = !isLoading && (!listings || listings.length === 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-neutral-400" />
          <h1 className="text-xl font-bold text-neutral-900">My Listings</h1>
          {listings && listings.length > 0 && (
            <span className="text-sm text-neutral-400">({listings.length})</span>
          )}
        </div>
        <Link
          to="/post-property"
          className="flex items-center gap-1.5 text-sm font-medium bg-brand-primary text-white px-4 py-2 rounded-btn hover:bg-brand-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Post property
        </Link>
      </div>

      {isLoading && <TableSkeleton />}

      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Building2 className="w-12 h-12 text-neutral-300 mb-4" />
          <p className="text-neutral-500 text-sm mb-4">
            You haven't posted any properties yet.
          </p>
          <Link
            to="/post-property"
            className="flex items-center gap-1.5 text-sm font-medium bg-brand-primary text-white px-5 py-2.5 rounded-btn hover:bg-brand-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Post your first property
          </Link>
        </div>
      )}

      <InviteAgentModal
        isOpen={inviteListing !== null}
        onClose={() => setInviteListing(null)}
        listingId={inviteListing?.id ?? ''}
        listingAddress={inviteListing ? formatAddress(inviteListing) + ', ' + inviteListing.suburb : ''}
      />

      {!isLoading && listings && listings.length > 0 && (
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left bg-neutral-50">
                <th className="px-4 py-3 font-medium text-neutral-500">Property</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Status</th>
                <th className="px-4 py-3 font-medium text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    Views
                  </span>
                </th>
                <th className="px-4 py-3 font-medium text-neutral-500">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Enquiries
                  </span>
                </th>
                <th className="px-4 py-3 font-medium text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Days
                  </span>
                </th>
                <th className="px-4 py-3 font-medium text-neutral-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      to={`/account/my-listings/${listing.id}`}
                      className="font-medium text-neutral-900 hover:text-brand-primary transition-colors line-clamp-1 block"
                    >
                      {listing.headline ?? formatAddress(listing)}
                    </Link>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {formatAddress(listing)}, {listing.suburb} {listing.state.toUpperCase()} {listing.postcode}
                    </p>
                    <p className="text-xs font-medium text-neutral-600 mt-0.5">
                      {listing.price
                        ? formatPrice(listing.price)
                        : listing.price_display ?? 'Price on request'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        STATUS_BADGE[listing.status] ?? 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {listing.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-neutral-700">
                    {listing.view_count ?? 0}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-neutral-700">
                    {listing.enquiry_count ?? 0}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-neutral-500">
                    {daysListed(listing.published_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Link
                        to={`/${listing.listing_type}/${listing.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
                      >
                        View
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      <Link
                        to={`/account/my-listings/${listing.id}`}
                        className="text-xs text-brand-primary hover:text-brand-primary/80 transition-colors"
                      >
                        Details
                      </Link>
                      {listing.status === 'active' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setInviteListing(listing)}
                            className="flex items-center gap-0.5 text-xs text-brand-primary hover:text-brand-primary/80 transition-colors"
                          >
                            <UserPlus className="w-3 h-3" />
                            Invite an agent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkSold(listing.id)}
                            disabled={updateStatus.isPending}
                            className="text-xs text-neutral-500 hover:text-neutral-900 disabled:opacity-40 transition-colors"
                          >
                            Mark sold
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkLeased(listing.id)}
                            disabled={updateStatus.isPending}
                            className="text-xs text-neutral-500 hover:text-neutral-900 disabled:opacity-40 transition-colors"
                          >
                            Mark leased
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeactivate(listing.id)}
                            disabled={updateStatus.isPending}
                            className="text-xs text-neutral-500 hover:text-neutral-900 disabled:opacity-40 transition-colors"
                          >
                            Deactivate
                          </button>
                        </>
                      )}
                      {listing.status === 'withdrawn' && (
                        <button
                          type="button"
                          onClick={() => handleReactivate(listing.id)}
                          disabled={updateStatus.isPending}
                          className="text-xs text-brand-primary hover:text-brand-primary/80 disabled:opacity-40 transition-colors"
                        >
                          Reactivate
                        </button>
                      )}
                      {listing.status !== 'active' && (
                        <>
                          {confirmDelete === listing.id ? (
                            <span className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDeleteConfirm(listing.id)}
                                disabled={deleteListing.isPending}
                                className="text-xs text-red-600 hover:text-red-800 disabled:opacity-40 font-medium"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDelete(null)}
                                className="text-xs text-neutral-400 hover:text-neutral-600"
                              >
                                Cancel
                              </button>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(listing.id)}
                              className="text-xs text-red-500 hover:text-red-700 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </div>
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
