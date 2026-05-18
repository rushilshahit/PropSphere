import type { Suburb } from '@propsphere/types';
import { formatPrice } from '@propsphere/utils';

interface SuburbStatsProps {
  suburb: Suburb;
}

interface StatBox {
  label: string;
  value: string;
}

export function SuburbStats({ suburb }: SuburbStatsProps) {
  const stats: StatBox[] = [
    {
      label: 'Median sale price',
      value: suburb.median_sale_price ? formatPrice(suburb.median_sale_price) : '—',
    },
    {
      label: 'Median rent/week',
      value: suburb.median_rent_price ? `₹${suburb.median_rent_price.toLocaleString('en-IN')}` : '—',
    },
    {
      label: 'Avg days on market',
      value: suburb.days_on_market_avg != null ? `${suburb.days_on_market_avg} days` : '—',
    },
    {
      label: 'Stats updated',
      value: suburb.stats_updated_at
        ? new Date(suburb.stats_updated_at).toLocaleDateString('en-IN', {
            month: 'short',
            year: 'numeric',
          })
        : '—',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-white rounded-card shadow-card p-4">
          <p className="text-xs text-neutral-500 mb-1">{s.label}</p>
          <p className="text-lg font-bold text-neutral-900 tabular-nums">{s.value}</p>
        </div>
      ))}
    </div>
  );
}
