import { useRecentListings } from '@/api/home';
import { ListingCarousel } from './ListingCarousel';
import { SectionHeader } from './SectionHeader';
import { ViewAllLink } from './ViewAllLink';

export function RecentListings() {
  const { data: listings = [], isLoading } = useRecentListings();

  if (!isLoading && listings.length === 0) return null;

  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().split('T')[0];

  return (
    <section className="py-12 md:py-16 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Just Listed"
          subtitle="Fresh to market in Ahmedabad"
        />
        <ListingCarousel listings={listings} loading={isLoading} />
        <ViewAllLink to={`/buy?since=${sevenDaysAgo}`} label="View all new listings" />
      </div>
    </section>
  );
}
