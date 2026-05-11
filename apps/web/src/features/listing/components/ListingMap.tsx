import { useEffect, useRef, useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

interface ListingMapProps {
  lat: number;
  lng: number;
  address: string;
}

export function ListingMap({ lat, lng, address }: ListingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMapReady(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-[400px] rounded-card overflow-hidden border border-neutral-200">
      {mapReady ? (
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{ longitude: lng, latitude: lat, zoom: 14 }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          scrollZoom={false}
        >
          <Marker
            latitude={lat}
            longitude={lng}
            anchor="bottom"
            onClick={() => setPopupOpen(true)}
          >
            <div className="w-5 h-5 bg-brand-primary rounded-full border-2 border-white shadow-md cursor-pointer" />
          </Marker>

          {popupOpen && (
            <Popup
              latitude={lat}
              longitude={lng}
              offset={14}
              onClose={() => setPopupOpen(false)}
              closeOnClick={false}
            >
              <p className="text-sm font-medium text-neutral-900 max-w-[180px]">{address}</p>
            </Popup>
          )}
        </Map>
      ) : (
        <div className="w-full h-full bg-neutral-100 animate-pulse" />
      )}
    </div>
  );
}
