import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProperty, createProperty, updateProperty } from '@/api/admin';
import { Button, Card, Input, Select } from '@/components/ui';
import { useToast } from '@/components/providers/ToastProvider';

const STEPS = [
  'Basic Info',
  'Address',
  'Specs',
  'Pricing',
  'Content',
  'Media',
  'Inspection Times',
  'Assignment',
  'Preview & Publish',
];

const PROPERTY_TYPE_OPTIONS = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'unit', label: 'Unit' },
  { value: 'land', label: 'Land' },
  { value: 'rural', label: 'Rural' },
];

const LISTING_TYPE_OPTIONS = [
  { value: 'buy', label: 'Buy' },
  { value: 'rent', label: 'Rent' },
  { value: 'sold', label: 'Sold' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'under_offer', label: 'Under Offer' },
  { value: 'sold', label: 'Sold' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const SALE_METHOD_OPTIONS = [
  { value: 'private_treaty', label: 'Private Treaty' },
  { value: 'auction', label: 'Auction' },
  { value: 'tender', label: 'Tender' },
];

type FormValues = Record<string, unknown>;

const toNumOrNull = (v: unknown): number | null => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
};

export default function PropertyFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>();

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['admin', 'property', id],
    queryFn: () => getProperty(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      reset({
        property_type: existing.property_type,
        listing_type: existing.listing_type,
        sale_method: existing.sale_method ?? '',
        status: existing.status,
        unit_number: existing.unit_number ?? '',
        street_number: existing.street_number ?? '',
        street_name: existing.street_name ?? '',
        suburb: existing.suburb,
        state: existing.state,
        postcode: existing.postcode ?? '',
        lat: existing.lat ?? undefined,
        lng: existing.lng ?? undefined,
        bedrooms: existing.bedrooms ?? undefined,
        bathrooms: existing.bathrooms ?? undefined,
        car_spaces: existing.car_spaces ?? undefined,
        land_size_sqm: existing.land_size_sqm ?? undefined,
        build_size_sqm: existing.build_size_sqm ?? undefined,
        price: existing.price ?? undefined,
        price_min: existing.price_min ?? undefined,
        price_max: existing.price_max ?? undefined,
        price_display: existing.price_display ?? '',
        is_price_hidden: existing.is_price_hidden,
        auction_at: existing.auction_at ? existing.auction_at.slice(0, 16) : '',
        headline: existing.headline ?? '',
        description: existing.description ?? '',
        agent_id: existing.agent_id,
        agency_id: existing.agency_id,
        is_featured: existing.is_featured,
      });
    }
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormValues): Promise<unknown> =>
      isEdit ? updateProperty(id!, data) : createProperty(data),
    onSuccess: () => {
      toast(isEdit ? 'Listing updated' : 'Listing created', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'properties'] });
      navigate('/properties');
    },
    onError: (err) => toast(err instanceof Error ? err.message : 'Error', 'error'),
  });

  const onSubmit = (data: FormValues) => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    // inspection fields go to a separate table — strip them from the property payload
    const { inspection_date: _d, inspection_start: _s, inspection_end: _e, ...payload } = data;
    // empty string is not a valid timestamptz — coerce to null
    if (payload.auction_at === '') payload.auction_at = null;
    mutation.mutate(payload);
  };

  if (isEdit && loadingExisting) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-neutral-100 rounded-btn animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/properties')}>
          ← Back
        </Button>
        <h1 className="text-2xl font-bold text-neutral-900">
          {isEdit ? 'Edit Listing' : 'New Listing'}
        </h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={`shrink-0 px-3 py-1.5 rounded-badge text-xs font-medium transition-colors ${
              i === step
                ? 'bg-brand-primary text-white'
                : i < step
                ? 'bg-green-100 text-green-700'
                : 'bg-neutral-100 text-neutral-500'
            }`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="space-y-4">
          {step === 0 && (
            <>
              <Select label="Property Type" options={PROPERTY_TYPE_OPTIONS} {...register('property_type', { required: true })} placeholder="Select type" />
              <Select label="Listing Type" options={LISTING_TYPE_OPTIONS} {...register('listing_type', { required: true })} placeholder="Select listing type" />
              <Select label="Sale Method" options={SALE_METHOD_OPTIONS} {...register('sale_method')} placeholder="Select method" />
              <Select label="Status" options={STATUS_OPTIONS} {...register('status')} placeholder="Select status" />
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Unit Number" {...register('unit_number')} placeholder="e.g. 4" />
                <Input label="Street Number" {...register('street_number', { required: true })} placeholder="e.g. 12" error={errors['street_number'] ? 'Required' : undefined} />
              </div>
              <Input label="Street Name" {...register('street_name', { required: true })} placeholder="e.g. Main Street" />
              <div className="grid grid-cols-3 gap-4">
                <Input label="Suburb" {...register('suburb', { required: true })} placeholder="e.g. Ahmedabad" />
                <Input label="State" {...register('state', { required: true })} placeholder="e.g. GJ" />
                <Input label="Postcode" {...register('postcode', { required: true })} placeholder="e.g. 380001" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Latitude" type="number" step="any" {...register('lat', { setValueAs: toNumOrNull })} />
                <Input label="Longitude" type="number" step="any" {...register('lng', { setValueAs: toNumOrNull })} />
              </div>
            </>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Bedrooms" type="number" {...register('bedrooms', { setValueAs: toNumOrNull })} />
              <Input label="Bathrooms" type="number" {...register('bathrooms', { setValueAs: toNumOrNull })} />
              <Input label="Car Spaces" type="number" {...register('car_spaces', { setValueAs: toNumOrNull })} />
              <Input label="Land Size (m²)" type="number" {...register('land_size_sqm', { setValueAs: toNumOrNull })} />
              <Input label="Build Size (m²)" type="number" {...register('build_size_sqm', { setValueAs: toNumOrNull })} />
            </div>
          )}

          {step === 3 && (
            <>
              <Input label="Price (₹)" type="number" {...register('price', { setValueAs: toNumOrNull })} placeholder="e.g. 5000000" />
              <Input label="Price Min" type="number" {...register('price_min', { setValueAs: toNumOrNull })} />
              <Input label="Price Max" type="number" {...register('price_max', { setValueAs: toNumOrNull })} />
              <Input label="Display Text" {...register('price_display')} placeholder="e.g. Contact Agent" />
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input type="checkbox" {...register('is_price_hidden')} />
                Hide price publicly
              </label>
              <Input label="Auction Date & Time" type="datetime-local" {...register('auction_at')} />
            </>
          )}

          {step === 4 && (
            <>
              <Input label="Headline" {...register('headline')} placeholder="Beautiful family home..." />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-neutral-700">Description</label>
                <textarea
                  className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-btn outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  rows={6}
                  {...register('description')}
                  placeholder="Describe the property..."
                />
              </div>
            </>
          )}

          {step === 5 && (
            <div className="text-center py-8 text-neutral-500">
              <p>Image uploader — connect to Supabase Storage in production.</p>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 border border-neutral-200 rounded-btn p-4">
                <Input label="Date" type="date" {...register('inspection_date')} />
                <Input label="Start Time" type="time" {...register('inspection_start')} />
                <Input label="End Time" type="time" {...register('inspection_end')} />
              </div>
              <p className="text-xs text-neutral-400">Multiple inspection slots can be added after initial save.</p>
            </div>
          )}

          {step === 7 && (
            <>
              <Input label="Agent ID" {...register('agent_id')} placeholder="Search agent by email..." />
              <Input label="Agency ID" {...register('agency_id')} placeholder="Search agency..." />
            </>
          )}

          {step === 8 && (
            <div className="text-center py-6 space-y-4">
              <p className="text-neutral-600">Review all details and publish the listing.</p>
              <label className="flex items-center gap-2 justify-center text-sm text-neutral-700">
                <input type="checkbox" {...register('is_featured')} />
                Mark as featured
              </label>
            </div>
          )}
        </Card>

        <div className="flex justify-between mt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Previous
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {step < STEPS.length - 1 ? 'Next' : isEdit ? 'Save Changes' : 'Create Listing'}
          </Button>
        </div>
      </form>
    </div>
  );
}
