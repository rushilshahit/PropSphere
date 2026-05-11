import { TrendingUp } from 'lucide-react';
import { formatPrice } from '@propsphere/utils';

interface SoldHistoryProps {
  soldAt?: string | null;
  soldPrice?: number | null;
}

function formatSoldDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function SoldHistory({ soldAt, soldPrice }: SoldHistoryProps) {
  if (!soldPrice) return null;

  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-card p-4 flex items-center gap-3">
      <TrendingUp className="w-5 h-5 text-neutral-400 shrink-0" />
      <p className="text-sm text-neutral-700">
        Last sold{soldAt ? ` ${formatSoldDate(soldAt)}` : ''} for{' '}
        <span className="font-semibold text-neutral-900">{formatPrice(soldPrice)}</span>
      </p>
    </div>
  );
}
