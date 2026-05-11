import { Bath, BedDouble, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Popup } from 'react-map-gl';
import type { PropertySummary } from '@propsphere/types';

interface PropertyPopupProps {
  property: PropertySummary;
  onClose: () => void;
}

export function PropertyPopup({ property, onClose }: PropertyPopupProps) {
  const heroImage = property.images[0];
  const address = [
    property.unit_number
      ? `${property.unit_number}/${property.street_number}`
      : property.street_number,
    property.street_name,
    property.suburb,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Popup
      latitude={property.lat ?? 0}
      longitude={property.lng ?? 0}
      offset={20}
      onClose={onClose}
      closeButton={false}
      closeOnClick={false}
      className="!p-0 !max-w-none"
    >
      <div className="w-[240px] bg-white rounded-card overflow-hidden shadow-card">
        <div className="aspect-[4/3] relative overflow-hidden bg-neutral-100">
          {heroImage ? (
            <img
              src={heroImage.cdn_url}
              alt={address}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
              No image
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
            aria-label="Close popup"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        <div className="p-3">
          <p className="text-base font-bold text-neutral-900">
            {property.is_price_hidden
              ? 'Contact agent'
              : property.price_display ?? 'Contact agent'}
          </p>
          <p className="text-xs text-neutral-600 mt-0.5 truncate">{address}</p>

          <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-500">
            {property.bedrooms != null && (
              <span className="flex items-center gap-1">
                <BedDouble className="w-3 h-3" />
                {property.bedrooms}
              </span>
            )}
            {property.bathrooms != null && (
              <span className="flex items-center gap-1">
                <Bath className="w-3 h-3" />
                {property.bathrooms}
              </span>
            )}
          </div>

          <Link
            to={`/${property.listing_type}/${property.id}`}
            className="mt-2 block w-full text-center text-xs font-medium text-brand-primary border border-brand-primary rounded py-1 hover:bg-brand-primary hover:text-white transition-colors"
          >
            View listing
          </Link>
        </div>
      </div>
    </Popup>
  );
}
