import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  MessageSquare,
  Clock,
  Mail,
  ExternalLink,
  Building2,
  UserPlus,
  X,
} from 'lucide-react';
import {
  useMyOwnerListings,
  useOwnerListingStats,
  useOwnerListingEnquiries,
  usePendingInvitation,
  useCancelInvitation,
} from '@/api/owner-listings';
import { InviteAgentModal } from '@/features/owner-listing/components/InviteAgentModal';
import { Skeleton, Spinner } from '@/components/ui';

const ENQUIRY_STATUS_COLOR: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700',
  read: 'bg-neutral-100 text-neutral-600',
  replied: 'bg-green-50 text-green-700',
  archived: 'bg-neutral-100 text-neutral-400',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-card shadow-card p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-btn bg-brand-primary/10 flex items-center justify-center text-brand-primary flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-neutral-900 tabular-nums">{value}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function MyListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const listingId = id ?? '';
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: listings } = useMyOwnerListings();
  const { data: stats, isLoading: statsLoading } = useOwnerListingStats(listingId);
  const { data: enquiries, isLoading: enquiriesLoading } = useOwnerListingEnquiries(listingId);
  const { data: pendingInvitation } = usePendingInvitation(listingId);
  const { mutate: cancelInvitation, isPending: cancelling } = useCancelInvitation();

  const listing = listings?.find((l) => l.id === listingId);

  const address = listing
    ? [
        listing.unit_number
          ? `${listing.unit_number}/${listing.street_number}`
          : listing.street_number,
        listing.street_name,
        listing.suburb,
        listing.state.toUpperCase(),
        listing.postcode,
      ]
        .filter(Boolean)
        .join(' ')
    : '';

  return (
    <>
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back + title */}
      <div>
        <Link
          to="/account/my-listings"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          My Listings
        </Link>
        {listing ? (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-neutral-900 leading-tight">
                {listing.headline ?? address}
              </h1>
              <p className="text-sm text-neutral-500 mt-0.5">{address}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {listing.status === 'active' && !pendingInvitation && (
                <button
                  type="button"
                  onClick={() => setInviteOpen(true)}
                  className="flex items-center gap-1 text-sm font-medium text-brand-primary hover:text-brand-primary/80 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Invite an Agent
                </button>
              )}
              <Link
                to={`/${listing.listing_type}/${listing.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                View on site
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <Skeleton className="h-7 w-64 rounded" />
        )}
      </div>

      {/* Pending invitation strip */}
      {pendingInvitation && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-btn">
          <p className="text-sm text-amber-800">
            <span className="font-medium">Invitation pending</span>
            {pendingInvitation.agent_name && (
              <span className="text-amber-700"> — sent to {pendingInvitation.agent_name}</span>
            )}
          </p>
          <button
            type="button"
            onClick={() => cancelInvitation(pendingInvitation.id)}
            disabled={cancelling}
            className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-40 transition-colors flex-shrink-0"
          >
            {cancelling ? <Spinner size="sm" /> : <X className="w-3.5 h-3.5" />}
            Cancel invitation
          </button>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        {statsLoading ? (
          <>
            <Skeleton className="h-20 rounded-card" />
            <Skeleton className="h-20 rounded-card" />
            <Skeleton className="h-20 rounded-card" />
          </>
        ) : stats ? (
          <>
            <StatCard icon={<Eye className="w-5 h-5" />} label="Total views" value={stats.view_count} />
            <StatCard icon={<MessageSquare className="w-5 h-5" />} label="Enquiries received" value={stats.enquiry_count} />
            <StatCard icon={<Clock className="w-5 h-5" />} label="Days listed" value={stats.days_listed} />
          </>
        ) : null}
      </div>

      {/* Enquiries timeline */}
      <div>
        <h2 className="text-base font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-neutral-400" />
          Enquiries
          {enquiries && enquiries.length > 0 && (
            <span className="text-sm font-normal text-neutral-400">({enquiries.length})</span>
          )}
        </h2>

        {enquiriesLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : !enquiries || enquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-card shadow-card">
            <Building2 className="w-10 h-10 text-neutral-300 mb-3" />
            <p className="text-sm text-neutral-500">No enquiries yet.</p>
            <p className="text-xs text-neutral-400 mt-1">Enquiries from buyers will appear here.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {enquiries.map((enq) => (
              <li
                key={enq.id}
                className="bg-white rounded-card shadow-card p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{enq.sender_name}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{formatDate(enq.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-badge capitalize ${
                        ENQUIRY_STATUS_COLOR[enq.status] ?? ENQUIRY_STATUS_COLOR['read']
                      }`}
                    >
                      {enq.status}
                    </span>
                    <a
                      href={`mailto:${enq.sender_email}?subject=Re: Your enquiry on ${encodeURIComponent(address)}`}
                      className="flex items-center gap-1 text-xs font-medium text-brand-primary hover:text-brand-primary/80 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Reply
                    </a>
                  </div>
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed">{enq.message}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-neutral-400">
                  <span>{enq.sender_email}</span>
                  {enq.sender_phone && <span>{enq.sender_phone}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>

    <InviteAgentModal
      isOpen={inviteOpen}
      onClose={() => setInviteOpen(false)}
      listingId={listingId}
      listingAddress={address}
    />
    </>
  );
}
