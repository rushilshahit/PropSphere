import { format } from 'date-fns';
import { formatPrice } from '@propsphere/utils';
import type { PropertyDetail } from '@propsphere/types';

interface SoldPricePanelProps {
  property: PropertyDetail;
}

export function SoldPricePanel({ property }: SoldPricePanelProps) {
  const dom =
    property.sold_at && property.published_at
      ? Math.floor(
          (new Date(property.sold_at).getTime() - new Date(property.published_at).getTime()) /
            86_400_000,
        )
      : null;

  const delta =
    property.sold_price && property.price
      ? Math.round(((property.sold_price - property.price) / property.price) * 100)
      : null;

  return (
    <div className="bg-red-600/5 border border-red-600/20 rounded-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-2">
        SOLD {property.sold_at ? format(new Date(property.sold_at), 'd MMM yyyy') : ''}
      </p>

      <p className="text-4xl font-extrabold tabular-nums text-neutral-900">
        {property.sold_price_is_confidential ? (
          <span className="text-2xl text-neutral-500 italic font-normal">Price withheld</span>
        ) : (
          formatPrice(property.sold_price ?? 0)
        )}
      </p>

      <div
        className={`grid gap-3 mt-4 text-center border-t border-neutral-200 pt-4 ${delta !== null ? 'grid-cols-3' : 'grid-cols-2'}`}
      >
        <div>
          <p className="text-lg font-bold text-neutral-900">{dom ?? '—'}</p>
          <p className="text-xs text-neutral-500">Days on market</p>
        </div>
        <div>
          <p className="text-sm font-semibold capitalize text-neutral-900">
            {property.sale_method?.replace(/_/g, ' ') ?? '—'}
          </p>
          <p className="text-xs text-neutral-500">Sale method</p>
        </div>
        {delta !== null && (
          <div>
            <p className={`text-sm font-bold ${delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {delta >= 0 ? '↑' : '↓'}
              {Math.abs(delta)}%
            </p>
            <p className="text-xs text-neutral-500">vs asking</p>
          </div>
        )}
      </div>
    </div>
  );
}
