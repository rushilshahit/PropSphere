import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, ChevronRight, Check, ImagePlus, X, Plus, Trash2 } from 'lucide-react';
import {
  useCreateOwnerListing,
  uploadListingImages,
  useCreateInspections,
  type CreateOwnerListingInput,
  type InspectionSlot,
} from '@/api/owner-listings';
import { useToast } from '@/components/providers/ToastProvider';
import { Spinner } from '@/components/ui';

const schema = z.object({
  listing_type: z.enum(['buy', 'rent']),
  property_type: z.enum(['house', 'apartment', 'townhouse', 'unit', 'land', 'rural']),
  sale_method: z.string().optional(),
  unit_number: z.string().optional(),
  street_number: z.string().min(1, 'Required'),
  street_name: z.string().min(1, 'Required'),
  suburb: z.string().min(1, 'Required'),
  state: z.string().min(1, 'Required'),
  postcode: z.string().min(4, 'Required').max(10),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  car_spaces: z.number().int().min(0),
  land_size: z.string().optional(),
  build_size: z.string().optional(),
  price_type: z.enum(['fixed', 'range', 'contact']),
  price: z.string().optional(),
  price_min: z.string().optional(),
  price_max: z.string().optional(),
  price_display: z.string().optional(),
  is_price_hidden: z.boolean(),
  headline: z.string().min(10, 'Min 10 characters').max(150, 'Max 150 characters'),
  description: z.string().min(20, 'Min 20 characters'),
  features: z.array(z.string()),
  auction_at: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const PROPERTY_TYPES = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'unit', label: 'Unit' },
  { value: 'land', label: 'Land' },
  { value: 'rural', label: 'Rural' },
] as const;

const SALE_METHODS = [
  { value: 'private_treaty', label: 'Private Treaty' },
  { value: 'auction', label: 'Auction' },
  { value: 'tender', label: 'Tender' },
] as const;

const FEATURES = [
  'Air Conditioning', 'Built-in Wardrobes', 'Swimming Pool', 'Gym',
  'Lift/Elevator', 'Security System', 'Power Backup', 'Modular Kitchen',
  'Study Room', 'Parking', 'Gated Community', 'Club House',
  'Garden/Terrace', 'Solar Panels', 'Rainwater Harvesting', 'Vastu Compliant',
];

const STEPS = ['Type', 'Location', 'Details', 'Description', 'Photos', 'Inspections'];

const STEP_FIELDS: Record<number, (keyof FormValues)[]> = {
  0: ['listing_type', 'property_type'],
  1: ['street_number', 'street_name', 'suburb', 'state', 'postcode', 'lat', 'lng'],
  2: ['bedrooms', 'bathrooms'],
  3: ['headline', 'description'],
  4: [],
  5: [],
};

const inputCls =
  'w-full px-3 py-2 text-sm border border-neutral-200 rounded-btn focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary';
const labelCls = 'block text-xs font-medium text-neutral-700 mb-1.5';
const errCls = 'text-xs text-red-600 mt-1';

interface PhotoEntry {
  file: File;
  url: string;
}

interface InspectionDraft {
  date: string;
  startTime: string;
  endTime: string;
  type: 'open_home' | 'private';
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

export default function PostPropertyPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [geocoding, setGeocoding] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Photos state
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inspections state
  const [inspections, setInspections] = useState<InspectionDraft[]>([]);

  const { mutateAsync: createListingAsync } = useCreateOwnerListing();
  const { mutateAsync: createInspectionsAsync } = useCreateInspections();

