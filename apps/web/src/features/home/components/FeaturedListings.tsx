import { useFeaturedListings } from '@/api/home';
import { ListingCarousel } from './ListingCarousel';
import { SectionHeader } from './SectionHeader';
import { ViewAllLink } from './ViewAllLink';

export function FeaturedListings() {
  const { data: listings = [], isLoading } = useFeaturedListings();

  if (!isLoading && listings.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Featured Properties"
          subtitle="Hand-picked listings from our agents"
        />
        <ListingCarousel listings={listings} loading={isLoading} featuredBadge />
        <ViewAllLink to="/buy" label="View all properties" />
      </div>
    </section>
  );
}
