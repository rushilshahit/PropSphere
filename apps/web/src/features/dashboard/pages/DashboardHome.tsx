import { BarChart2, MessageSquare, Eye } from 'lucide-react';
import { useAgentStats } from '@/api/agents';
import { useOwnerDashboardStats } from '@/api/owner-listings';
import { useAppSelector } from '@/store/hooks';
import { selectIsAgent } from '@/features/auth/store/authSlice';
import { Skeleton } from '@/components/ui';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
}

function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-card shadow-card p-6 flex items-center gap-4">
      <div className="w-12 h-12 rounded-btn bg-brand-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-6 h-6 text-brand-primary" />
      </div>
      <div>
        <p className="text-xs text-neutral-500 mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-neutral-900 tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-card" />
      ))}
    </div>
  );
}

export default function DashboardHome() {
  const isAgent = useAppSelector(selectIsAgent);
  const agentStats = useAgentStats();
  const ownerStats = useOwnerDashboardStats();
  const { data: stats, isLoading, isError } = isAgent ? agentStats : ownerStats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Overview</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Your dashboard at a glance</p>
      </div>

      {isLoading && <StatsSkeleton />}

      {isError && (
        <p className="text-sm text-red-500">Failed to load stats. Please refresh.</p>
      )}

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Active listings"
            value={stats.activeListings}
            icon={BarChart2}
          />
          <StatCard
            label="Enquiries today"
            value={stats.enquiriesToday}
            icon={MessageSquare}
          />
          <StatCard
            label="Total views"
            value={stats.totalViews.toLocaleString('en-IN')}
            icon={Eye}
          />
        </div>
      )}
    </div>
  );
}
