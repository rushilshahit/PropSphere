import { useQuery } from '@tanstack/react-query';
import { getListingAnalytics, getSearchAnalytics, getUserAnalytics } from '@/api/admin';
import { Card } from '@/components/ui';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function AnalyticsPage() {
  const { data: listings } = useQuery({
    queryKey: ['admin', 'analytics', 'listings'],
    queryFn: getListingAnalytics,
  });

  const { data: users } = useQuery({
    queryKey: ['admin', 'analytics', 'users'],
    queryFn: getUserAnalytics,
  });

  const { data: search } = useQuery({
    queryKey: ['admin', 'analytics', 'search'],
    queryFn: getSearchAnalytics,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Analytics</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-neutral-500">Daily Active Users</p>
          <p className="text-3xl font-bold text-neutral-900">{users?.dau ?? '—'}</p>
        </Card>
        <Card>
          <p className="text-sm text-neutral-500">Weekly Active Users</p>
          <p className="text-3xl font-bold text-neutral-900">{users?.wau ?? '—'}</p>
        </Card>
        <Card>
          <p className="text-sm text-neutral-500">Monthly Active Users</p>
          <p className="text-3xl font-bold text-neutral-900">{users?.mau ?? '—'}</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <h2 className="text-base font-semibold mb-4">Most Viewed Listings</h2>
          <div className="space-y-2">
            {listings?.mostViewed.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="truncate max-w-[200px] text-neutral-700">{item.headline}</span>
                <span className="font-semibold text-neutral-900 ml-2">{item.view_count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold mb-4">Highest Enquiry Rate</h2>
          <div className="space-y-2">
            {listings?.highestEnquiryRate.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="truncate max-w-[200px] text-neutral-700">{item.headline}</span>
                <span className="font-semibold text-neutral-900 ml-2">{item.enquiry_count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold mb-4">Top Searched Suburbs</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={search?.topSuburbs ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="suburb" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#1A56DB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="text-base font-semibold mb-4">Top Search Keywords</h2>
          <div className="space-y-2">
            {search?.topKeywords.map((item) => (
              <div key={item.query} className="flex items-center justify-between text-sm">
                <span className="text-neutral-700 font-mono text-xs bg-neutral-100 px-2 py-0.5 rounded">
                  {item.query}
                </span>
                <span className="font-semibold text-neutral-900">{item.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {listings?.avgDaysToSold !== undefined && (
          <Card>
            <p className="text-sm text-neutral-500">Average Days to Sold</p>
            <p className="text-3xl font-bold text-neutral-900">{listings.avgDaysToSold}d</p>
          </Card>
        )}
      </div>
    </div>
  );
}
