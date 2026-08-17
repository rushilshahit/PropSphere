import { useNavigate } from 'react-router-dom';
import { Controller } from 'react-hook-form';
import { ArrowLeft, Save } from 'lucide-react';
import { Button, Spinner } from '@/components/ui';
import {
  useEditPropertyForm,
  PROPERTY_TYPES,
  SALE_METHODS,
  FEATURES,
  type EditPropertyForm,
} from '../hooks/useEditPropertyForm';
import { PropertyImageManager } from '../components/PropertyImageManager';

const inputCls =
  'w-full px-3 py-2 text-sm border border-neutral-200 rounded-btn focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary';
const labelCls = 'block text-xs font-medium text-neutral-700 mb-1.5';
const errCls = 'text-xs text-red-600 mt-1';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-card shadow-card p-6">
      <h2 className="text-sm font-semibold text-neutral-700 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Counter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-8 h-8 rounded-full border border-neutral-300 text-neutral-600 hover:bg-neutral-100 flex items-center justify-center text-base leading-none transition-colors"
      >
        −
      </button>
      <span className="w-5 text-center text-sm font-semibold text-neutral-900">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(20, value + 1))}
        className="w-8 h-8 rounded-full border border-neutral-300 text-neutral-600 hover:bg-neutral-100 flex items-center justify-center text-base leading-none transition-colors"
      >
        +
      </button>
    </div>
  );
}

export default function EditPropertyPage() {
  const navigate = useNavigate();
  const { listing, isLoading, isSaving, form, onSubmit } = useEditPropertyForm();
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = form;

  const listingType = watch('listing_type');
  const features = watch('features');

  function toggleFeature(feature: string) {
    const current = features ?? [];
    setValue(
      'features',
      current.includes(feature) ? current.filter((f) => f !== feature) : [...current, feature],
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
      }}
      className="max-w-2xl mx-auto space-y-5 pb-10"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/dashboard/listings')}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to listings
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold text-neutral-900">Edit listing</h1>
        </div>
        <Button type="submit" loading={isSaving} className="flex items-center gap-1.5">
          <Save className="w-4 h-4" />
          Save changes
        </Button>
      </div>

      {/* Listing type */}
      <Section title="Listing type">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Property type</label>
            <select {...register('property_type')} className={inputCls}>
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Listing for</label>
            <select {...register('listing_type')} className={inputCls}>
              <option value="buy">Sale</option>
              <option value="rent">Rent</option>
            </select>
          </div>
        </div>
        {listingType === 'buy' && (
          <div className="mt-4">
            <label className={labelCls}>Sale method</label>
            <select {...register('sale_method')} className={inputCls}>
              <option value="">Select method</option>
              {SALE_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        )}
      </Section>

      {/* Location */}
      <Section title="Location">
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className={labelCls}>Unit no.</label>
              <input {...register('unit_number')} placeholder="e.g. 3A" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Street no. *</label>
              <input {...register('street_number')} className={inputCls} />
              {errors.street_number && <p className={errCls}>{errors.street_number.message}</p>}
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Street name *</label>
              <input {...register('street_name')} className={inputCls} />
              {errors.street_name && <p className={errCls}>{errors.street_name.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Suburb *</label>
              <input {...register('suburb')} className={inputCls} />
              {errors.suburb && <p className={errCls}>{errors.suburb.message}</p>}
            </div>
            <div>
              <label className={labelCls}>State *</label>
              <select {...register('state')} className={inputCls}>
                {['AN', 'AP', 'AR', 'AS', 'BR', 'CG', 'CH', 'DH', 'DL', 'GA', 'GJ', 'HP',
                  'HR', 'JH', 'JK', 'KA', 'KL', 'LA', 'LD', 'MH', 'ML', 'MN', 'MP', 'MZ',
                  'NL', 'OD', 'PB', 'PY', 'RJ', 'SK', 'TG', 'TN', 'TR', 'UP', 'UT', 'WB',
                ].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.state && <p className={errCls}>{errors.state.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Postcode *</label>
              <input {...register('postcode')} className={inputCls} />
              {errors.postcode && <p className={errCls}>{errors.postcode.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Latitude</label>
              <input
                {...register('lat', { valueAsNumber: true })}
                type="number"
                step="any"
                placeholder="e.g. 23.0225"
                className={inputCls}
              />
              {errors.lat && <p className={errCls}>{errors.lat.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Longitude</label>
              <input
                {...register('lng', { valueAsNumber: true })}
                type="number"
                step="any"
                placeholder="e.g. 72.5714"
                className={inputCls}
              />
              {errors.lng && <p className={errCls}>{errors.lng.message}</p>}
            </div>
          </div>
        </div>
      </Section>

      {/* Property details */}
      <Section title="Property details">
        <div className="grid grid-cols-3 gap-6 mb-4">
          {(
            [
              { name: 'bedrooms', label: 'Bedrooms' },
              { name: 'bathrooms', label: 'Bathrooms' },
              { name: 'car_spaces', label: 'Car spaces' },
            ] as { name: keyof EditPropertyForm; label: string }[]
          ).map(({ name, label }) => (
            <div key={name}>
              <label className={labelCls}>{label}</label>
              <Controller
                name={name}
                control={control}
                render={({ field }) => (
                  <Counter
                    value={(field.value as number) ?? 0}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Land size (sqm)</label>
            <input
              {...register('land_size_sqm', { valueAsNumber: true })}
              type="number"
              step="any"
              min="0"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Build size (sqm)</label>
            <input
              {...register('build_size_sqm', { valueAsNumber: true })}
              type="number"
              step="any"
              min="0"
              className={inputCls}
            />
          </div>
        </div>
      </Section>

      {/* Description */}
      <Section title="Description">
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Headline *</label>
            <input {...register('headline')} className={inputCls} placeholder="e.g. Spacious 3BHK in prime location" />
            {errors.headline && <p className={errCls}>{errors.headline.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Description *</label>
            <textarea
              {...register('description')}
              rows={5}
              className={`${inputCls} resize-none`}
              placeholder="Describe the property..."
            />
            {errors.description && <p className={errCls}>{errors.description.message}</p>}
          </div>
        </div>
      </Section>

      {/* Pricing */}
      <Section title="Pricing">
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Price (₹)</label>
              <input
                {...register('price', { valueAsNumber: true })}
                type="number"
                min="0"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Price min (₹)</label>
              <input
                {...register('price_min', { valueAsNumber: true })}
                type="number"
                min="0"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Price max (₹)</label>
              <input
                {...register('price_max', { valueAsNumber: true })}
                type="number"
                min="0"
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Price display text</label>
            <input
              {...register('price_display')}
              placeholder="e.g. Contact for price"
              className={inputCls}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('is_price_hidden')} className="rounded" />
            <span className="text-sm text-neutral-700">Hide price from listing</span>
          </label>
        </div>
      </Section>

      {/* Photos */}
      {listing && (
        <Section title="Photos">
          <PropertyImageManager propertyId={listing.id} />
        </Section>
      )}

      {/* Features */}
      <Section title="Features">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FEATURES.map((f) => (
            <label key={f} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(features ?? []).includes(f)}
                onChange={() => toggleFeature(f)}
                className="rounded"
              />
              <span className="text-sm text-neutral-700">{f}</span>
            </label>
          ))}
        </div>
      </Section>
    </form>
  );
}
