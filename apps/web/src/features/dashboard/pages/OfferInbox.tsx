import { formatPrice } from '@propsphere/utils';
import { useAgentOffers, useUpdateOfferStatus } from '@/api/agents';
import { Skeleton } from '@/components/ui';

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  withdrawn: 'bg-neutral-100 text-neutral-500',
};

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-btn" />
      ))}
    </div>
  );
}

export default function OfferInbox() {
  const { data: offers, isLoading } = useAgentOffers();
  const updateStatus = useUpdateOfferStatus();

  function handleAction(id: string, status: 'accepted' | 'rejected') {
    updateStatus.mutate({ id, status });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Offers</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Buyer offers on your listings</p>
      </div>

      {isLoading && <TableSkeleton />}

      {!isLoading && (!offers || offers.length === 0) && (
        <div className="text-center py-16 text-neutral-400">No offers yet.</div>
      )}

      {!isLoading && offers && offers.length > 0 && (
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left">
                <th className="px-4 py-3 font-medium text-neutral-500">Property</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Buyer</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Amount</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Date</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Status</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {offers.map((offer) => (
                <tr key={offer.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-4 py-3">
                    {offer.property ? (
                      <p className="font-medium text-neutral-900 line-clamp-1">
                        {offer.property.headline ?? `${offer.property.suburb}, ${offer.property.state.toUpperCase()}`}
                      </p>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-800">{offer.sender_name}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{offer.sender_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-neutral-900 tabular-nums">
                      {formatPrice(offer.amount)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                    {new Date(offer.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_BADGE[offer.status] ?? 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {offer.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {offer.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleAction(offer.id, 'accepted')}
                          disabled={updateStatus.isPending}
                          className="text-xs text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction(offer.id, 'rejected')}
                          disabled={updateStatus.isPending}
                          className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
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
