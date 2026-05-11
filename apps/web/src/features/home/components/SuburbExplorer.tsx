import { useHomeSuburbs } from '@/api/home';
import { Skeleton } from '@/components/ui';
import { SectionHeader } from './SectionHeader';
import { SuburbCard } from './SuburbCard';

export function SuburbExplorer() {
  const { data: suburbs = [], isLoading } = useHomeSuburbs();

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Explore Popular Suburbs"
          subtitle="Discover what's happening in your area"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-card" />
              ))
            : suburbs.map((suburb) => (
                <SuburbCard key={suburb.id} suburb={suburb} />
              ))}
        </div>
      </div>
    </section>
  );
}
