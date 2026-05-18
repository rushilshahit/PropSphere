import { formatPrice } from '@propsphere/utils';
import { useSuburbPriceHistory } from '@/api/suburbs';
import { Skeleton } from '@/components/ui';

interface PriceTrendChartProps {
  suburbId: string;
}

const VIEWBOX_W = 600;
const VIEWBOX_H = 120;
const PADDING = 8;

function Sparkline({ points }: { points: { medianPrice: number }[] }) {
  if (points.length < 2) return null;

  const prices = points.map((p) => p.medianPrice);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = PADDING + (i / (points.length - 1)) * (VIEWBOX_W - PADDING * 2);
    const y = PADDING + (1 - (p.medianPrice - min) / range) * (VIEWBOX_H - PADDING * 2);
    return `${x},${y}`;
  });

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      className="w-full h-32"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A56DB" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#1A56DB" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={coords.join(' ')}
        fill="none"
        stroke="#1A56DB"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PriceTrendChart({ suburbId }: PriceTrendChartProps) {
  const { data, isLoading } = useSuburbPriceHistory(suburbId);

  if (isLoading) return <Skeleton className="h-48 w-full rounded-card" />;

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-card shadow-card p-6 text-center text-neutral-400 text-sm">
        No price history available yet.
      </div>
    );
  }

  const first = data[0];
  const last = data[data.length - 1];
  const change = first.medianPrice
    ? Math.round(((last.medianPrice - first.medianPrice) / first.medianPrice) * 100)
    : null;

  return (
    <div className="bg-white rounded-card shadow-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">Median price trend</h3>
          <p className="text-xs text-neutral-500 mt-0.5">{data.length} months of data</p>
        </div>
        {change != null && (
          <span
            className={`text-sm font-semibold px-2 py-0.5 rounded ${
              change >= 0
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {change >= 0 ? '+' : ''}
            {change}%
          </span>
        )}
      </div>

      <Sparkline points={data} />

      <div className="flex justify-between text-xs text-neutral-400 mt-1">
        <span>{first.period}</span>
        <span className="font-medium text-neutral-700">{formatPrice(last.medianPrice)}</span>
        <span>{last.period}</span>
      </div>
    </div>
  );
}
