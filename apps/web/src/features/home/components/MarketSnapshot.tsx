import { useRef, useState, useEffect } from 'react';
import { useHomeStats } from '@/api/home';
import { useCountUp } from '../hooks/useCountUp';

interface StatBoxProps {
  value: number;
  label: string;
  enabled: boolean;
}

function StatBox({ value, label, enabled }: StatBoxProps) {
  const count = useCountUp(value, 1200, enabled);
  return (
    <div className="py-5 px-6 text-center">
      <p className="text-3xl font-bold tabular-nums text-brand-primary">
        {count.toLocaleString('en-IN')}
      </p>
      <p className="text-sm text-neutral-500 mt-1">{label}</p>
    </div>
  );
}

export function MarketSnapshot() {
  const { data: stats } = useHomeStats();
  const [enabled, setEnabled] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEnabled(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="bg-white border-b border-neutral-200"
    >
      <div className="grid grid-cols-3 divide-x divide-neutral-200 max-w-4xl mx-auto">
        <StatBox
          value={stats?.forSaleCount ?? 0}
          label="Properties for sale"
          enabled={enabled}
        />
        <StatBox
          value={stats?.forRentCount ?? 0}
          label="Properties for rent"
          enabled={enabled}
        />
        <StatBox
          value={stats?.soldLast30 ?? 0}
          label="Sold last 30 days"
          enabled={enabled}
        />
      </div>
    </div>
  );
}
