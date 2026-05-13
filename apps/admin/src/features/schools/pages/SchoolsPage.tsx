import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { createSchool, deleteSchool, importSchoolsCsv, listSchools, updateSchool } from '@/api/admin';
import { Button, Card, Input, Modal, Pagination, Select, Table } from '@/components/ui';
import { useToast } from '@/components/providers/ToastProvider';

interface SchoolFormValues {
  name: string;
  type: string;
  sector: string;
  suburb: string;
  state: string;
  postcode: string;
  rating: number | null;
  lat: number | null;
  lng: number | null;
  [key: string]: unknown;
}

const toNumOrNull = (v: unknown): number | null => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
};

const TYPE_OPTIONS = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'combined', label: 'Combined' },
];

const SECTOR_OPTIONS = [
  { value: 'govt', label: 'Government' },
  { value: 'catholic', label: 'Catholic' },
  { value: 'independent', label: 'Independent' },
];

export default function SchoolsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'schools', page],
    queryFn: () => listSchools(page),
  });

  const { register, handleSubmit, reset } = useForm<SchoolFormValues>();

  const saveMutation = useMutation({
    mutationFn: (d: SchoolFormValues): Promise<unknown> =>
      modalMode === 'edit' && editId
        ? updateSchool(editId, d)
        : createSchool(d),
    onSuccess: () => {
      toast(modalMode === 'edit' ? 'School updated' : 'School created', 'success');
      setModalMode(null);
      qc.invalidateQueries({ queryKey: ['admin', 'schools'] });
    },
    onError: (err) => toast(err instanceof Error ? err.message : 'Failed to save school', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSchool,
    onSuccess: () => {
      toast('School deleted', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'schools'] });
    },
    onError: (err) => toast(err instanceof Error ? err.message : 'Failed to delete school', 'error'),
  });

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await importSchoolsCsv(file);
    toast('CSV imported', 'success');
    qc.invalidateQueries({ queryKey: ['admin', 'schools'] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Schools</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            Import CSV
          </Button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
          <Button onClick={() => { reset({}); setModalMode('create'); }}>+ New School</Button>
        </div>
      </div>

      <Card className="p-0">
        <Table
          loading={isLoading}
          rows={data?.items ?? []}
          keyExtractor={(r) => r.id}
          columns={[
            { key: 'name', header: 'School' },
            { key: 'type', header: 'Type' },
            { key: 'sector', header: 'Sector' },
            { key: 'suburb', header: 'Suburb' },
            { key: 'state', header: 'State' },
            {
              key: 'rating',
              header: 'Rating',
              render: (r) => r.rating ? `${r.rating}/5` : '—',
            },
            {
              key: 'actions',
              header: '',
              className: 'w-24',
              render: (r) => (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      reset({ name: r.name, type: r.type, sector: r.sector, suburb: r.suburb, state: r.state, postcode: r.postcode, rating: r.rating, lat: r.lat, lng: r.lng });
                      setEditId(r.id);
                      setModalMode('edit');
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    loading={deleteMutation.isPending}
                    onClick={() => { if (confirm('Delete school?')) deleteMutation.mutate(r.id); }}
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

      <Modal
        open={modalMode !== null}
        onClose={() => setModalMode(null)}
        title={modalMode === 'edit' ? 'Edit School' : 'New School'}
      >
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
          <Input label="Name" {...register('name', { required: true })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Type" options={TYPE_OPTIONS} {...register('type', { required: true })} placeholder="Select type" />
            <Select label="Sector" options={SECTOR_OPTIONS} {...register('sector', { required: true })} placeholder="Select sector" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Suburb" {...register('suburb')} />
            <Input label="State" {...register('state')} />
            <Input label="Postcode" {...register('postcode')} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Rating (0-5)" type="number" step="0.1" min="0" max="5" {...register('rating', { setValueAs: toNumOrNull })} />
            <Input label="Latitude" type="number" step="any" {...register('lat', { setValueAs: toNumOrNull })} />
            <Input label="Longitude" type="number" step="any" {...register('lng', { setValueAs: toNumOrNull })} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={saveMutation.isPending}>
              {modalMode === 'edit' ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
