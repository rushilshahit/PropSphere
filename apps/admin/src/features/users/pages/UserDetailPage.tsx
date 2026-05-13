import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUser, updateUser } from '@/api/admin';
import { Badge, Button, Card, Select } from '@/components/ui';
import { useToast } from '@/components/providers/ToastProvider';
import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/features/auth/store/authSlice';

const ROLE_OPTIONS = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'renter', label: 'Renter' },
  { value: 'seller', label: 'Seller' },
  { value: 'agent', label: 'Agent' },
  { value: 'admin', label: 'Admin' },
];

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const currentAdmin = useAppSelector(selectUser);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => getUser(id!),
  });

  const mutation = useMutation({
    mutationFn: (patch: { role?: string; is_suspended?: boolean }) =>
      updateUser(id!, patch),
    onSuccess: () => {
      toast('User updated', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  if (isLoading) return <p className="text-neutral-500">Loading...</p>;
  if (!data) return <p className="text-neutral-500">User not found.</p>;

  const isSelf = currentAdmin?.id === id;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/users')}>
          ← Back
        </Button>
        <h1 className="text-2xl font-bold text-neutral-900">User Detail</h1>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-lg">
            {(data.full_name ?? data.email)[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-lg">{data.full_name ?? '—'}</p>
            <p className="text-sm text-neutral-500">{data.email}</p>
          </div>
          <Badge variant={data.is_suspended ? 'danger' : 'success'} className="ml-auto">
            {data.is_suspended ? 'Suspended' : 'Active'}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-4 border-t border-neutral-100 pt-4">
          <div>
            <p className="text-xs text-neutral-500">Collections</p>
            <p className="font-semibold">{data.collections_count}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Saved Searches</p>
            <p className="font-semibold">{data.saved_searches_count}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Enquiries Sent</p>
            <p className="font-semibold">{data.enquiries_count}</p>
          </div>
        </div>

        <div className="border-t border-neutral-100 pt-4">
          <p className="text-xs text-neutral-500 mb-1">Joined</p>
          <p className="text-sm">{new Date(data.created_at).toLocaleDateString()}</p>
        </div>
      </Card>

      {!isSelf && (
        <Card className="space-y-4">
          <h2 className="font-semibold">Manage Account</h2>

          <Select
            label="Change Role"
            options={ROLE_OPTIONS}
            defaultValue={data.role}
            onChange={(e) => mutation.mutate({ role: e.target.value })}
          />

          <div className="flex gap-3 pt-2">
            {data.is_suspended ? (
              <Button
                variant="secondary"
                loading={mutation.isPending}
                onClick={() => mutation.mutate({ is_suspended: false })}
              >
                Reactivate Account
              </Button>
            ) : (
              <Button
                variant="danger"
                loading={mutation.isPending}
                onClick={() => {
                  if (confirm('Suspend this user?')) mutation.mutate({ is_suspended: true });
                }}
              >
                Suspend Account
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
