import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { broadcastNotification, listNotifications } from '@/api/admin';
import { Badge, Button, Card, Input, Modal, Pagination, Select, Table } from '@/components/ui';
import { useToast } from '@/components/providers/ToastProvider';

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'new_listing', label: 'New Listing' },
  { value: 'price_drop', label: 'Price Drop' },
  { value: 'inspection_reminder', label: 'Inspection Reminder' },
  { value: 'enquiry_received', label: 'Enquiry Received' },
  { value: 'enquiry_replied', label: 'Enquiry Replied' },
];

interface BroadcastForm {
  title: string;
  body: string;
}

export default function NotificationsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'notifications', page, typeFilter],
    queryFn: () => listNotifications({ page, type: typeFilter || undefined }),
  });

  const { register, handleSubmit, reset } = useForm<BroadcastForm>();

  const broadcastMutation = useMutation({
    mutationFn: broadcastNotification,
    onSuccess: () => {
      toast('Broadcast sent to all users', 'success');
      setBroadcasting(false);
      reset();
      qc.invalidateQueries({ queryKey: ['admin', 'notifications'] });
    },
    onError: (err) => toast(err instanceof Error ? err.message : 'Error', 'error'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Notifications</h1>
        <Button onClick={() => setBroadcasting(true)}>📢 Broadcast</Button>
      </div>

      <Card className="p-4">
        <Select
          options={TYPE_OPTIONS}
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="w-48"
        />
      </Card>

      <Card className="p-0">
        <Table
          loading={isLoading}
          rows={data?.items ?? []}
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'user',
              header: 'User',
              render: (r) => <span className="text-xs text-neutral-500">{r.user_email}</span>,
            },
            { key: 'type', header: 'Type', render: (r) => <Badge variant="default">{r.type}</Badge> },
            { key: 'title', header: 'Title' },
            { key: 'body', header: 'Body', className: 'max-w-xs truncate' },
            {
              key: 'read',
              header: 'Read',
              render: (r) => <Badge variant={r.read ? 'success' : 'warning'}>{r.read ? 'Yes' : 'No'}</Badge>,
            },
            {
              key: 'sent_at',
              header: 'Sent',
              render: (r) => new Date(r.sent_at).toLocaleDateString(),
            },
          ]}
        />
        <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
      </Card>

      <Modal open={broadcasting} onClose={() => setBroadcasting(false)} title="Broadcast Notification">
        <form onSubmit={handleSubmit((d) => broadcastMutation.mutate(d))} className="space-y-4">
          <Input label="Title" {...register('title', { required: true })} placeholder="Platform announcement..." />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-neutral-700">Body</label>
            <textarea
              className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-btn outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              rows={4}
              {...register('body', { required: true })}
              placeholder="Your message to all users..."
            />
          </div>
          <p className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-btn px-3 py-2">
            This will send a push notification to all registered users.
          </p>
          <div className="flex justify-end">
            <Button type="submit" loading={broadcastMutation.isPending}>Send Broadcast</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
