import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAgency, createAgency, updateAgency } from '@/api/admin';
import { Button, Card, Input } from '@/components/ui';
import { useToast } from '@/components/providers/ToastProvider';

interface FormValues {
  name: string;
  slug: string;
  website: string;
  phone: string;
  suburb: string;
  state: string;
  postcode: string;
  [key: string]: unknown;
}

export default function AgencyFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['admin', 'agency', id],
    queryFn: () => getAgency(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        slug: existing.slug,
        website: existing.website ?? '',
        phone: existing.phone ?? '',
        suburb: existing.suburb,
        state: existing.state,
        postcode: existing.postcode ?? '',
      });
    }
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormValues): Promise<unknown> =>
      isEdit ? updateAgency(id!, data) : createAgency(data),
    onSuccess: () => {
      toast(isEdit ? 'Agency updated' : 'Agency created', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'agencies'] });
      navigate('/agencies');
    },
    onError: (err) => toast(err instanceof Error ? err.message : 'Error', 'error'),
  });

  if (isEdit && loadingExisting) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-neutral-100 rounded-btn animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/agencies')}>
          ← Back
        </Button>
        <h1 className="text-2xl font-bold text-neutral-900">
          {isEdit ? 'Edit Agency' : 'New Agency'}
        </h1>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <Card className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Agency Name"
              {...register('name', { required: true })}
              error={errors.name ? 'Required' : undefined}
            />
            <Input
              label="Slug"
              {...register('slug', { required: true })}
              placeholder="e.g. ray-white-ahmedabad"
              error={errors.slug ? 'Required' : undefined}
            />
          </div>
          <Input label="Website" type="url" {...register('website')} placeholder="https://..." />
          <Input label="Phone" {...register('phone')} placeholder="+91 ..." />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Suburb" {...register('suburb')} />
            <Input label="State" {...register('state')} placeholder="GJ" />
            <Input label="Postcode" {...register('postcode')} />
          </div>
        </Card>

        <div className="flex justify-end mt-4">
          <Button type="submit" loading={mutation.isPending}>
            {isEdit ? 'Save Changes' : 'Create Agency'}
          </Button>
        </div>
      </form>
    </div>
  );
}
