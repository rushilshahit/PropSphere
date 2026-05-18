import { GraduationCap } from 'lucide-react';
import { useNearbyPlaces } from '@/api/overpass';
import { Skeleton } from '@/components/ui';

interface SchoolsListProps {
  suburbId: string;
  lat: number | null;
  lng: number | null;
}

export function SchoolsList({ lat, lng }: SchoolsListProps) {
  const enabled = lat != null && lng != null;
  const { data, isLoading } = useNearbyPlaces(lat ?? 0, lng ?? 0, 'schools');

  if (!enabled) return null;

  if (isLoading) {
    return (
      <div className="bg-white rounded-card shadow-card p-6 space-y-3">
        <Skeleton className="h-5 w-40" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-card shadow-card p-6 text-center text-neutral-400 text-sm">
        No nearby schools found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card shadow-card p-6">
      <h3 className="text-base font-semibold text-neutral-900 mb-4">Nearby schools</h3>
      <ul className="divide-y divide-neutral-100">
        {data.map((school) => (
          <li key={school.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span className="shrink-0 w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-brand-primary" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">{school.name}</p>
              <p className="text-xs text-neutral-500 capitalize">{school.category}</p>
            </div>
            <span className="shrink-0 text-xs text-neutral-400">{school.distanceLabel}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
