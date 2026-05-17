import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { APIProvider } from '@vis.gl/react-google-maps';
import type { RefObject } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import { GOOGLE_MAPS_API_KEY } from '@/lib/google-maps';
import { ListingMap } from './ListingMap';
import { StreetViewPanel } from './StreetViewPanel';
import type { NearbyPlace } from '@/api/overpass';

interface StreetViewProps {
  lat: number;
  lng: number;
  address: string;
  mapRef: RefObject<MapRef>;
  selectedPin?: NearbyPlace | null;
}

async function checkStreetViewAvailable(lat: number, lng: number): Promise<boolean> {
  const res = await fetch(`/api/maps/street-view-check?lat=${lat}&lng=${lng}`);
  if (!res.ok) return false;
  const data = (await res.json()) as { available: boolean };
  return data.available;
}

export function StreetView({ lat, lng, address, mapRef, selectedPin }: StreetViewProps) {
  const [activeTab, setActiveTab] = useState<'map' | 'street-view'>('map');
  const [showStreetView, setShowStreetView] = useState(false);

  const { data: svAvailable } = useQuery({
    queryKey: ['street-view-check', lat, lng],
    queryFn: () => checkStreetViewAvailable(lat, lng),
    staleTime: 24 * 60 * 60 * 1000,
    enabled: !!GOOGLE_MAPS_API_KEY,
  });

  function handleTabChange(tab: 'map' | 'street-view') {
    if (tab === 'street-view') setShowStreetView(true);
    setActiveTab(tab);
  }

  const showSvTab = !!GOOGLE_MAPS_API_KEY && !!svAvailable;

  return (
    <div>
      {showSvTab && (
        <div className="flex mb-3 border border-neutral-200 rounded-lg overflow-hidden w-fit shadow-sm">
          {(['map', 'street-view'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-brand-primary text-white'
                  : 'bg-white text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {tab === 'map' ? 'Map' : 'Street View'}
            </button>
          ))}
        </div>
      )}

      {/* Always keep map mounted so mapRef stays valid */}
      <div className={activeTab === 'map' ? 'block' : 'hidden'}>
        <ListingMap
          ref={mapRef}
          lat={lat}
          lng={lng}
          address={address}
          selectedPin={selectedPin ? { lat: selectedPin.lat, lng: selectedPin.lng } : null}
        />
      </div>

      {showStreetView && activeTab === 'street-view' && (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <StreetViewPanel lat={lat} lng={lng} />
        </APIProvider>
      )}
    </div>
  );
}