  const { register, control, handleSubmit, watch, setValue, trigger, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        listing_type: 'buy',
        property_type: 'house',
        sale_method: 'private_treaty',
        bedrooms: 3,
        bathrooms: 2,
        car_spaces: 1,
        price_type: 'fixed',
        is_price_hidden: false,
        features: [],
        lat: 23.0225,
        lng: 72.5714,
      },
    });

  const listingType = watch('listing_type');
  const priceType = watch('price_type');
  const saleMethod = watch('sale_method');
  const suburb = watch('suburb');
  const state = watch('state');
  const postcode = watch('postcode');

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => { photos.forEach((p) => URL.revokeObjectURL(p.url)); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!suburb || !state || !postcode || postcode.length < 4) return;
    const timer = setTimeout(async () => {
      setGeocoding(true);
      try {
        const q = encodeURIComponent(`${suburb} ${state} ${postcode} India`);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
        );
        const data = (await res.json()) as Array<{ lat: string; lon: string }>;
        if (data[0]) {
          setValue('lat', parseFloat(data[0].lat));
          setValue('lng', parseFloat(data[0].lon));
        }
      } catch {
        // keep Ahmedabad defaults
      } finally {
        setGeocoding(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [suburb, state, postcode, setValue]);

  async function handleNext() {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => s + 1);
  }

  function handleAddPhotos(files: FileList | null) {
    if (!files) return;
    const newEntries = Array.from(files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newEntries]);
  }

  function handleRemovePhoto(idx: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
  }

  function handleAddInspection() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setInspections((prev) => [
      ...prev,
      { date: dateStr, startTime: '10:00', endTime: '10:30', type: 'open_home' },
    ]);
  }

  function handleRemoveInspection(idx: number) {
    setInspections((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateInspection(idx: number, patch: Partial<InspectionDraft>) {
    setInspections((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  async function onSubmit(values: FormValues) {
    const { price_type, land_size, build_size, price, price_min, price_max, price_display, ...rest } = values;
    const dto: CreateOwnerListingInput = { ...rest };

    if (land_size) dto.land_size_sqm = parseFloat(land_size);
    if (build_size) dto.build_size_sqm = parseFloat(build_size);
    if (price_type === 'fixed' && price) dto.price = parseFloat(price);
    if (price_type === 'range') {
      if (price_min) dto.price_min = parseFloat(price_min);
      if (price_max) dto.price_max = parseFloat(price_max);
    }
    if (price_type === 'contact') dto.price_display = price_display || 'Contact Agent';
    if (saleMethod !== 'auction' || listingType !== 'buy') delete dto.auction_at;

    setSubmitting(true);
    try {
      const { id: propertyId } = await createListingAsync(dto);

      if (photos.length > 0) {
        await uploadListingImages(propertyId, photos.map((p) => p.file));
      }

      if (inspections.length > 0) {
        const slots: InspectionSlot[] = inspections.map((s) => ({
          type: s.type,
          starts_at: new Date(`${s.date}T${s.startTime}:00`).toISOString(),
          ends_at: new Date(`${s.date}T${s.endTime}:00`).toISOString(),
        }));
        await createInspectionsAsync({ propertyId, slots });
      }

      toast('Property listed successfully!', 'success');
      navigate(`/account/my-listings/${propertyId}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to create listing', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link
          to="/account/my-listings"
          className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 mb-4 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> My Listings
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">Post Your Property</h1>
        <p className="text-sm text-neutral-500 mt-1">List your property for free — takes about 3 minutes</p>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center flex-1 gap-1">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold shrink-0 transition-colors
                ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-brand-primary text-white' : 'bg-neutral-100 text-neutral-400'}`}
            >
              {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span
              className={`text-xs font-medium hidden sm:block mr-1 ${i === step ? 'text-neutral-900' : 'text-neutral-400'}`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px ${i < step ? 'bg-green-400' : 'bg-neutral-200'}`} />
            )}
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
            e.preventDefault();
          }
        }}
      >
        <div className="bg-white rounded-card shadow-card p-6">

          {/* ── Step 0: Type ─────────────────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <label className={labelCls}>Listing Type</label>
                <Controller
                  name="listing_type"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-3">
                      {(['buy', 'rent'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => field.onChange(t)}
                          className={`flex-1 py-2.5 rounded-btn text-sm font-medium border transition-colors
                            ${field.value === t
                              ? 'bg-brand-primary text-white border-brand-primary'
                              : 'border-neutral-200 text-neutral-600 hover:border-brand-primary/50'}`}
                        >
                          {t === 'buy' ? 'For Sale' : 'For Rent'}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              <div>
                <label className={labelCls}>Property Type</label>
                <Controller
                  name="property_type"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-3 gap-2">
                      {PROPERTY_TYPES.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => field.onChange(t.value)}
                          className={`py-2.5 rounded-btn text-sm font-medium border transition-colors
                            ${field.value === t.value
                              ? 'bg-brand-primary/10 text-brand-primary border-brand-primary'
                              : 'border-neutral-200 text-neutral-600 hover:border-brand-primary/50'}`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              {listingType === 'buy' && (
                <div>
                  <label className={labelCls}>Sale Method</label>
                  <Controller
                    name="sale_method"
                    control={control}
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-2">
                        {SALE_METHODS.map((m) => (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => field.onChange(m.value)}
                            className={`px-4 py-2 rounded-btn text-sm font-medium border transition-colors
                              ${field.value === m.value
                                ? 'bg-brand-primary/10 text-brand-primary border-brand-primary'
                                : 'border-neutral-200 text-neutral-600 hover:border-brand-primary/50'}`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Step 1: Address ──────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className={labelCls}>Unit No.</label>
                  <input {...register('unit_number')} placeholder="3B" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Plot/Bldg No. *</label>
                  <input {...register('street_number')} placeholder="42" className={inputCls} />
                  {errors.street_number && <p className={errCls}>{errors.street_number.message}</p>}
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Street / Road *</label>
                  <input {...register('street_name')} placeholder="MG Road" className={inputCls} />
                  {errors.street_name && <p className={errCls}>{errors.street_name.message}</p>}
                </div>
              </div>
              <div>
                <label className={labelCls}>Area / Locality *</label>
                <input {...register('suburb')} placeholder="e.g. Satellite, Prahlad Nagar" className={inputCls} />
                {errors.suburb && <p className={errCls}>{errors.suburb.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>State *</label>
                  <input {...register('state')} placeholder="e.g. Gujarat" className={inputCls} />
                  {errors.state && <p className={errCls}>{errors.state.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Pincode *</label>
                  <input {...register('postcode')} placeholder="380015" maxLength={10} className={inputCls} />
                  {errors.postcode && <p className={errCls}>{errors.postcode.message}</p>}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelCls} style={{ marginBottom: 0 }}>Coordinates</label>
                  {geocoding && (
                    <span className="flex items-center gap-1 text-xs text-neutral-400">
                      <Spinner size="sm" /> Auto-locating…
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mb-2">
                  Auto-filled from address above — override manually if needed.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Latitude *</label>
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
                    <label className={labelCls}>Longitude *</label>
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
            </div>
          )}

          {/* ── Step 2: Details & Pricing ────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-neutral-800 mb-4">Property Details</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {(['bedrooms', 'bathrooms', 'car_spaces'] as const).map((f) => (
                    <div key={f} className="text-center">
                      <p className="text-xs font-medium text-neutral-700 mb-2">
                        {f === 'bedrooms' ? 'Bedrooms' : f === 'bathrooms' ? 'Bathrooms' : 'Car Spaces'}
                      </p>
                      <Controller
                        name={f}
                        control={control}
                        render={({ field }) => (
                          <div className="flex justify-center">
                            <Counter value={field.value} onChange={field.onChange} />
                          </div>
                        )}
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Land Size (sqm)</label>
                    <input {...register('land_size')} type="number" min="1" placeholder="200" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Build Size (sqm)</label>
                    <input {...register('build_size')} type="number" min="1" placeholder="150" className={inputCls} />
                  </div>
                </div>
              </div>

              <div className="border-t border-neutral-100 pt-5">
                <h3 className="text-sm font-semibold text-neutral-800 mb-4">Pricing</h3>
                <Controller
                  name="price_type"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(['fixed', 'range', 'contact'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => field.onChange(t)}
                          className={`px-4 py-2 rounded-btn text-sm font-medium border transition-colors
                            ${field.value === t
                              ? 'bg-brand-primary/10 text-brand-primary border-brand-primary'
                              : 'border-neutral-200 text-neutral-600 hover:border-brand-primary/50'}`}
                        >
                          {t === 'fixed' ? 'Fixed Price' : t === 'range' ? 'Price Range' : 'Contact Agent'}
                        </button>
                      ))}
                    </div>
                  )}
                />

                {priceType === 'fixed' && (
                  <div>
                    <label className={labelCls}>Price (₹)</label>
                    <input {...register('price')} type="number" min="1" placeholder="e.g. 7500000" className={inputCls} />
                  </div>
                )}
                {priceType === 'range' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Min Price (₹)</label>
                      <input {...register('price_min')} type="number" min="1" placeholder="6000000" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Max Price (₹)</label>
                      <input {...register('price_max')} type="number" min="1" placeholder="8500000" className={inputCls} />
                    </div>
                  </div>
                )}
                {priceType === 'contact' && (
                  <div>
                    <label className={labelCls}>Display Text</label>
                    <input {...register('price_display')} placeholder="e.g. Contact for Price" className={inputCls} />
                  </div>
                )}

                {listingType === 'buy' && saleMethod === 'auction' && (
                  <div className="mt-3">
                    <label className={labelCls}>Auction Date & Time</label>
                    <input {...register('auction_at')} type="datetime-local" className={inputCls} />
                  </div>
                )}

                <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
                  <Controller
                    name="is_price_hidden"
                    control={control}
                    render={({ field: f }) => (
                      <input
                        type="checkbox"
                        checked={f.value}
                        onChange={(e) => f.onChange(e.target.checked)}
                        className="rounded border-neutral-300 text-brand-primary focus:ring-brand-primary/30"
                      />
                    )}
                  />
                  <span className="text-sm text-neutral-700">Hide price from listing</span>
                </label>
              </div>
            </div>
          )}

          {/* ── Step 3: Description & Features ──────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Headline *</label>
                <input
                  {...register('headline')}
                  maxLength={150}
                  placeholder="e.g. Spacious 3BHK with Modern Finishes in Satellite"
                  className={inputCls}
                />
                {errors.headline && <p className={errCls}>{errors.headline.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Description *</label>
                <textarea
                  {...register('description')}
                  rows={5}
                  placeholder="Describe the property — key features, condition, nearby amenities…"
                  className={`${inputCls} resize-none`}
                />
                {errors.description && <p className={errCls}>{errors.description.message}</p>}
              </div>
              <div>
                <label className={labelCls}>
                  Features <span className="font-normal text-neutral-400">(optional)</span>
                </label>
                <Controller
                  name="features"
                  control={control}
                  render={({ field: f }) => (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {FEATURES.map((feat) => {
                        const active = f.value.includes(feat);
                        return (
                          <button
                            key={feat}
                            type="button"
                            onClick={() =>
                              f.onChange(
                                active ? f.value.filter((v) => v !== feat) : [...f.value, feat],
                              )
                            }
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-btn text-xs border transition-colors text-left
                              ${active
                                ? 'bg-brand-primary/10 text-brand-primary border-brand-primary'
                                : 'border-neutral-200 text-neutral-600 hover:border-brand-primary/50'}`}
                          >
                            {active && <Check className="w-3 h-3 shrink-0" />}
                            {feat}
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              </div>
            </div>
          )}

          {/* ── Step 4: Photos ───────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-800">Property Photos</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {photos.length} photo{photos.length !== 1 ? 's' : ''} selected
                    {' '}— first photo will be the hero image
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-sm font-medium text-brand-primary border border-brand-primary/30 px-3 py-1.5 rounded-btn hover:bg-brand-primary/5 transition-colors"
                >
                  <ImagePlus className="w-4 h-4" />
                  Add Photos
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleAddPhotos(e.target.files)}
                />
              </div>

              {photos.length === 0 ? (
                <div
                  className="border-2 border-dashed border-neutral-200 rounded-btn py-14 text-center text-neutral-400 cursor-pointer hover:border-brand-primary hover:text-brand-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">Click to upload photos</p>
                  <p className="text-xs mt-1">JPG, PNG, WebP — multiple files supported</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {photos.map((photo, idx) => (
                    <div
                      key={photo.url}
                      className="relative group rounded-btn overflow-hidden bg-neutral-100 aspect-[4/3]"
                    >
                      <img
                        src={photo.url}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {idx === 0 && (
                        <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                          Hero
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                        aria-label="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {/* Add more tile */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-[4/3] border-2 border-dashed border-neutral-200 rounded-btn flex flex-col items-center justify-center text-neutral-400 hover:border-brand-primary hover:text-brand-primary transition-colors"
                  >
                    <ImagePlus className="w-5 h-5 mb-1" />
                    <span className="text-xs">Add more</span>
                  </button>
                </div>
              )}
              <p className="text-xs text-neutral-400">
                Photos are optional but significantly increase enquiry rates.
              </p>
            </div>
          )}

          {/* ── Step 5: Inspections ──────────────────────────────────── */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-800">Inspection Times</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Let buyers/renters know when they can inspect the property
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddInspection}
                  className="flex items-center gap-1.5 text-sm font-medium text-brand-primary border border-brand-primary/30 px-3 py-1.5 rounded-btn hover:bg-brand-primary/5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Time
                </button>
              </div>

              {inspections.length === 0 ? (
                <div className="border-2 border-dashed border-neutral-200 rounded-btn py-10 text-center text-neutral-400">
                  <p className="text-sm font-medium">No inspection times added</p>
                  <p className="text-xs mt-1">Optional — you can add these later from My Listings</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inspections.map((slot, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-end bg-neutral-50 rounded-btn p-3"
                    >
                      <div>
                        <label className={labelCls}>Date</label>
                        <input
                          type="date"
                          value={slot.date}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => updateInspection(idx, { date: e.target.value })}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Start</label>
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateInspection(idx, { startTime: e.target.value })}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>End</label>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateInspection(idx, { endTime: e.target.value })}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Type</label>
                        <select
                          value={slot.type}
                          onChange={(e) =>
                            updateInspection(idx, { type: e.target.value as 'open_home' | 'private' })
                          }
                          className={inputCls}
                        >
                          <option value="open_home">Open Home</option>
                          <option value="private">Private</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveInspection(idx)}
                        className="mb-0.5 w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-btn transition-colors"
                        aria-label="Remove inspection"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <Link
              to="/account/my-listings"
              className="text-sm font-medium text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              Cancel
            </Link>
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 bg-brand-primary text-white text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-brand-primary/90 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 bg-brand-primary text-white text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting && <Spinner size="sm" />}
              Publish Listing
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
