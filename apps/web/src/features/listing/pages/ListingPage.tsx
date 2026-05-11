import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Bookmark, Share2 } from 'lucide-react';
import { formatPrice } from '@propsphere/utils';
import { useProperty, useIncrementViewCount } from '@/api/properties';
import { Button, Skeleton } from '@/components/ui';
import { PhotoGallery } from '../components/PhotoGallery';
import { PropertyStats } from '../components/PropertyStats';
import { InspectionTimes } from '../components/InspectionTimes';
import { AuctionCountdown } from '../components/AuctionCountdown';
import { FeaturesList } from '../components/FeaturesList';
import { SoldHistory } from '../components/SoldHistory';
import { AgentCard } from '../components/AgentCard';
import { EnquiryModal } from '../components/EnquiryModal';
import { SimilarProperties } from '../components/SimilarProperties';
import { ListingMap } from '../components/ListingMap';

function buildAddress(property: {
  unit_number: string | null;
  street_number: string;
  street_name: string;
  suburb: string;
  state: string;
}): string {
  return [
    property.unit_number
      ? `${property.unit_number}/${property.street_number}`
      : property.street_number,
    property.street_name,
    property.suburb,
    property.state,
  ]
    .filter(Boolean)
    .join(' ');
}

function daysOnMarket(publishedAt: string | null): number {
  if (!publishedAt) return 0;
  return Math.floor((Date.now() - new Date(publishedAt).getTime()) / 86_400_000);
}

function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-pulse">
      <Skeleton className="h-[480px] w-full rounded-card mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full rounded-card" />
        </div>
      </div>
    </div>
  );
}

export default function ListingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  const { data: property, isLoading, isError } = useProperty(id!);
  useIncrementViewCount(id!);

  if (isLoading) return <PageSkeleton />;

  if (isError || !property) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-neutral-900 mb-3">Property not found</h1>
        <p className="text-neutral-500 mb-6">This listing may have been removed or is no longer active.</p>
        <Button onClick={() => navigate(-1)}>Back to search</Button>
      </div>
    );
  }

  const address = buildAddress(property);
  const dom = daysOnMarket(property.published_at);

  const priceLabel = property.is_price_hidden
    ? 'Contact agent'
    : property.price_display ?? (property.price ? formatPrice(property.price) : 'Contact agent');

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <Link
          to={`/${property.listing_type}`}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to search
        </Link>

        {/* Gallery */}
        <div className="mb-6">
          <PhotoGallery images={property.images} />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* Left column */}
          <div className="space-y-6">
            {/* Address + headline */}
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">{address}</h1>
              {property.headline && (
                <p className="text-neutral-500 mt-1">{property.headline}</p>
              )}
            </div>

            <PropertyStats property={property} />

            {property.description && (
              <div className="prose prose-sm max-w-none text-neutral-700">
                <h3 className="text-base font-semibold text-neutral-900 mb-2">About this property</h3>
                <p className="whitespace-pre-line">{property.description}</p>
              </div>
            )}

            <FeaturesList features={property.features} />

            <InspectionTimes inspections={property.inspections} address={address} />

            {property.auction_at && <AuctionCountdown auctionAt={property.auction_at} />}

            <SoldHistory soldAt={property.sold_at} soldPrice={property.sold_price} />

            <SimilarProperties propertyId={property.id} />

            {property.lat != null && property.lng != null && (
              <div>
                <h3 className="text-base font-semibold text-neutral-900 mb-3">Location</h3>
                <ListingMap lat={property.lat} lng={property.lng} address={address} />
              </div>
            )}
          </div>

          {/* Right column — sticky sidebar */}
          <div className="space-y-4">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* Price panel */}
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
                  <Button size="lg" className="w-full" onClick={() => setEnquiryOpen(true)}>
                    Enquire now
                  </Button>
                  <Button variant="secondary" size="lg" className="w-full">
                    <Bookmark className="w-4 h-4" />
                    Save property
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full">
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Agent card */}
              <AgentCard
                agent={property.agent}
                agency={property.agency}
                onEnquire={() => setEnquiryOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>

      <EnquiryModal
        propertyId={property.id}
        agentId={property.agent_id}
        isOpen={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
      />
    </>
  );
}
