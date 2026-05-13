import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deactivateAgent, listAgents } from '@/api/admin';
import { Badge, Button, Card, Pagination, Table } from '@/components/ui';
import { useToast } from '@/components/providers/ToastProvider';

export default function AgentsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Agents</h1>
        <Button onClick={() => navigate('/agents/new')}>+ New Agent</Button>
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
