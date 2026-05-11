import { Check } from 'lucide-react';
import type { PropertyDetail } from '@propsphere/types';

interface FeaturesListProps {
  features: PropertyDetail['features'];
}

interface SectionProps {
  title: string;
  items: string[];
}

function Section({ title, items }: SectionProps) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="text-sm font-semibold text-neutral-700 mb-2">{title}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2 text-sm text-neutral-600">
            <Check className="w-3.5 h-3.5 text-brand-secondary shrink-0" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeaturesList({ features }: FeaturesListProps) {
  const hasAny = features.indoor.length || features.outdoor.length || features.climate.length;
  if (!hasAny) return null;

  return (
    <div className="bg-white border border-neutral-200 rounded-card p-5 space-y-5">
      <h3 className="text-base font-semibold text-neutral-900">Property features</h3>
      <Section title="Indoor" items={features.indoor} />
      <Section title="Outdoor" items={features.outdoor} />
      <Section title="Climate & Energy" items={features.climate} />
    </div>
  );
}
