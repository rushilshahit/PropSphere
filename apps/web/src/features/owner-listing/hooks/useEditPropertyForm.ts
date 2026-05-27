import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/components/providers/ToastProvider';
import { useOwnerListingDetail, useUpdateOwnerListing } from '@/api/owner-listings';
import type { CreateOwnerListingInput } from '@/api/owner-listings';

export const editSchema = z.object({
  property_type: z.enum(['house', 'apartment', 'townhouse', 'unit', 'land', 'rural']),
  listing_type: z.enum(['buy', 'rent']),
  sale_method: z.string().optional(),
  unit_number: z.string().optional(),
  street_number: z.string().min(1, 'Required'),
  street_name: z.string().min(1, 'Required'),
  suburb: z.string().min(1, 'Required'),
  state: z.string().min(1, 'Required'),
  postcode: z.string().min(4, 'Required').max(10),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  car_spaces: z.number().int().min(0).optional(),
  land_size_sqm: z.number().positive().optional(),
  build_size_sqm: z.number().positive().optional(),
  price: z.number().positive().optional(),
  price_min: z.number().positive().optional(),
  price_max: z.number().positive().optional(),
  price_display: z.string().optional(),
  is_price_hidden: z.boolean(),
  headline: z.string().min(10, 'Min 10 characters').max(150, 'Max 150 characters'),
  description: z.string().min(20, 'Min 20 characters'),
  features: z.array(z.string()),
});

export type EditPropertyForm = z.infer<typeof editSchema>;

export const PROPERTY_TYPES = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'unit', label: 'Unit' },
  { value: 'land', label: 'Land' },
  { value: 'rural', label: 'Rural' },
] as const;

export const SALE_METHODS = [
  { value: 'private_treaty', label: 'Private Treaty' },
  { value: 'auction', label: 'Auction' },
  { value: 'tender', label: 'Tender' },
] as const;

export const FEATURES = [
  'Air Conditioning', 'Built-in Wardrobes', 'Swimming Pool', 'Gym',
  'Lift/Elevator', 'Security System', 'Power Backup', 'Modular Kitchen',
  'Study Room', 'Parking', 'Gated Community', 'Club House',
  'Garden/Terrace', 'Solar Panels', 'Rainwater Harvesting', 'Vastu Compliant',
];

export function useEditPropertyForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: listing, isLoading } = useOwnerListingDetail(id ?? '');
  const { mutate: update, isPending: isSaving } = useUpdateOwnerListing(id ?? '');

  const form = useForm<EditPropertyForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      bedrooms: 0,
      bathrooms: 0,
      car_spaces: 0,
      is_price_hidden: false,
      features: [],
    },
  });

  useEffect(() => {
    if (!listing) return;
    form.reset({
      property_type: listing.property_type as EditPropertyForm['property_type'],
      listing_type: listing.listing_type as EditPropertyForm['listing_type'],
      sale_method: listing.sale_method ?? undefined,
      unit_number: listing.unit_number ?? '',
      street_number: listing.street_number,
      street_name: listing.street_name,
      suburb: listing.suburb,
      state: listing.state,
      postcode: listing.postcode,
      lat: listing.lat ?? undefined,
      lng: listing.lng ?? undefined,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      car_spaces: listing.car_spaces ?? 0,
      land_size_sqm: listing.land_size_sqm ?? undefined,
      build_size_sqm: listing.build_size_sqm ?? undefined,
      price: listing.price ?? undefined,
      price_min: listing.price_min ?? undefined,
      price_max: listing.price_max ?? undefined,
      price_display: listing.price_display ?? '',
      is_price_hidden: listing.is_price_hidden,
      headline: listing.headline,
      description: listing.description,
      features: listing.features ?? [],
    });
  }, [listing, form]);

  function onSubmit(values: EditPropertyForm) {
    const dto: Partial<CreateOwnerListingInput> = {};
    for (const [key, value] of Object.entries(values)) {
      if (value === '' || value === undefined || value === null) continue;
      if (typeof value === 'number' && isNaN(value)) continue;
      (dto as Record<string, unknown>)[key] = value;
    }
    update(dto, {
      onSuccess: () => {
        toast('Listing updated', 'success');
        navigate('/dashboard/listings');
      },
      onError: (err) => {
        toast(err instanceof Error ? err.message : 'Update failed', 'error');
      },
    });
  }

  return { listing, isLoading, isSaving, form, onSubmit };
}
