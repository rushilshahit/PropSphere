import { useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { MapRef } from 'react-map-gl/maplibre';
import { useProperty, useIncrementViewCount } from '@/api/properties';
import type { NearbyPlace } from '@/api/overpass';
import { Button, Skeleton } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSaveProperty } from '@/features/collections/hooks/useSaveProperty';
import { SaveModal } from '@/features/collections/components/SaveModal';
import { PhotoGallery } from '../components/PhotoGallery';
import { PropertyStats } from '../components/PropertyStats';
import { InspectionTimes } from '../components/InspectionTimes';
import { AuctionCountdown } from '../components/AuctionCountdown';
import { FeaturesList } from '../components/FeaturesList';
import { SoldHistory } from '../components/SoldHistory';
import { AgentCard } from '../components/AgentCard';
import { EnquiryModal } from '../components/EnquiryModal';
import { SimilarProperties } from '../components/SimilarProperties';
import { StreetView } from '../components/StreetView';
import { NearbyPlaces } from '../components/NearbyPlaces';
import { CommuteCalculator } from '../components/CommuteCalculator';
import { ActivePricePanel } from '../components/ActivePricePanel';
import { SoldPricePanel } from '../components/SoldPricePanel';
import { PriceHistoryChart } from '../components/PriceHistoryChart';
import { AppraisalCTA } from '../components/AppraisalCTA';

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
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const mapRef = useRef<MapRef>(null);

  const { isAuthenticated } = useAuth();
  const { isSaved, toggle, saveModalOpen, closeSaveModal } = useSaveProperty(id!);
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
  const isSold = property.status === 'sold';

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Link
          to={`/${property.listing_type}`}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to search
        </Link>

        <div className="mb-6">
          <PhotoGallery images={property.images} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">{address}</h1>
              {property.headline && (
                <p className="text-neutral-500 mt-1">{property.headline}</p>
              )}
              <Link
                to={`/suburb/${property.state.toLowerCase()}/${property.suburb.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-sm text-brand-primary hover:underline mt-1 inline-block"
              >
                Explore {property.suburb} →
              </Link>
            </div>

            <PropertyStats property={property} />

            {property.description && (
              <div className="prose prose-sm max-w-none text-neutral-700">
                <h3 className="text-base font-semibold text-neutral-900 mb-2">About this property</h3>
                <p className="whitespace-pre-line">{property.description}</p>
              </div>
            )}

            <FeaturesList features={property.features} />

            {!isSold && (
              <>
                <InspectionTimes inspections={property.inspections} address={address} />
                {property.auction_at && <AuctionCountdown auctionAt={property.auction_at} />}
              </>
            )}

            <SoldHistory soldAt={property.sold_at} soldPrice={property.sold_price} />

            {isSold && (
              <>
                <section>
                  <h3 className="text-lg font-bold text-neutral-900 mb-4">Price History</h3>
                  <PriceHistoryChart
                    propertyId={property.id}
                    currentPrice={property.sold_price ?? undefined}
                  />
                </section>

                <AppraisalCTA
                  suburb={property.suburb}
                  agentId={property.agent_id}
                  propertyId={property.id}
                />
              </>
            )}

            <SimilarProperties propertyId={property.id} />

            {property.lat != null && property.lng != null && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-neutral-900">Location</h2>
                <StreetView
                  lat={property.lat}
                  lng={property.lng}
                  address={address}
                  mapRef={mapRef}
                  selectedPin={selectedPlace}
                />
                <NearbyPlaces
                  lat={property.lat}
                  lng={property.lng}
                  onPlaceSelect={setSelectedPlace}
                />
                <CommuteCalculator
                  originLat={property.lat}
                  originLng={property.lng}
                  mapRef={mapRef}
                />
              </section>
            )}
          </div>

          <div className="space-y-4">
            <div className="lg:sticky lg:top-24 space-y-4">
              {isSold ? (
                <>
                  <SoldPricePanel property={property} />
                  <Link to={`/agent/${property.agent_id}`} className="block">
                    <Button variant="secondary" size="lg" className="w-full">
                      View agent profile
                    </Button>
                  </Link>
                </>
              ) : (
                <ActivePricePanel
                  property={property}
                  isSaved={isSaved}
                  isAuthenticated={isAuthenticated}
                  onEnquire={() => setEnquiryOpen(true)}
                  onSave={toggle}
                />
              )}

              <AgentCard
                agent={property.agent}
                agency={property.agency}
                onEnquire={() => setEnquiryOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {!isSold && (
        <EnquiryModal
          propertyId={property.id}
          agentId={property.agent_id}
          agentName={property.agent?.full_name ?? undefined}
          isOpen={enquiryOpen}
          onClose={() => setEnquiryOpen(false)}
        />
      )}
      <SaveModal
        propertyId={property.id}
        isOpen={saveModalOpen}
        onClose={closeSaveModal}
      />
    </>
  );
}
