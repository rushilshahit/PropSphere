import { useState } from 'react';
import { GraduationCap, Bus, Coffee, HeartPulse, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useNearbyPlaces, type NearbyType, type NearbyPlace } from '@/api/overpass';

const TABS: { key: NearbyType; icon: LucideIcon; label: string }[] = [
  { key: 'schools', icon: GraduationCap, label: 'Schools' },
  { key: 'transport', icon: Bus, label: 'Transport' },
  { key: 'cafes', icon: Coffee, label: 'Shops' },
  { key: 'health', icon: HeartPulse, label: 'Health' },
];

interface NearbyPlacesProps {
  lat: number;
  lng: number;
  onPlaceSelect: (place: NearbyPlace) => void;
  className?: string;
}

function PlacesList({
  lat,
  lng,
  type,
  onSelect,
}: {
  lat: number;
  lng: number;
  type: NearbyType;
  onSelect: (place: NearbyPlace) => void;
}) {
  const { data: places = [], isLoading } = useNearbyPlaces(lat, lng, type);
  const tab = TABS.find((t) => t.key === type)!;
  const Icon = tab.icon;

  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 animate-shimmer rounded-lg" />
        ))}
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <p className="text-sm text-neutral-500 py-6 text-center">
        No {tab.label.toLowerCase()} found within 1.5 km
      </p>
    );
  }

  return (
    <ul>
      {places.map((place) => (
        <li
          key={place.id}
          className="flex items-center gap-3 py-2.5 border-b border-neutral-100 last:border-0 cursor-pointer hover:bg-neutral-50 rounded px-2 transition-colors"
          onClick={() => onSelect(place)}
        >
          <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">{place.name}</p>
            <p className="text-xs text-neutral-500 capitalize">{place.category}</p>
          </div>
          <span className="text-xs font-medium text-neutral-500 shrink-0">
            {place.distanceLabel}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function NearbyPlaces({ lat, lng, onPlaceSelect, className }: NearbyPlacesProps) {
  const [activeTab, setActiveTab] = useState<NearbyType>('schools');

  return (
    <div className={cn('bg-white rounded-card border border-neutral-200 p-5', className)}>
      <h3 className="text-base font-semibold text-neutral-900 mb-4">What's nearby</h3>

      <div className="flex gap-1 mb-4 flex-wrap">
        {TABS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              activeTab === key
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50',
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <PlacesList lat={lat} lng={lng} type={activeTab} onSelect={onPlaceSelect} />
    </div>
  );
}
