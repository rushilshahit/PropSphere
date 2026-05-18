import { HandCoins, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '@propsphere/utils';
import { useMyOffers } from '@/api/offers';
import { Spinner } from '@/components/ui';

const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  accepted:  'bg-green-100 text-green-700',
  rejected:  'bg-red-100 text-red-700',
  withdrawn: 'bg-neutral-100 text-neutral-500',
};

const STATUS_LABEL: Record<string, string> = {
  pending:   'Pending',
  accepted:  'Accepted',
  rejected:  'Rejected',
  withdrawn: 'Withdrawn',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function OfferHistoryPage() {
  const { data: offers, isLoading } = useMyOffers();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-6">
        <HandCoins className="w-5 h-5 text-neutral-400" />
        <h1 className="text-xl font-bold text-neutral-900">My Offers</h1>
        {offers && offers.length > 0 && (
          <span className="text-sm text-neutral-400">({offers.length})</span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : !offers || offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <HandCoins className="w-12 h-12 text-neutral-300 mb-4" />
          <p className="text-neutral-500 text-sm">
            No offers yet.
            <br />
            Offers you submit on properties will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {offers.map((offer) => (
            <li key={offer.id} className="py-4 flex gap-4">
              <div className="flex-shrink-0 w-16 h-16 rounded-btn overflow-hidden bg-neutral-100">
                {offer.property?.heroImageUrl ? (
                  <img
                    src={offer.property.heroImageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <HandCoins className="w-6 h-6 text-neutral-300" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {offer.property ? (
                      <Link
                        to={`/buy/${offer.property.id}`}
                        className="text-sm font-medium text-neutral-900 hover:text-brand-primary transition-colors truncate block"
                      >
                        {offer.property.headline ??
                          `${offer.property.suburb}, ${offer.property.state}`}
                        <ExternalLink className="inline-block w-3 h-3 ml-1 text-neutral-400" />
                      </Link>
                    ) : (
                      <p className="text-sm font-medium text-neutral-400">
                        Property no longer available
                      </p>
                    )}
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Submitted {formatDate(offer.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-badge ${
                      STATUS_COLOR[offer.status] ?? STATUS_COLOR['pending']
                    }`}
                  >
                    {STATUS_LABEL[offer.status] ?? offer.status}
                  </span>
                </div>
                <p className="text-sm font-bold text-neutral-900 mt-1.5 tabular-nums">
                  {formatPrice(offer.amount)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
