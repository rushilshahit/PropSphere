import { Link, useParams } from 'react-router-dom';
import { User } from 'lucide-react';
import { formatPrice } from '@propsphere/utils';
import { useAgencyBySlug } from '@/api/agencies';
import type { SoldProperty } from '@/api/agents';
import { PropertyCard } from '@/features/search/components/PropertyCard';
import type { PropertySummary } from '@propsphere/types';
import { Skeleton } from '@/components/ui';
import { AgencyHero } from '../components/AgencyHero';
import { Bath, BedDouble } from 'lucide-react';

// ── Sold card (same pattern as AgentPage) ────────────────────────────────────

function SoldCard({ property }: { property: SoldProperty }) {
  const heroImage = property.images[0]?.cdn_url;
  const address = [
    property.unit_number ? `${property.unit_number}/` : '',
    property.street_number,
    ' ',
    property.street_name,
    ', ',
    property.suburb,
  ].join('').trim();

  const soldDate = property.sold_at
    ? new Date(property.sold_at).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })
    : null;

  return (
    <article className="bg-white rounded-card shadow-card overflow-hidden">
      <div className="aspect-[4/3] relative overflow-hidden bg-neutral-100">
        {heroImage ? (
          <img src={heroImage} alt={property.headline ?? address} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">No image</div>
        )}
        <span className="absolute top-3 left-3 bg-neutral-800 text-white text-[11px] font-bold px-2 py-0.5 rounded">
          Sold{soldDate ? ` ${soldDate}` : ''}
        </span>
      </div>
      <div className="p-4">
        <p className="text-lg font-bold tabular-nums text-neutral-900">
          {property.sold_price ? formatPrice(property.sold_price) : 'Price confidential'}
        </p>
        <p className="text-sm text-neutral-700 mt-0.5 truncate">{address}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{property.bedrooms}</span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{property.bathrooms}</span>
          )}
          <span className="capitalize">{property.property_type}</span>
        </div>
      </div>
    </article>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function AgencyPageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <Skeleton className="h-40 rounded-card" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-card" />)}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-card" />)}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AgencyPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data: agency, isLoading, isError } = useAgencyBySlug(slug);

  if (isLoading) return <AgencyPageSkeleton />;

  if (isError || !agency) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-neutral-400">
        <p className="text-lg font-medium">Agency not found</p>
        <Link to="/agents" className="text-sm text-brand-primary hover:underline mt-2 block">
          Browse agents
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-10">

      {/* Hero */}
      <AgencyHero agency={agency} />

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Agents', value: String(agency.agents.length) },
          { label: 'Active listings', value: String(agency.activeListingCount) },
          { label: 'Sold last 12m', value: String(agency.soldLast12m) },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-card shadow-card px-5 py-4 text-center">
            <p className="text-xl font-bold text-neutral-900 tabular-nums">{stat.value}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Our Agents — horizontal scroll */}
      {agency.agents.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Our Agents</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
            {agency.agents.map((agent) => (
              <div key={agent.id} className="shrink-0 w-36">
                {agent.slug ? (
                  <Link to={`/agent/${agent.slug}`} className="block group">
                    <AgentMiniCard agent={agent} />
                  </Link>
                ) : (
                  <AgentMiniCard agent={agent} />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active Listings */}
      {agency.activeListings.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Active Listings
            <span className="ml-2 text-sm font-normal text-neutral-500">({agency.activeListingCount})</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(agency.activeListings as PropertySummary[]).map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Sales */}
      {agency.recentSales.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Recent Sales</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agency.recentSales.map((p) => <SoldCard key={p.id} property={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Agent mini-card (used in horizontal scroll) ───────────────────────────────

function AgentMiniCard({
  agent,
}: {
  agent: { id: string; full_name: string | null; avatar_url: string | null; active_listings: number; is_verified: boolean };
}) {
  const initials = agent.full_name
    ? agent.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-3 text-center hover:shadow-md transition-shadow group-hover:border-brand-primary/30">
      <div className="w-14 h-14 rounded-full mx-auto overflow-hidden bg-brand-primary/10 mb-2 flex items-center justify-center">
        {agent.avatar_url ? (
          <img src={agent.avatar_url} alt={agent.full_name ?? 'Agent'} className="w-full h-full object-cover" />
        ) : (
          <span className="text-base font-bold text-brand-primary">
            {agent.full_name ? (
              initials
            ) : (
              <User className="w-5 h-5" />
            )}
          </span>
        )}
      </div>
      <p className="text-xs font-medium text-neutral-900 truncate leading-tight">
        {agent.full_name ?? 'Agent'}
      </p>
      {agent.active_listings > 0 && (
        <p className="text-[11px] text-neutral-500 mt-0.5">
          {agent.active_listings} listing{agent.active_listings !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
