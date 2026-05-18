import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useSuburb } from '@/api/suburbs';
import { Button, Skeleton } from '@/components/ui';
import { SuburbStats } from '../components/SuburbStats';
import { PriceTrendChart } from '../components/PriceTrendChart';
import { SuburbSoldInsights } from '../components/SuburbSoldInsights';
import { SchoolsList } from '../components/SchoolsList';
import { SuburbListings } from '../components/SuburbListings';

function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-pulse space-y-6">
      <Skeleton className="h-48 w-full rounded-card" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-card" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-card" />
    </div>
  );
}

export default function SuburbPage() {
  const { state, slug } = useParams<{ state: string; slug: string }>();
  const navigate = useNavigate();
  const { data: suburb, isLoading, isError } = useSuburb(state!, slug!);

  if (isLoading) return <PageSkeleton />;

  if (isError || !suburb) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-neutral-900 mb-3">Suburb not found</h1>
        <p className="text-neutral-500 mb-6">
          We couldn't find data for this suburb. It may have been removed or the URL is incorrect.
        </p>
        <Button onClick={() => navigate('/buy')}>Back to search</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Hero */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">
          {suburb.name}, {suburb.state}
        </h1>
        <p className="text-neutral-500 mt-1">
          {suburb.postcode} · Suburb profile
        </p>
      </div>

      {/* Key stats */}
      <SuburbStats suburb={suburb} />

      {/* Price trend */}
      <PriceTrendChart suburbId={suburb.id} />

      {/* Sold insights */}
      <SuburbSoldInsights suburbId={suburb.id} />

      {/* Nearby schools */}
      <SchoolsList suburbId={suburb.id} lat={suburb.lat} lng={suburb.lng} />

      {/* Active listings */}
      <SuburbListings suburb={suburb.name} state={suburb.state} />
    </div>
  );
}
