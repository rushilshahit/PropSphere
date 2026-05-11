import { useQuery } from '@tanstack/react-query';
import type { PropertySummary } from '@propsphere/types';
import { PropertyCard } from '@/features/search/components/PropertyCard';
import { Skeleton } from '@/components/ui';

async function fetchSimilar(id: string): Promise<PropertySummary[]> {
  const res = await fetch(`/api/properties/similar/${id}`);
  if (!res.ok) throw new Error('Failed to fetch similar properties');
  const json = await res.json() as { data: PropertySummary[] };
  return json.data;
}

interface SimilarPropertiesProps {
  propertyId: string;
}

export function SimilarProperties({ propertyId }: SimilarPropertiesProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['properties', 'similar', propertyId],
    queryFn: () => fetchSimilar(propertyId),
    staleTime: 60_000,
  });

  if (!isLoading && !data?.length) return null;

  return (
    <div>
      <h3 className="text-base font-semibold text-neutral-900 mb-4">Similar properties</h3>
      <div className="flex gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="shrink-0 w-64 snap-start">
                <Skeleton className="aspect-[4/3] rounded-card mb-2" />
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          : (data ?? []).map((property) => (
              <div key={property.id} className="shrink-0 w-64 snap-start">
                <PropertyCard property={property} compact />
              </div>
            ))}
      </div>
    </div>
  );
}
