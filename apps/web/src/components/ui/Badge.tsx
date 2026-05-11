import { cn } from '@/lib/cn';

type BadgeType = 'new' | 'auction' | 'price_reduced' | 'under_offer' | 'sold' | 'rent';

const styles: Record<BadgeType, string> = {
  new: 'bg-brand-primary text-white',
  auction: 'bg-brand-accent text-white',
  price_reduced: 'bg-brand-secondary text-white',
  under_offer: 'bg-yellow-500 text-white',
  sold: 'bg-neutral-700 text-white',
  rent: 'bg-brand-secondary text-white',
};

const labels: Record<BadgeType, string> = {
  new: 'New',
  auction: 'Auction',
  price_reduced: 'Price reduced',
  under_offer: 'Under offer',
  sold: 'Sold',
  rent: 'For rent',
};

interface BadgeProps {
  type: BadgeType;
  className?: string;
}

export function Badge({ type, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-block text-xs font-semibold px-2.5 py-1 rounded-badge',
        styles[type],
        className,
      )}
    >
      {labels[type]}
    </span>
  );
}
