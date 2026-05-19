import { useState } from 'react';
import { Bath, BedDouble, Car, Heart, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PropertySummary } from '@propsphere/types';
import { formatPrice } from '@propsphere/utils';
import { useAppSelector } from '@/store/hooks';
import { selectIsAuthenticated } from '@/features/auth/store/authSlice';
import { useSaveProperty } from '@/features/collections/hooks/useSaveProperty';
import { SaveModal } from '@/features/collections/components/SaveModal';
import { deriveBadge } from '../utils/derive-badge';

function formatSoldDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface PropertyCardProps {
  property: PropertySummary;
  compact?: boolean;
  variant?: 'active' | 'sold';
}

export function PropertyCard({ property, compact = false, variant = 'active' }: PropertyCardProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { isSaved, toggle, saveModalOpen, closeSaveModal } = useSaveProperty(property.id);
  const [imgError, setImgError] = useState(false);
  const heroImage = property.images[0];
  const badge = deriveBadge(property);
  const address = [
    property.unit_number ? `${property.unit_number}/${property.street_number}` : property.street_number,
    property.street_name,
    property.suburb,
    property.state,
  ]
    .filter(Boolean)
    .join(' ');

  const daysOnMarket =
    variant === 'sold' && property.sold_at && property.published_at
      ? Math.floor(
          (new Date(property.sold_at).getTime() - new Date(property.published_at).getTime()) /
            86_400_000,
        )
      : undefined;

  return (
    <>
      <article className="relative bg-white rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden cursor-pointer group">
        <Link to={`/${property.listing_type}/${property.id}`} className="block">
          {/* Image */}
          <div className="aspect-[4/3] relative overflow-hidden">
            {heroImage && heroImage.cdn_url && !imgError ? (
              <img
                src={heroImage.cdn_url}
                alt={property.headline ?? address}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                loading="lazy"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-400 text-sm">
                No image
              </div>
            )}
            {badge && (
              <span
                className={`absolute top-3 left-3 text-[11px] font-bold px-2 py-0.5 rounded-[4px] ${badge.className}`}
              >
                {badge.label}
              </span>
            )}
            {property.images.length > 1 && (
              <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                {property.images.length} photos
              </span>
            )}
            {variant === 'sold' && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-5 -left-6 w-28 text-center text-[11px] font-bold text-white bg-red-600 py-1 transform -rotate-45 shadow-sm">
                  SOLD
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            {variant === 'sold' ? (
              <>
                <p className="text-xl font-bold tabular-nums text-neutral-900">
                  {property.sold_price_is_confidential ? (
                    <span className="text-base text-neutral-500 italic font-normal">
                      Price withheld
                    </span>
                  ) : (
                    formatPrice(property.sold_price ?? 0)
                  )}
                </p>
                {property.sold_at && (
                  <p className="text-xs text-red-600 font-medium mt-0.5">
                    Sold {formatSoldDate(property.sold_at)}
                  </p>
                )}
                {daysOnMarket !== undefined && (
                  <p className="text-xs text-neutral-500 mt-1">{daysOnMarket} days on market</p>
                )}
              </>
            ) : (
              <p className="text-xl font-bold tabular-nums text-neutral-900">
                {property.is_price_hidden
                  ? 'Contact agent'
                  : property.price_display ?? (property.price ? formatPrice(property.price) : 'Contact agent')}
              </p>
            )}
            <p className="text-sm text-neutral-700 mt-1 truncate">{address}</p>

            {!compact && (
              <div className="flex items-center gap-3 mt-2 text-sm text-neutral-500">
                {property.bedrooms != null && (
                  <span className="flex items-center gap-1">
                    <BedDouble className="w-4 h-4" />
                    {property.bhk_config ?? property.bedrooms}
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

        {/* Suburb link — separate element to avoid nested <a> */}
        <div className="px-4 pb-3 -mt-2 flex items-center justify-between">
          <Link
            to={`/suburb/${property.state.toLowerCase()}/${property.suburb.toLowerCase().replace(/\s+/g, '-')}`}
            className="text-xs text-brand-secondary hover:text-brand-accent"
          >
            {property.suburb}
          </Link>
          {variant === 'sold' && property.agent_slug && (
            <Link
              to={`/agent/${property.agent_slug}`}
              className="text-xs text-red-600 font-medium hover:underline"
            >
              View agent →
            </Link>
          )}
        </div>

        {/* Save button — only for active variant, outside the Link to prevent navigation */}
        {variant === 'active' && isAuthenticated && (
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
        )}
      </article>

      <SaveModal
        propertyId={property.id}
        isOpen={saveModalOpen}
        onClose={closeSaveModal}
      />
    </>
  );
}
