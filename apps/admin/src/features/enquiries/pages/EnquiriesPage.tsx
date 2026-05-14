import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exportAllEnquiries, listEnquiries, updateEnquiryStatus, type AdminEnquiry } from '@/api/admin';
import { exportToCsv } from '@/lib/csv';
import { Badge, Button, Card, Modal, Pagination, Select, Table } from '@/components/ui';
import { useToast } from '@/components/providers/ToastProvider';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
  { value: 'archived', label: 'Archived' },
];

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  new: 'warning',
  read: 'default',
  replied: 'success',
  archived: 'info',
};

export default function EnquiriesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<AdminEnquiry | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'enquiries', page, statusFilter],
    queryFn: () => listEnquiries({ page, status: statusFilter || undefined }),
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const rows = await exportAllEnquiries({ status: statusFilter || undefined });
      exportToCsv(
        rows.map((r) => ({
          sender_name: r.sender_name,
          sender_email: r.sender_email,
          property_address: r.property_address,
          agent_name: r.agent_name ?? '',
          status: r.status,
          received: new Date(r.created_at).toLocaleDateString(),
        })),
        'enquiries.csv',
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateEnquiryStatus(id, status),
    onSuccess: () => {
      toast('Status updated', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'enquiries'] });
      setSelected(null);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Enquiries</h1>
        <Button variant="secondary" onClick={handleExport} loading={isExporting}>
          Export CSV
        </Button>
      </div>

      <Card className="p-4">
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="w-40"
        />
      </Card>

      <Card className="p-0">
        <Table
          loading={isLoading}
          rows={data?.items ?? []}
          keyExtractor={(r) => r.id}
          onRowClick={(r) => setSelected(r)}
          columns={[
            {
              key: 'sender',
              header: 'From',
              render: (r) => (
                <div>
                  <p className="font-medium">{r.sender_name}</p>
                  <p className="text-xs text-neutral-400">{r.sender_email}</p>
                </div>
              ),
            },
            { key: 'property_address', header: 'Property' },
            { key: 'agent_name', header: 'Agent' },
            {
              key: 'status',
              header: 'Status',
              render: (r) => (
                <Badge variant={STATUS_VARIANT[r.status] ?? 'default'}>{r.status}</Badge>
              ),
            },
            {
              key: 'created_at',
              header: 'Received',
              render: (r) => new Date(r.created_at).toLocaleDateString(),
            },
          ]}
        />
        <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
      </Card>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Enquiry Detail"
      >
        {selected && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-neutral-500">From</p>
              <p className="font-medium">{selected.sender_name}</p>
              <p className="text-sm text-neutral-600">{selected.sender_email}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Property</p>
              <p className="text-sm">{selected.property_address}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Message</p>
              <p className="text-sm bg-neutral-50 rounded-btn p-3 whitespace-pre-wrap">{selected.message}</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="secondary"
                loading={statusMutation.isPending}
                onClick={() => statusMutation.mutate({ id: selected.id, status: 'read' })}
              >
                Mark Read
              </Button>
              <Button
                size="sm"
                variant="ghost"
                loading={statusMutation.isPending}
                onClick={() => statusMutation.mutate({ id: selected.id, status: 'archived' })}
              >
                Archive
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
