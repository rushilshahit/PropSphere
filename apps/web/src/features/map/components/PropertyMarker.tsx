import { Marker } from 'react-map-gl/maplibre';
import type { PropertyMapPin } from '@propsphere/types';

interface PropertyMarkerProps {
  property: PropertyMapPin;
  isActive: boolean;
  onClick: () => void;
}

export function PropertyMarker({ property, isActive, onClick }: PropertyMarkerProps) {
  return (
    <Marker
      latitude={property.lat}
      longitude={property.lng}
      anchor="bottom"
      onClick={(e: { originalEvent: Event }) => {
        e.originalEvent.stopPropagation();
        onClick();
      }}
    >
      <div
        className={`
          flex items-center justify-center
          rounded-full border-2 px-2 py-1
          text-xs font-bold cursor-pointer whitespace-nowrap
          transition-all duration-150
          ${isActive
            ? 'bg-brand-primary text-white border-brand-primary scale-110'
            : 'bg-white text-brand-primary border-brand-primary'
          }
        `}
      >
        {property.price_display ?? '–'}
      </div>
    </Marker>
  );
}
