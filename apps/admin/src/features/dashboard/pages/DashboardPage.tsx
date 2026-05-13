import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getDashboardStats } from '@/api/admin';
import { Card } from '@/components/ui';

const STATUS_COLORS: Record<string, string> = {
  active: '#0E9F6E',
  draft: '#9CA3AF',
  under_offer: '#F59E0B',
  sold: '#6366F1',
  leased: '#3B82F6',
  withdrawn: '#EF4444',
};

interface MetricCardProps {
  label: string;
  value: number | string;
  sub?: string;
}

function MetricCard({ label, value, sub }: MetricCardProps) {
  return (
    <Card>
      <p className="text-sm text-neutral-500 font-medium">{label}</p>
      <p className="text-3xl font-bold text-neutral-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
    </Card>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: getDashboardStats,
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-card shadow-card p-6 h-24 animate-shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard label="Active Listings" value={data.activeListings} />
        <MetricCard label="New Listings Today" value={data.newListingsToday} />
        <MetricCard label="Enquiries This Week" value={data.enquiriesThisWeek} />
        <MetricCard label="New Users Today" value={data.newUsersToday} />
        <MetricCard label="Unread Enquiries" value={data.unreadEnquiries} />
        <MetricCard label="Featured Listings" value={data.featuredListings} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-base font-semibold text-neutral-800 mb-4">Listings by Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data.listingsByStatus ?? []}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ status, percent }) =>
                  `${status} ${(percent * 100).toFixed(0)}%`
                }
              >
                {(data.listingsByStatus ?? []).map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status] ?? '#9CA3AF'}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-neutral-800 mb-4">Top 5 Suburbs by Listings</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.topSuburbs ?? []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="suburb" type="category" tick={{ fontSize: 12 }} width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#1A56DB" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-neutral-800 mb-4">Enquiries — Last 30 Days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.enquiriesLast30Days ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#1A56DB" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-neutral-800 mb-4">
            New Registrations — Last 30 Days
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.registrationsLast30Days ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#0E9F6E" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
