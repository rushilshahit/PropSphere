import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createSuburb, listSuburbs, refreshSuburbStats, updateSuburb } from '@/api/admin';
import { Button, Card, Input, Modal, Pagination, Table } from '@/components/ui';
import { useToast } from '@/components/providers/ToastProvider';
import { useForm } from 'react-hook-form';

interface SuburbFormValues {
  name: string;
  state: string;
  postcode: string;
  median_sale_price: number | null;
  median_rent_price: number | null;
  days_on_market_avg: number | null;
  [key: string]: unknown;
}

const toNumOrNull = (v: unknown): number | null => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
};

export default function SuburbsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'suburbs', page],
    queryFn: () => listSuburbs(page),
  });

  const editingRow = data?.items.find((s) => s.id === editing);

  const { register: regEdit, handleSubmit: hEdit, reset: resetEdit } = useForm<SuburbFormValues>();
  const { register: regCreate, handleSubmit: hCreate, reset: resetCreate } = useForm<SuburbFormValues>();

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: SuburbFormValues }) =>
      updateSuburb(id, d),
    onSuccess: () => {
      toast('Suburb updated', 'success');
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['admin', 'suburbs'] });
    },
    onError: (err) => toast(err instanceof Error ? err.message : 'Failed to update suburb', 'error'),
  });

  const createMutation = useMutation({
    mutationFn: (d: SuburbFormValues): Promise<unknown> => createSuburb(d),
    onSuccess: () => {
      toast('Suburb created', 'success');
      setCreating(false);
      resetCreate();
      qc.invalidateQueries({ queryKey: ['admin', 'suburbs'] });
    },
    onError: (err) => toast(err instanceof Error ? err.message : 'Failed to create suburb', 'error'),
  });

  const refreshMutation = useMutation({
    mutationFn: refreshSuburbStats,
    onSuccess: () => {
      toast('Stats refresh triggered', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'suburbs'] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Suburbs</h1>
        <Button onClick={() => setCreating(true)}>+ New Suburb</Button>
      </div>

      <Card className="p-0">
        <Table
          loading={isLoading}
          rows={data?.items ?? []}
          keyExtractor={(r) => r.id}
          columns={[
            { key: 'name', header: 'Suburb' },
            { key: 'state', header: 'State' },
            { key: 'postcode', header: 'Postcode' },
            {
              key: 'median_sale_price',
              header: 'Median Sale',
              render: (r) => r.median_sale_price ? `₹${r.median_sale_price.toLocaleString()}` : '—',
            },
            {
              key: 'median_rent_price',
              header: 'Median Rent',
              render: (r) => r.median_rent_price ? `₹${r.median_rent_price.toLocaleString()}/mo` : '—',
            },
            {
              key: 'days_on_market_avg',
              header: 'Avg DOM',
              render: (r) => r.days_on_market_avg ? `${r.days_on_market_avg}d` : '—',
            },
            {
              key: 'stats_updated_at',
              header: 'Stats Updated',
              render: (r) =>
                r.stats_updated_at
                  ? new Date(r.stats_updated_at).toLocaleDateString()
                  : '—',
            },
            {
              key: 'actions',
              header: '',
              className: 'w-32',
              render: (r) => (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditing(r.id);
                      resetEdit({
                        name: r.name,
                        state: r.state,
                        postcode: r.postcode,
                        median_sale_price: r.median_sale_price,
                        median_rent_price: r.median_rent_price,
                        days_on_market_avg: r.days_on_market_avg,
                      });
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={refreshMutation.isPending}
                    onClick={() => refreshMutation.mutate(r.id)}
                  >
                    Refresh
                  </Button>
                </div>
              ),
            },
          ]}
        />
        <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
      </Card>

      <Modal
        open={Boolean(editing) && Boolean(editingRow)}
        onClose={() => setEditing(null)}
        title={`Edit ${editingRow?.name ?? 'Suburb'}`}
      >
        <form onSubmit={hEdit((d) => updateMutation.mutate({ id: editing!, data: d }))} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input label="Median Sale Price" type="number" {...regEdit('median_sale_price', { setValueAs: toNumOrNull })} />
            <Input label="Median Rent Price" type="number" {...regEdit('median_rent_price', { setValueAs: toNumOrNull })} />
            <Input label="Avg Days on Market" type="number" {...regEdit('days_on_market_avg', { setValueAs: toNumOrNull })} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={updateMutation.isPending}>Save</Button>
          </div>
        </form>
      </Modal>

      <Modal open={creating} onClose={() => setCreating(false)} title="New Suburb">
        <form onSubmit={hCreate((d) => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input label="Name" {...regCreate('name', { required: true })} />
            <Input label="State" {...regCreate('state', { required: true })} />
            <Input label="Postcode" {...regCreate('postcode', { required: true })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Median Sale Price" type="number" {...regCreate('median_sale_price', { setValueAs: toNumOrNull })} />
            <Input label="Median Rent Price" type="number" {...regCreate('median_rent_price', { setValueAs: toNumOrNull })} />
            <Input label="Avg Days on Market" type="number" {...regCreate('days_on_market_avg', { setValueAs: toNumOrNull })} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={createMutation.isPending}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
