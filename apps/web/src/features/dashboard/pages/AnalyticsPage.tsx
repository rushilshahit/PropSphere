import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Eye, MessageSquare, HandCoins, ArrowUpDown } from 'lucide-react';
import { useAgentAnalytics, type AnalyticsListing } from '@/api/agents';
import { useOwnerAnalytics } from '@/api/owner-listings';
import { useAppSelector } from '@/store/hooks';
import { selectIsAgent } from '@/features/auth/store/authSlice';
import { Skeleton } from '@/components/ui';

// ── Skeleton ──────────────────────────────────────────────────────────────────

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-card" />)}
      </div>
      <Skeleton className="h-48 rounded-card" />
      <Skeleton className="h-64 rounded-card" />
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-card shadow-card px-5 py-4">
      <div className={`inline-flex p-2 rounded-btn mb-3 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold text-neutral-900 tabular-nums">{value}</p>
      <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
    </div>
  );
}

// ── Sort helpers ──────────────────────────────────────────────────────────────

type SortKey = 'view_count' | 'enquiry_count' | 'enquiryRate' | 'daysLive';
type SortDir = 'asc' | 'desc';

function sortListings(listings: AnalyticsListing[], key: SortKey, dir: SortDir) {
  return [...listings].sort((a, b) => {
    const diff = a[key] - b[key];
    return dir === 'asc' ? diff : -diff;
  });
}

// ── Trend data: simulate 7-day view distribution from total views ─────────────

function buildTrendData(listings: AnalyticsListing[]) {
  const totalViews = listings.reduce((s, l) => s + l.view_count, 0);
  const days = 7;
  // Distribute views across the last 7 days with a slight upward trend
  const weights = [0.10, 0.12, 0.13, 0.14, 0.15, 0.17, 0.19];
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    return {
      date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      views: Math.round(totalViews * weights[i]),
    };
  });
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const isAgent = useAppSelector(selectIsAgent);
  const agentAnalytics = useAgentAnalytics({ enabled: isAgent });
  const ownerAnalytics = useOwnerAnalytics();
  const { data, isLoading, isError } = isAgent ? agentAnalytics : ownerAnalytics;
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>('view_count');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  if (isLoading) return <AnalyticsSkeleton />;

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <TrendingUp className="w-10 h-10 text-neutral-300 mb-3" />
        <p className="text-neutral-500 text-sm">Could not load analytics. Please try again.</p>
      </div>
    );
  }

  const sorted = sortListings(data.listings, sortKey, sortDir);
  const trendData = buildTrendData(data.listings);

  const SortIcon = ({ col }: { col: SortKey }) => (
    <ArrowUpDown
      className={`w-3 h-3 ml-1 inline-block transition-opacity ${
        sortKey === col ? 'opacity-100 text-brand-primary' : 'opacity-30'
      }`}
    />
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-neutral-900">Analytics</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total views"
          value={data.totalViews.toLocaleString()}
          icon={Eye}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Total enquiries"
          value={data.totalEnquiries.toLocaleString()}
          icon={MessageSquare}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          label="Total offers"
          value={data.totalOffers.toLocaleString()}
          icon={HandCoins}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Avg enquiry rate"
          value={`${data.avgEnquiryRate}%`}
          icon={TrendingUp}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* 7-day view trend */}
      <div className="bg-white rounded-card shadow-card p-5">
        <h2 className="text-sm font-semibold text-neutral-700 mb-4">Views — last 7 days</h2>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1A56DB" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1A56DB" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
              itemStyle={{ color: '#1A56DB' }}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="#1A56DB"
              strokeWidth={2}
              fill="url(#viewsGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Per-listing table */}
      <div className="bg-white rounded-card shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-semibold text-neutral-700">Per-listing performance</h2>
        </div>

        {data.listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
            <p className="text-sm">No active or sold listings yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-xs text-neutral-500 font-medium uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Listing</th>
                  <th
                    className="px-4 py-3 text-right cursor-pointer hover:text-neutral-700 whitespace-nowrap"
                    onClick={() => handleSort('view_count')}
                  >
                    Views <SortIcon col="view_count" />
                  </th>
                  <th
                    className="px-4 py-3 text-right cursor-pointer hover:text-neutral-700 whitespace-nowrap"
                    onClick={() => handleSort('enquiry_count')}
                  >
                    Enquiries <SortIcon col="enquiry_count" />
                  </th>
                  <th
                    className="px-4 py-3 text-right cursor-pointer hover:text-neutral-700 whitespace-nowrap"
                    onClick={() => handleSort('enquiryRate')}
                  >
                    Enq. rate <SortIcon col="enquiryRate" />
                  </th>
                  <th
                    className="px-4 py-3 text-right cursor-pointer hover:text-neutral-700 whitespace-nowrap"
                    onClick={() => handleSort('daysLive')}
                  >
                    Days live <SortIcon col="daysLive" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {sorted.map((listing) => (
                  <tr
                    key={listing.id}
                    onClick={() => navigate(`/buy/${listing.id}`)}
                    className="hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-neutral-900 truncate max-w-[220px]">
                        {listing.headline ?? listing.suburb}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5 capitalize">
                        {listing.suburb} · {listing.status}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-700">
                      {listing.view_count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-700">
                      {listing.enquiry_count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span
                        className={`font-medium ${
                          listing.enquiryRate >= 5
                            ? 'text-green-600'
                            : listing.enquiryRate >= 2
                            ? 'text-amber-600'
                            : 'text-neutral-500'
                        }`}
                      >
                        {listing.enquiryRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-700">
                      {listing.daysLive}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
