import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bath, BedDouble, Building2, CheckCircle, Mail, Phone } from 'lucide-react';
import { formatPrice } from '@propsphere/utils';
import { useAgentBySlug, useAgentSoldHistory, type SoldProperty } from '@/api/agents';
import { PropertyCard } from '@/features/search/components/PropertyCard';
import type { PropertySummary } from '@propsphere/types';
import { EnquiryModal } from '@/features/listing/components/EnquiryModal';
import { Button, Skeleton, Tabs } from '@/components/ui';

// ── Sold property card ────────────────────────────────────────────────────────

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
          <img
            src={heroImage}
            alt={property.headline ?? address}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">
            No image
          </div>
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
            <span className="flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5" />{property.bedrooms}
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" />{property.bathrooms}
            </span>
          )}
          <span className="capitalize">{property.property_type}</span>
        </div>
      </div>
    </article>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function AgentPageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="bg-white rounded-card shadow-card overflow-hidden">
        <div className="h-10 bg-brand-primary/20" />
        <div className="px-8 pb-8 pt-0">
          <div className="flex gap-6 items-end -mt-10 mb-6">
            <Skeleton className="w-24 h-24 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mt-2" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-card" />)}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const TABS = [
  { label: 'Current Listings', value: 'listings' },
  { label: 'Sold History', value: 'sold' },
];

const PROPERTY_TYPES = ['house', 'apartment', 'townhouse', 'unit', 'land', 'rural'];

