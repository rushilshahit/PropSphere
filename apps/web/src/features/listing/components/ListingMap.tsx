import { forwardRef, useEffect, useRef, useState } from 'react';
import Map, { Marker, NavigationControl, type MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN } from '@/lib/mapbox';
import { PropertyHousePin } from './PropertyHousePin';

interface ListingMapProps {
  lat: number;
  lng: number;
  address: string;
  selectedPin?: { lat: number; lng: number } | null;
}

export const ListingMap = forwardRef<MapRef, ListingMapProps>(
  ({ lat, lng, selectedPin }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);
    const [layer, setLayer] = useState<'streets' | 'satellite'>('streets');

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 },
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    return (
      <div
        ref={containerRef}
        className="relative h-[400px] rounded-card overflow-hidden border border-neutral-200"
      >
        {inView ? (
          <>
            <Map
              ref={ref}
              mapboxAccessToken={MAPBOX_TOKEN}
              initialViewState={{ longitude: lng, latitude: lat, zoom: 15 }}
              style={{ width: '100%', height: '100%' }}
              mapStyle={
                layer === 'satellite'
                  ? 'mapbox://styles/mapbox/satellite-streets-v12'
                  : 'mapbox://styles/mapbox/light-v11'
              }
              attributionControl={false}
            >
              <NavigationControl position="bottom-right" showCompass={false} />
              <PropertyHousePin lat={lat} lng={lng} />
              {selectedPin && (
                <Marker
                  longitude={selectedPin.lng}
                  latitude={selectedPin.lat}
                  anchor="center"
                >
                  <div className="w-3 h-3 rounded-full bg-teal-600 border-2 border-white shadow" />
                </Marker>
              )}
            </Map>

            <div className="absolute top-3 right-3 z-10 flex rounded overflow-hidden border border-neutral-200 shadow-sm bg-white">
              {(['streets', 'satellite'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setLayer(mode)}
                  className={`text-xs px-3 py-1.5 font-medium capitalize transition-colors ${
                    layer === mode
                      ? 'bg-brand-primary text-white'
                      : 'bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="w-full h-full animate-shimmer" />
        )}
      </div>
    );
  },
);

ListingMap.displayName = 'ListingMap';
