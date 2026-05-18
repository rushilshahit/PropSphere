import type { PropertySummary } from '@propsphere/types';

export interface ListingBadge {
  label: string;
  className: string;
}

export function deriveBadge(property: PropertySummary): ListingBadge | null {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 86_400_000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);

  if (
    property.sale_method === 'auction' &&
    property.auction_at &&
    new Date(property.auction_at) > now
  ) {
    return { label: 'Auction', className: 'bg-brand-accent text-white' };
  }

  if (property.status === 'under_contract') {
    return { label: 'Under Offer', className: 'bg-neutral-700 text-white' };
  }

  if (
    property.next_inspection_at &&
    new Date(property.next_inspection_at) > now &&
    new Date(property.next_inspection_at) < sevenDaysFromNow
  ) {
    return { label: 'Inspection', className: 'bg-brand-secondary text-white' };
  }

  if (property.virtual_tour_url) {
    return { label: '360° Tour', className: 'bg-purple-600 text-white' };
  }

  if (
    property.published_at &&
    new Date(property.published_at) > sevenDaysAgo
  ) {
    return { label: 'New', className: 'bg-brand-primary text-white' };
  }

  return null;
}