export default function AgentPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data: agent, isLoading, isError } = useAgentBySlug(slug);
  const { data: soldHistory = [] } = useAgentSoldHistory(slug);

  const [tab, setTab] = useState('listings');
  const [enquireOpen, setEnquireOpen] = useState(false);
  const [suburbFilter, setSuburbFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  if (isLoading) return <AgentPageSkeleton />;

  if (isError || !agent) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-neutral-400">
        <p className="text-lg font-medium">Agent not found</p>
        <Link to="/agents" className="text-sm text-brand-primary hover:underline mt-2 block">
          Browse all agents
        </Link>
      </div>
    );
  }

  // Derive unique suburbs from sold history for filter
  const soldSuburbs = [...new Set(soldHistory.map((p) => p.suburb))].sort();

  const filteredSold = soldHistory.filter((p) => {
    if (suburbFilter && p.suburb !== suburbFilter) return false;
    if (typeFilter && p.property_type !== typeFilter) return false;
    return true;
  });

  // Sold stats
  const soldPrices = soldHistory.map((p) => p.sold_price).filter((p): p is number => p != null);
  const soldTotal = soldHistory.length;
  const soldMedian = agent.medianSoldPrice;
  const soldHighest = soldPrices.length ? Math.max(...soldPrices) : null;
  const soldAvgDays = agent.avgDaysOnMarket;

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">

        {/* Hero card */}
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          {/* Colour band */}
          <div className="h-10 bg-brand-primary" />

          <div className="px-6 sm:px-8 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-5">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-neutral-100 shrink-0">
                {agent.avatar_url ? (
                  <img src={agent.avatar_url} alt={agent.full_name ?? 'Agent'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-brand-primary bg-brand-primary/10">
                    {agent.full_name?.charAt(0).toUpperCase() ?? 'A'}
                  </div>
                )}
              </div>

              {/* Name + badges */}
              <div className="sm:pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-neutral-900">{agent.full_name ?? 'Agent'}</h1>
                  {agent.is_verified && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  )}
                </div>

                {/* Agency */}
                {agent.agency && (
                  <div className="flex items-center gap-2 mt-1">
                    {agent.agency.logo_url && (
                      <img src={agent.agency.logo_url} alt={agent.agency.name} className="h-5 w-auto object-contain" />
                    )}
                    <Link
                      to={`/agency/${agent.agency.slug}`}
                      className="text-sm text-brand-secondary hover:text-brand-accent"
                    >
                      <Building2 className="w-3.5 h-3.5 inline mr-1" />
                      {agent.agency.name}
                    </Link>
                  </div>
                )}

                {/* Meta */}
                <p className="text-xs text-neutral-500 mt-1">
                  {[
                    agent.years_active ? `${agent.years_active} yr${agent.years_active !== 1 ? 's' : ''} active` : null,
                    agent.license_no ? `Lic. ${agent.license_no}` : null,
                  ].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>

            {/* Bio */}
            {agent.bio && (
              <p className="text-sm text-neutral-600 mb-5 max-w-2xl">{agent.bio}</p>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              {agent.phone && (
                <a href={`tel:${agent.phone}`}>
                  <Button variant="secondary" size="sm">
                    <Phone className="w-4 h-4" />
                    Call
                  </Button>
                </a>
              )}
              {agent.email && (
                <a href={`mailto:${agent.email}`}>
                  <Button variant="secondary" size="sm">
                    <Mail className="w-4 h-4" />
                    Email
                  </Button>
                </a>
              )}
              <Button variant="primary" size="sm" onClick={() => setEnquireOpen(true)}>
                <Mail className="w-4 h-4" />
                Enquire
              </Button>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Active listings', value: String(agent.activeListingCount) },
            { label: 'Sold (12m)', value: String(agent.soldLast12m) },
            { label: 'Avg days on market', value: agent.avgDaysOnMarket != null ? String(agent.avgDaysOnMarket) : '—' },
            { label: 'Median sold price', value: agent.medianSoldPrice ? formatPrice(agent.medianSoldPrice) : '—' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-card shadow-card px-5 py-4 text-center">
              <p className="text-xl font-bold text-neutral-900 tabular-nums">{stat.value}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs tabs={TABS} value={tab} onChange={setTab} />

        {/* Current Listings */}
        {tab === 'listings' && (
          <>
            {agent.activeListings.length === 0 ? (
              <div className="bg-white rounded-card shadow-card py-16 text-center text-neutral-400">
                <p className="font-medium">No active listings</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(agent.activeListings as PropertySummary[]).map((p) => (
                  <PropertyCard key={p.id} property={p} compact />
                ))}
              </div>
            )}
          </>
        )}

        {/* Sold History */}
        {tab === 'sold' && (
          <div className="space-y-5">
            {/* Sold stats card */}
            {soldTotal > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Properties sold', value: String(soldTotal) },
                  { label: 'Median price', value: soldMedian ? formatPrice(soldMedian) : '—' },
                  { label: 'Highest sale', value: soldHighest ? formatPrice(soldHighest) : '—' },
                  { label: 'Avg days on market', value: soldAvgDays != null ? String(soldAvgDays) : '—' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-card border border-neutral-200 px-5 py-4 text-center">
                    <p className="text-lg font-bold text-neutral-900 tabular-nums">{stat.value}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Filter chips */}
            {soldTotal > 0 && (
              <div className="flex flex-wrap gap-2">
                {/* Suburb filter */}
                <select
                  value={suburbFilter}
                  onChange={(e) => setSuburbFilter(e.target.value)}
                  className="text-xs border border-neutral-200 rounded-full px-3 py-1.5 outline-none focus:border-brand-primary bg-white"
                >
                  <option value="">All suburbs</option>
                  {soldSuburbs.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>

                {/* Property type filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="text-xs border border-neutral-200 rounded-full px-3 py-1.5 outline-none focus:border-brand-primary bg-white capitalize"
                >
                  <option value="">All types</option>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t} className="capitalize">{t}</option>
                  ))}
                </select>

                {(suburbFilter || typeFilter) && (
                  <button
                    type="button"
                    onClick={() => { setSuburbFilter(''); setTypeFilter(''); }}
                    className="text-xs text-neutral-500 border border-neutral-200 rounded-full px-3 py-1.5 hover:bg-neutral-50"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Sold grid */}
            {filteredSold.length === 0 ? (
              <div className="bg-white rounded-card shadow-card py-16 text-center text-neutral-400">
                <p className="font-medium">No sold history{suburbFilter || typeFilter ? ' matching filters' : ''}</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSold.map((p) => <SoldCard key={p.id} property={p} />)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enquiry modal */}
      <EnquiryModal
        agentId={agent.id}
        agentName={agent.full_name ?? undefined}
        isOpen={enquireOpen}
        onClose={() => setEnquireOpen(false)}
      />
    </>
  );
}
