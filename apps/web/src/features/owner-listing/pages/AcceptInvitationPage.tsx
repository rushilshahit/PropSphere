import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Home, LayoutDashboard } from 'lucide-react';
import { useInvitationPreview, useAcceptInvitation, useDeclineInvitation } from '@/api/owner-listings';
import { Spinner } from '@/components/ui';

type PageState = 'idle' | 'accepted' | 'declined';

function StatusLayout({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-card shadow-card w-full max-w-md text-center px-8 py-10">
        <div className="flex justify-center mb-4">{icon}</div>
        <h1 className="text-xl font-bold text-neutral-900 mb-2">{title}</h1>
        <p className="text-sm text-neutral-500 leading-relaxed mb-6">{body}</p>
        {children}
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const safeToken = token ?? '';

  const { data: preview, isLoading, error } = useInvitationPreview(safeToken);
  const { mutate: accept, isPending: accepting } = useAcceptInvitation();
  const { mutate: decline, isPending: declining } = useDeclineInvitation();
  const [pageState, setPageState] = useState<PageState>('idle');
  const [declineConfirm, setDeclineConfirm] = useState(false);

  function handleAccept() {
    accept(safeToken, {
      onSuccess: () => setPageState('accepted'),
    });
  }

  function handleDecline() {
    decline(safeToken, {
      onSuccess: () => setPageState('declined'),
    });
  }

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Accepted state (after user clicks Accept)
  if (pageState === 'accepted') {
    return (
      <StatusLayout
        icon={<CheckCircle2 className="w-14 h-14 text-green-500" />}
        title="Invitation accepted"
        body="You are now the managing agent for this listing. You can view and manage it from your dashboard."
      >
        <Link
          to="/dashboard/listings"
          className="inline-flex items-center gap-2 text-sm font-medium bg-brand-primary text-white px-5 py-2.5 rounded-btn hover:bg-brand-primary/90 transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" />
          Go to Dashboard
        </Link>
      </StatusLayout>
    );
  }

  // Declined state (after user clicks Decline)
  if (pageState === 'declined') {
    return (
      <StatusLayout
        icon={<XCircle className="w-14 h-14 text-neutral-400" />}
        title="Invitation declined"
        body="The property owner has been notified. You can close this page."
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to PropSphere
        </Link>
      </StatusLayout>
    );
  }

  // Error states
  if (error || !preview) {
    const msg = error instanceof Error ? error.message : '';
    const isExpired = msg === 'invitation_expired';

    if (isExpired || preview?.status === 'expired') {
      return (
        <StatusLayout
          icon={<Clock className="w-14 h-14 text-amber-400" />}
          title="Invitation expired"
          body="This invitation has expired. Please ask the property owner to send a new invitation."
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to PropSphere
          </Link>
        </StatusLayout>
      );
    }

    return (
      <StatusLayout
        icon={<AlertTriangle className="w-14 h-14 text-neutral-400" />}
        title="Invitation not found"
        body="This invitation link is invalid or has already been used."
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to PropSphere
        </Link>
      </StatusLayout>
    );
  }

  // Already accepted/declined
  if (preview.status === 'accepted') {
    return (
      <StatusLayout
        icon={<CheckCircle2 className="w-14 h-14 text-green-500" />}
        title="Already accepted"
        body="This invitation has already been accepted."
      >
        <Link
          to="/dashboard/listings"
          className="inline-flex items-center gap-2 text-sm font-medium bg-brand-primary text-white px-5 py-2.5 rounded-btn hover:bg-brand-primary/90 transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" />
          Go to Dashboard
        </Link>
      </StatusLayout>
    );
  }

  if (preview.status === 'declined' || preview.status === 'cancelled') {
    return (
      <StatusLayout
        icon={<XCircle className="w-14 h-14 text-neutral-400" />}
        title={preview.status === 'cancelled' ? 'Invitation cancelled' : 'Invitation declined'}
        body={
          preview.status === 'cancelled'
            ? 'The property owner has cancelled this invitation.'
            : 'This invitation has already been declined.'
        }
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to PropSphere
        </Link>
      </StatusLayout>
    );
  }

  // Active invitation — main accept/decline UI
  const { property, owner_name: ownerName, message } = preview;
  const expiresIn = Math.ceil(
    (new Date(preview.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-card shadow-card w-full max-w-md">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-neutral-100">
          <p className="text-xs font-medium text-brand-primary uppercase tracking-wide mb-1">
            Agent Invitation
          </p>
          <h1 className="text-xl font-bold text-neutral-900">
            {ownerName ? `${ownerName} has invited you` : 'You have been invited'}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            to manage the following listing
          </p>
        </div>

        {/* Property details */}
        <div className="px-6 py-4 border-b border-neutral-100">
          <div className="bg-neutral-50 rounded-btn p-4">
            <p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">Property</p>
            <p className="text-sm font-semibold text-neutral-900 leading-snug">
              {property.headline ?? property.address}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {property.suburb}, {property.state.toUpperCase()}
            </p>
            <span className="inline-flex mt-2 px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full capitalize">
              {property.listing_type}
            </span>
          </div>

          {message && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-btn">
              <p className="text-xs font-medium text-amber-700 mb-0.5">Message from owner</p>
              <p className="text-sm text-neutral-700 leading-relaxed">{message}</p>
            </div>
          )}

          <p className="text-xs text-neutral-400 mt-3 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Expires in {expiresIn} day{expiresIn !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4">
          {!declineConfirm ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAccept}
                disabled={accepting || declining}
                className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium bg-brand-primary text-white py-2.5 rounded-btn hover:bg-brand-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {accepting && <Spinner size="sm" />}
                Accept &amp; become managing agent
              </button>
              <button
                type="button"
                onClick={() => setDeclineConfirm(true)}
                disabled={accepting || declining}
                className="text-sm font-medium text-neutral-500 hover:text-neutral-900 disabled:opacity-40 transition-colors"
              >
                Decline
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-neutral-600">Are you sure you want to decline this invitation?</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDecline}
                  disabled={declining}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium bg-red-600 text-white py-2.5 rounded-btn hover:bg-red-700 disabled:opacity-40 transition-colors"
                >
                  {declining && <Spinner size="sm" />}
                  Yes, decline
                </button>
                <button
                  type="button"
                  onClick={() => setDeclineConfirm(false)}
                  className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  Go back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
