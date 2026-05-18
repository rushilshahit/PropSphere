import { Bath, BedDouble, Car, Maximize2, Square } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PropertyDetail } from '@propsphere/types';

interface StatItemProps {
  icon: LucideIcon;
  value: number | string;
  label: string;
}

function StatItem({ icon: Icon, value, label }: StatItemProps) {
  return (
    <div className="flex flex-col items-center gap-1 px-4">
      <div className="flex items-center gap-1.5">
        <Icon className="w-5 h-5 text-neutral-400" />
        <span className="text-2xl font-bold text-neutral-900 tabular-nums">{value}</span>
      </div>
      <span className="text-xs text-neutral-500 uppercase tracking-wide">{label}</span>
    </div>
  );
}

interface PropertyStatsProps {
  property: PropertyDetail;
}

export function PropertyStats({ property }: PropertyStatsProps) {
  const stats = [
    property.bedrooms != null && {
      icon: BedDouble,
      value: property.bhk_config ?? property.bedrooms,
      label: 'Bedrooms',
    },
    property.bathrooms != null && { icon: Bath, value: property.bathrooms, label: 'Bathrooms' },
    property.car_spaces != null && { icon: Car, value: property.car_spaces, label: 'Car spaces' },
    property.land_size_sqm != null && {
      icon: Maximize2,
      value: property.land_size_sqm,
      label: 'Land m²',
    },
    property.build_size_sqm != null && {
      icon: Square,
      value: property.build_size_sqm,
      label: 'Build m²',
    },
  ].filter(Boolean) as StatItemProps[];

  if (!stats.length) return null;

  return (
    <div className="flex flex-wrap items-start divide-x divide-neutral-200 border border-neutral-200 rounded-card py-4 bg-white">
      {stats.map((stat) => (
        <StatItem key={stat.label} {...stat} />
      ))}
    </div>
  );
}
