import { formatPrice } from '@propsphere/utils';
import { useSuburbSoldStats } from '@/api/suburbs';
import { Skeleton } from '@/components/ui';

interface SuburbSoldInsightsProps {
  suburbId: string;
}

export function SuburbSoldInsights({ suburbId }: SuburbSoldInsightsProps) {
  const { data, isLoading } = useSuburbSoldStats(suburbId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-card" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: 'Properties sold (12m)',
      value: data?.totalSales != null ? String(data.totalSales) : '—',
    },
    {
      label: 'Median sold price',
      value: data?.medianSoldPrice ? formatPrice(data.medianSoldPrice) : '—',
    },
    {
      label: 'Clearance rate',
      value: data?.clearanceRate != null ? `${data.clearanceRate}%` : 'N/A',
    },
    {
      label: 'Avg days on market',
      value: data?.avgDaysOnMarket != null ? `${data.avgDaysOnMarket} days` : '—',
    },
  ];

  return (
    <div className="bg-white rounded-card shadow-card p-6">
      <h3 className="text-base font-semibold text-neutral-900 mb-4">Sold insights (12 months)</h3>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="border border-neutral-100 rounded-btn p-4">
            <p className="text-xs text-neutral-500 mb-1">{s.label}</p>
            <p className="text-lg font-bold text-neutral-900 tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
