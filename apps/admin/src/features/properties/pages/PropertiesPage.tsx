import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bulkUpdateProperties, deleteProperty, exportAllProperties, listProperties, type PropertyListParams } from '@/api/admin';
import { exportToCsv } from '@/lib/csv';
import { Badge, Button, Card, Input, Pagination, Select, Table } from '@/components/ui';
import { useToast } from '@/components/providers/ToastProvider';

const LISTING_TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'buy', label: 'Buy' },
  { value: 'rent', label: 'Rent' },
  { value: 'sold', label: 'Sold' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'under_offer', label: 'Under Offer' },
  { value: 'sold', label: 'Sold' },
  { value: 'leased', label: 'Leased' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  active: 'success',
  draft: 'default',
  under_offer: 'warning',
  sold: 'info',
  leased: 'info',
  withdrawn: 'danger',
};

export default function PropertiesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<PropertyListParams>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'properties', page, filters],
    queryFn: () => listProperties({ ...filters, page }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProperty,
    onSuccess: () => {
      toast('Property deleted', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'properties'] });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: ({ patch }: { patch: Record<string, unknown> }) =>
      bulkUpdateProperties([...selected], patch),
    onSuccess: () => {
      toast('Bulk update applied', 'success');
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ['admin', 'properties'] });
    },
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const rows = await exportAllProperties(filters);
      exportToCsv(
        rows.map((r) => ({
          headline: r.headline ?? '',
          suburb: r.suburb,
          state: r.state,
          listing_type: r.listing_type,
          status: r.status,
          price: r.is_price_hidden ? '' : (r.price_display ?? r.price ?? ''),
          views: r.view_count,
          enquiries: r.enquiry_count,
        })),
        'properties.csv',
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFilter = (key: keyof PropertyListParams, value: string) => {
    setFilters((f) => ({ ...f, [key]: value || undefined }));
    setPage(1);
  };

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Properties</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport} loading={isExporting}>
            Export CSV
          </Button>
          <Button onClick={() => navigate('/properties/new')}>+ New Listing</Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <Select
            options={LISTING_TYPE_OPTIONS}
            value={filters.listingType ?? ''}
            onChange={(e) => handleFilter('listingType', e.target.value)}
            className="w-36"
          />
          <Select
            options={STATUS_OPTIONS}
            value={filters.status ?? ''}
            onChange={(e) => handleFilter('status', e.target.value)}
            className="w-40"
          />
          <Input
            placeholder="Suburb..."
            value={filters.suburb ?? ''}
            onChange={(e) => handleFilter('suburb', e.target.value)}
            className="w-40"
          />
        </div>
      </Card>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-brand-primary/5 border border-brand-primary/20 rounded-btn px-4 py-2.5">
          <span className="text-sm font-medium text-brand-primary">{selected.size} selected</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => bulkMutation.mutate({ patch: { status: 'active' } })}
            loading={bulkMutation.isPending}
          >
            Activate
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => bulkMutation.mutate({ patch: { status: 'withdrawn' } })}
            loading={bulkMutation.isPending}
          >
            Withdraw
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => bulkMutation.mutate({ patch: { is_featured: true } })}
            loading={bulkMutation.isPending}
          >
            Feature
          </Button>
        </div>
      )}

      <Card className="p-0">
        <Table
          loading={isLoading}
          rows={items}
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'select',
              header: '',
              className: 'w-10',
              render: (r) => (
                <input
                  type="checkbox"
                  checked={selected.has(r.id)}
                  onChange={() => toggleSelect(r.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              ),
            },
            {
              key: 'headline',
              header: 'Address',
              render: (r) => (
                <div>
                  <p className="font-medium text-neutral-900">{r.headline ?? '—'}</p>
                  <p className="text-xs text-neutral-500">{r.suburb}, {r.state}</p>
                </div>
              ),
            },
            {
              key: 'listing_type',
              header: 'Type',
              render: (r) => <Badge variant="info">{r.listing_type}</Badge>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (r) => (
                <Badge variant={STATUS_VARIANT[r.status] ?? 'default'}>
                  {r.status.replace('_', ' ')}
                </Badge>
              ),
            },
            {
              key: 'price',
              header: 'Price',
              render: (r) =>
                r.is_price_hidden ? '—' : (r.price_display ?? (r.price ? `₹${r.price.toLocaleString()}` : '—')),
            },
            { key: 'view_count', header: 'Views' },
            { key: 'enquiry_count', header: 'Enquiries' },
            {
              key: 'actions',
              header: '',
              className: 'w-24',
              render: (r) => (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/properties/${r.id}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    loading={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm('Delete this property?')) deleteMutation.mutate(r.id);
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
