import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PropertySummary } from '@propsphere/types';
import { Skeleton } from '@/components/ui';
import { PropertyCard } from '@/features/search/components/PropertyCard';

interface ListingCarouselProps {
  listings: PropertySummary[];
  loading?: boolean;
  featuredBadge?: boolean;
}

export function ListingCarousel({ listings, loading = false, featuredBadge = false }: ListingCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateArrows = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    return () => el.removeEventListener('scroll', updateArrows);
  }, [updateArrows, listings]);

  function scrollBy(amount: number) {
    containerRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  }

  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="shrink-0 w-[280px] md:w-[320px]">
            <Skeleton className="aspect-[4/3] rounded-t-card" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollBy(-340)}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-card rounded-full p-2 hover:shadow-card-hover transition-shadow"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 text-neutral-700" />
        </button>
      )}

      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scroll-smooth scrollbar-hide"
      >
        {listings.map((listing) => (
          <div key={listing.id} className="shrink-0 w-[280px] md:w-[320px] snap-start relative">
            {featuredBadge && (
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-0.5 rounded">
                ★ Featured
              </div>
            )}
            <PropertyCard property={listing} compact />
          </div>
        ))}
      </div>

      {/* Right arrow */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollBy(340)}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-card rounded-full p-2 hover:shadow-card-hover transition-shadow"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 text-neutral-700" />
        </button>
      )}
    </div>
  );
}
