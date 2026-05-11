import { Bath, BedDouble, Car, Heart, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PropertySummary } from '@propsphere/types';
import { formatPrice } from '@propsphere/utils';
import { Badge } from '@/components/ui';
import { useSaveProperty } from '@/features/collections/hooks/useSaveProperty';
import { SaveModal } from '@/features/collections/components/SaveModal';

function getBadgeType(property: PropertySummary): Parameters<typeof Badge>[0]['type'] | null {
  if (property.status === 'sold') return 'sold';
  if (property.status === 'under_offer') return 'under_offer';
  if (property.sale_method === 'auction') return 'auction';
  if (property.listing_type === 'rent') return 'rent';
  return null;
}

interface PropertyCardProps {
  property: PropertySummary;
  compact?: boolean;
}

export function PropertyCard({ property, compact = false }: PropertyCardProps) {
  const { isSaved, toggle, saveModalOpen, closeSaveModal } = useSaveProperty(property.id);
  const heroImage = property.images[0];
  const badgeType = getBadgeType(property);
  const address = [
    property.unit_number ? `${property.unit_number}/${property.street_number}` : property.street_number,
    property.street_name,
    property.suburb,
    property.state,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <article className="relative bg-white rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden cursor-pointer group">
        <Link to={`/${property.listing_type}/${property.id}`} className="block">
          {/* Image */}
          <div className="aspect-[4/3] relative overflow-hidden">
            {heroImage ? (
              <img
                src={heroImage.cdn_url}
                alt={property.headline ?? address}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-400 text-sm">
                No image
              </div>
            )}
            {badgeType && (
              <span className="absolute top-3 left-3">
                <Badge type={badgeType} />
              </span>
            )}
            {property.images.length > 1 && (
              <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                {property.images.length} photos
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-xl font-bold tabular-nums text-neutral-900">
              {property.is_price_hidden
                ? 'Contact agent'
                : property.price_display ?? (property.price ? formatPrice(property.price) : 'Contact agent')}
            </p>
            <p className="text-sm text-neutral-700 mt-1 truncate">{address}</p>

            {!compact && (
              <div className="flex items-center gap-3 mt-2 text-sm text-neutral-500">
                {property.bedrooms != null && (
                  <span className="flex items-center gap-1">
                    <BedDouble className="w-4 h-4" />
                    {property.bedrooms}
                  </span>
                )}
                {property.bathrooms != null && (
                  <span className="flex items-center gap-1">
                    <Bath className="w-4 h-4" />
                    {property.bathrooms}
                  </span>
                )}
                {property.car_spaces != null && (
                  <span className="flex items-center gap-1">
                    <Car className="w-4 h-4" />
                    {property.car_spaces}
                  </span>
                )}
                {property.land_size_sqm != null && (
                  <span className="flex items-center gap-1">
                    <Maximize2 className="w-4 h-4" />
                    {property.land_size_sqm}m²
                  </span>
                )}
              </div>
            )}
          </div>
        </Link>

        {/* Save button — outside the Link to prevent navigation */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggle();
          }}
          className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
          aria-label={isSaved ? 'Remove from saved' : 'Save property'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${isSaved ? 'fill-brand-accent text-brand-accent' : 'text-neutral-500'}`}
          />
        </button>
      </article>

      <SaveModal
        propertyId={property.id}
        isOpen={saveModalOpen}
        onClose={closeSaveModal}
      />
    </>
  );
}
