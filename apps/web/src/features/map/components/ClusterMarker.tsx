import { Marker } from 'react-map-gl';

interface ClusterMarkerProps {
  count: number;
  lat: number;
  lng: number;
  onClick: () => void;
}

function getSize(count: number): string {
  if (count < 10) return 'w-8 h-8';
  if (count < 50) return 'w-10 h-10';
  return 'w-12 h-12';
}

export function ClusterMarker({ count, lat, lng, onClick }: ClusterMarkerProps) {
  // TODO Phase 9: add supercluster for true clustering
  return (
    <Marker
      latitude={lat}
      longitude={lng}
      onClick={(e: { originalEvent: Event }) => {
        e.originalEvent.stopPropagation();
        onClick();
      }}
    >
      <div
        className={`
          ${getSize(count)}
          flex items-center justify-center
          bg-neutral-700 text-white text-xs font-bold
          rounded-full border-2 border-white shadow-md
          cursor-pointer
        `}
      >
        {count}
      </div>
    </Marker>
  );
}
