import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteAgency, listAgencies } from '@/api/admin';
import { Button, Card, Pagination, Table } from '@/components/ui';
import { useToast } from '@/components/providers/ToastProvider';

export default function AgenciesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'agencies', page],
    queryFn: () => listAgencies(page),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAgency,
    onSuccess: () => {
      toast('Agency deleted', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'agencies'] });
    },
    onError: (err) => toast(err instanceof Error ? err.message : 'Cannot delete', 'error'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Agencies</h1>
        <Button onClick={() => navigate('/agencies/new')}>+ New Agency</Button>
      </div>

      <Card className="p-0">
        <Table
          loading={isLoading}
          rows={data?.items ?? []}
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (r) => (
                <div>
                  <p className="font-medium">{r.name}</p>
                  {r.website && <p className="text-xs text-neutral-400">{r.website}</p>}
                </div>
              ),
            },
            { key: 'suburb', header: 'Suburb' },
            { key: 'state', header: 'State' },
            { key: 'agent_count', header: 'Agents' },
            { key: 'listing_count', header: 'Listings' },
            {
              key: 'actions',
              header: '',
              className: 'w-24',
              render: (r) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/agencies/${r.id}/edit`)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    loading={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm('Delete this agency?')) deleteMutation.mutate(r.id);
                    }}
                  >
                    Del
                  </Button>
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
