import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAgent, createAgent, updateAgent } from '@/api/admin';
import { Button, Card, Input } from '@/components/ui';
import { useToast } from '@/components/providers/ToastProvider';

interface FormValues {
  profile_email: string;
  agency_id: string;
  license_no: string;
  bio: string;
  years_active: number;
  [key: string]: unknown;
}

export default function AgentFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['admin', 'agent', id],
    queryFn: () => getAgent(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      reset({
        agency_id: existing.agency_id,
        license_no: existing.license_no ?? '',
        bio: existing.bio ?? '',
        years_active: existing.years_active ?? undefined,
      });
    }
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormValues): Promise<unknown> =>
      isEdit ? updateAgent(id!, data) : createAgent(data),
    onSuccess: () => {
      toast(isEdit ? 'Agent updated' : 'Agent created', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'agents'] });
      navigate('/agents');
    },
    onError: (err) => toast(err instanceof Error ? err.message : 'Error', 'error'),
  });

  if (isEdit && loadingExisting) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-neutral-100 rounded-btn animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/agents')}>
          ← Back
        </Button>
        <h1 className="text-2xl font-bold text-neutral-900">
          {isEdit ? 'Edit Agent' : 'New Agent'}
        </h1>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <Card className="space-y-4">
          {!isEdit && (
            <Input
              label="User Email (link to existing profile)"
              type="email"
              {...register('profile_email', { required: !isEdit })}
              placeholder="user@example.com"
              error={errors.profile_email ? 'Required' : undefined}
            />
          )}
          {isEdit && existing && (
            <div className="text-sm text-neutral-500 bg-neutral-50 rounded-btn px-3 py-2">
              Linked profile: <span className="font-medium text-neutral-700">{existing.email}</span>
            </div>
          )}
          <Input
            label="Agency ID"
            {...register('agency_id', { required: true })}
            placeholder="Agency UUID"
            error={errors.agency_id ? 'Required' : undefined}
          />
          <Input label="License Number" {...register('license_no')} />
          <Input
            label="Years Active"
            type="number"
            {...register('years_active', { valueAsNumber: true })}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-neutral-700">Bio</label>
            <textarea
              className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-btn outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              rows={4}
              {...register('bio')}
              placeholder="About this agent..."
            />
          </div>
        </Card>

        <div className="flex justify-end mt-4">
          <Button type="submit" loading={mutation.isPending}>
            {isEdit ? 'Save Changes' : 'Create Agent'}
          </Button>
        </div>
      </form>
    </div>
  );
}
