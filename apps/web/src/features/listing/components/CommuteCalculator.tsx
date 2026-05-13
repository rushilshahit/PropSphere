import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { Car, Footprints, Bike } from 'lucide-react';
import type { MapRef } from 'react-map-gl';
import { cn } from '@/lib/cn';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useMapboxAutocomplete,
  type GeocodingFeature,
} from '@/features/search/hooks/useMapboxAutocomplete';
import { useDirections } from '../hooks/useDirections';

const MODES = [
  { key: 'driving' as const, icon: Car, label: 'Drive' },
  { key: 'walking' as const, icon: Footprints, label: 'Walk' },
  { key: 'cycling' as const, icon: Bike, label: 'Cycle' },
];

interface CommuteCalculatorProps {
  originLat: number;
  originLng: number;
  mapRef: RefObject<MapRef>;
  className?: string;
}

export function CommuteCalculator({
  originLat,
  originLng,
  mapRef,
  className,
}: CommuteCalculatorProps) {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedDest, setSelectedDest] = useState<GeocodingFeature | null>(null);
  const [activeMode, setActiveMode] = useState<'driving' | 'walking' | 'cycling'>('driving');
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedInput = useDebounce(inputValue, 300);
  const { data: suggestions = [] } = useMapboxAutocomplete(debouncedInput, showDropdown);
  const { data: directions } = useDirections(originLat, originLng, selectedDest, activeMode);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!directions?.geometry || !mapRef.current) return;
    const map = mapRef.current.getMap();

    if (map.getLayer('route')) map.removeLayer('route');
    if (map.getSource('route')) map.removeSource('route');

    map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: directions.geometry },
        properties: {},
      },
    });

    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': activeMode === 'driving' ? '#E5001A' : '#0d9488',
        'line-width': 4,
        'line-opacity': 0.85,
      },
    });

    const coords = directions.geometry;
    const lngs = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 60, maxZoom: 15 },
    );
  }, [directions, activeMode, mapRef]);

  function handleDestSelect(feature: GeocodingFeature) {
    setSelectedDest(feature);
    setInputValue(feature.place_name.split(',')[0]);
    setShowDropdown(false);
  }

  return (
    <div className={cn('bg-white rounded-card border border-neutral-200 p-5', className)}>
      <h3 className="text-base font-semibold text-neutral-900 mb-4">
        How long to get there?
      </h3>

      <div ref={containerRef} className="relative mb-4">
        <input
          type="text"
          placeholder="Enter destination..."
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowDropdown(true);
          }}
          className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
        />

        {showDropdown && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-card shadow-modal border border-neutral-200 overflow-hidden">
            {suggestions.map((s) => {
              const [primary, ...rest] = s.place_name.split(',');
              return (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleDestSelect(s);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
                >
                  <div>
                    <span className="text-sm font-medium text-neutral-900">{primary}</span>
                    {rest.length > 0 && (
                      <span className="text-xs text-neutral-500 ml-1">
                        {rest.join(',')}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {MODES.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveMode(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
              activeMode === key
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50',
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {directions && (
        <div className="flex items-center gap-2 bg-neutral-50 rounded-lg px-4 py-3">
          <span className="text-base font-bold text-neutral-900">{directions.duration}</span>
          <span className="text-neutral-400">·</span>
          <span className="text-sm text-neutral-700">{directions.distance}</span>
        </div>
      )}
    </div>
  );
}
