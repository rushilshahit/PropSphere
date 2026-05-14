import { useNavigate } from 'react-router-dom';
import { formatPrice } from '@propsphere/utils';
import type { SuburbCardData } from '@/api/home';
import { SUBURB_IMAGES, FALLBACK_SUBURB_IMAGE } from '../data/suburb-images';

interface SuburbCardProps {
  suburb: SuburbCardData;
}

export function SuburbCard({ suburb }: SuburbCardProps) {
  const navigate = useNavigate();
  const imageUrl =
    SUBURB_IMAGES[suburb.slug] ?? suburb.heroImageUrl ?? FALLBACK_SUBURB_IMAGE;

  return (
    <article
      className="relative rounded-card overflow-hidden cursor-pointer group aspect-[4/3]"
      onClick={() => navigate(`/buy?q=${encodeURIComponent(suburb.name)}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/buy?q=${encodeURIComponent(suburb.name)}`)}
    >
      <img
        src={imageUrl}
        alt={suburb.name}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
        <p className="text-base font-semibold leading-tight">{suburb.name}</p>
        {suburb.medianSalePrice && (
          <p className="text-sm opacity-80">
            Median {formatPrice(suburb.medianSalePrice)}
          </p>
        )}
        <p className="text-xs opacity-70">{suburb.activeListingCount} properties</p>
      </div>
    </article>
  );
}
