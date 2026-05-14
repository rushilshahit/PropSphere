import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deactivateAgent, exportAllAgents, listAgents } from '@/api/admin';
import { exportToCsv } from '@/lib/csv';
import { Badge, Button, Card, Pagination, Table } from '@/components/ui';
import { useToast } from '@/components/providers/ToastProvider';

export default function AgentsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'agents', page],
    queryFn: () => listAgents(page),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateAgent,
    onSuccess: () => {
      toast('Agent deactivated', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'agents'] });
    },
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const rows = await exportAllAgents();
      exportToCsv(
        rows.map((r) => ({
          full_name: r.full_name ?? '',
          email: r.email,
          agency: r.agency_name,
          license_no: r.license_no ?? '',
          years_active: r.years_active ?? '',
          active_listings: r.active_listings,
          status: r.is_active ? 'Active' : 'Inactive',
        })),
        'agents.csv',
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
        <h1 className="text-2xl font-bold text-neutral-900">Agents</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport} loading={isExporting}>
            Export CSV
          </Button>
          <Button onClick={() => navigate('/agents/new')}>+ New Agent</Button>
        </div>
      </div>

      <Card className="p-0">
        <Table
          loading={isLoading}
          rows={data?.items ?? []}
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'name',
              header: 'Agent',
              render: (r) => (
                <div>
                  <p className="font-medium">{r.full_name ?? '—'}</p>
                  <p className="text-xs text-neutral-400">{r.email}</p>
                </div>
              ),
            },
            { key: 'agency_name', header: 'Agency' },
            { key: 'license_no', header: 'License' },
            { key: 'years_active', header: 'Years' },
            { key: 'active_listings', header: 'Active Listings' },
            {
              key: 'is_active',
              header: 'Status',
              render: (r) => (
                <Badge variant={r.is_active ? 'success' : 'default'}>
                  {r.is_active ? 'Active' : 'Inactive'}
                </Badge>
              ),
            },
            {
              key: 'actions',
              header: '',
              className: 'w-32',
              render: (r) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/agents/${r.id}/edit`)}>
                    Edit
                  </Button>
                  {r.is_active && (
                    <Button
                      size="sm"
                      variant="danger"
                      loading={deactivateMutation.isPending}
                      onClick={() => {
                        if (confirm('Deactivate this agent?')) deactivateMutation.mutate(r.id);
                      }}
                    >
                      Deactivate
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
        <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
      </Card>
    </div>
  );
}
