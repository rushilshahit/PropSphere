import { format } from 'date-fns';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatPrice } from '@propsphere/utils';
import { usePriceHistory } from '@/api/properties';
import { Skeleton } from '@/components/ui';

interface PriceHistoryChartProps {
  propertyId: string;
  currentPrice?: number;
}

export function PriceHistoryChart({ propertyId, currentPrice }: PriceHistoryChartProps) {
  const { data: history, isLoading } = usePriceHistory(propertyId);

  if (isLoading) return <Skeleton className="h-[200px] w-full rounded-card" />;

  if (!history?.length) {
    return (
      <p className="text-sm text-neutral-500 italic py-4 text-center">
        No price history recorded for this property.
      </p>
    );
  }

  const chartData = [
    ...history.map((h) => ({
      date: format(new Date(h.sold_date), 'MMM yy'),
      price: h.sold_price,
      method: h.sale_method,
    })),
    ...(currentPrice ? [{ date: 'Current', price: currentPrice, method: null }] : []),
  ];

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#737373' }} />
          <YAxis
            tickFormatter={(v: number) => formatPrice(v)}
            tick={{ fontSize: 10, fill: '#737373' }}
            width={75}
          />
          <Tooltip
            formatter={(value: number) => [formatPrice(value), 'Price']}
            contentStyle={{ borderRadius: '4px', border: '1px solid #E5E5E5', fontSize: 13 }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#DC2626"
            strokeWidth={2}
            dot={{ fill: '#DC2626', r: 5, strokeWidth: 0 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-neutral-400 mt-2 text-right">Source: PropSphere records</p>
    </div>
  );
}
