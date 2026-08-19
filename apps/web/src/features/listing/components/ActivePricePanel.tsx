import { Bookmark, Share2 } from 'lucide-react';
import { formatPrice } from '@propsphere/utils';
import type { PropertyDetail } from '@propsphere/types';
import { Button } from '@/components/ui';

interface ActivePricePanelProps {
  property: PropertyDetail;
  isSaved: boolean;
  isAuthenticated: boolean;
  isOwner?: boolean;
  onEnquire: () => void;
  onOffer?: () => void;
  onSave: () => void;
  onShare: () => void;
}

function daysOnMarket(publishedAt: string | null): number {
  if (!publishedAt) return 0;
  return Math.floor((Date.now() - new Date(publishedAt).getTime()) / 86_400_000);
}

export function ActivePricePanel({
  property,
  isSaved,
  isAuthenticated,
  isOwner = false,
  onEnquire,
  onOffer,
  onSave,
  onShare,
}: ActivePricePanelProps) {
  const dom = daysOnMarket(property.published_at);

  const priceLabel = property.is_price_hidden
    ? 'Contact agent'
    : property.price_display ?? (property.price ? formatPrice(property.price) : 'Contact agent');

  return (
    <div className="bg-white border border-neutral-200 rounded-card p-5">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-3xl font-bold text-neutral-900 tabular-nums">{priceLabel}</p>
        {dom > 0 && (
          <span className="shrink-0 text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded-badge font-medium mt-1">
            {dom}d on market
          </span>
        )}
      </div>

      <p className="text-sm text-neutral-500 capitalize mb-4">
        {property.property_type.replace('_', ' ')} · For {property.listing_type}
      </p>

      <div className="flex flex-col gap-2">
        {!isOwner && (
          <Button size="lg" className="w-full" onClick={onEnquire}>
            Enquire now
          </Button>
        )}
        {!isOwner && onOffer && property.listing_type === 'buy' && property.agent_id && (
          <Button variant="secondary" size="lg" className="w-full" onClick={onOffer}>
            Make an offer
          </Button>
        )}
        {isAuthenticated && (
          <Button variant="secondary" size="lg" className="w-full" onClick={onSave}>
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            {isSaved ? 'Saved' : 'Save property'}
          </Button>
        )}
        <Button variant="ghost" size="sm" className="w-full" onClick={onShare}>
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </div>
    </div>
  );
}
