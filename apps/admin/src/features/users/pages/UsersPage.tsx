import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { exportAllUsers, listUsers } from '@/api/admin';
import { Badge, Button, Card, Input, Pagination, Select, Table } from '@/components/ui';
import { useToast } from '@/components/providers/ToastProvider';
import { exportToCsv } from '@/lib/csv';

const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'buyer', label: 'Buyer' },
  { value: 'renter', label: 'Renter' },
  { value: 'seller', label: 'Seller' },
  { value: 'agent', label: 'Agent' },
  { value: 'admin', label: 'Admin' },
];

const ROLE_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  admin: 'danger',
  agent: 'info',
  seller: 'warning',
  buyer: 'success',
  renter: 'default',
};

export default function UsersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, role, search],
    queryFn: () => listUsers({ page, role: role || undefined, search: search || undefined }),
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const rows = await exportAllUsers({ role: role || undefined, search: search || undefined });
      exportToCsv(
        rows.map((r) => ({
          full_name: r.full_name ?? '',
          email: r.email,
          role: r.role,
          joined: new Date(r.created_at).toLocaleDateString(),
          status: r.is_suspended ? 'Suspended' : 'Active',
        })),
        'users.csv',
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Users</h1>
        <Button variant="secondary" onClick={handleExport} loading={isExporting}>
          Export CSV
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex gap-3">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-64"
          />
          <Select
            options={ROLE_OPTIONS}
            value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1); }}
            className="w-36"
          />
        </div>
      </Card>

      <Card className="p-0">
        <Table
          loading={isLoading}
          rows={data?.items ?? []}
          keyExtractor={(r) => r.id}
          onRowClick={(r) => navigate(`/users/${r.id}`)}
          columns={[
            {
              key: 'name',
              header: 'User',
              render: (r) => (
                <div>
                  <p className="font-medium">{r.full_name ?? '—'}</p>
                  <p className="text-xs text-neutral-400">{r.email}</p>
                </div>
              ),
            },
            {
              key: 'role',
              header: 'Role',
              render: (r) => (
                <Badge variant={ROLE_VARIANT[r.role] ?? 'default'}>{r.role}</Badge>
              ),
            },
            {
              key: 'created_at',
              header: 'Joined',
              render: (r) => new Date(r.created_at).toLocaleDateString(),
            },
            {
              key: 'is_suspended',
              header: 'Status',
              render: (r) => (
                <Badge variant={r.is_suspended ? 'danger' : 'success'}>
                  {r.is_suspended ? 'Suspended' : 'Active'}
                </Badge>
              ),
            },
            {
              key: 'actions',
              header: '',
              className: 'w-16',
              render: (r) => (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); navigate(`/users/${r.id}`); }}
                >
                  View
                </Button>
              ),
            },
          ]}
        />
        <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
      </Card>
    </div>
  );
}
