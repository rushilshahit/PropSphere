import { z } from 'zod';

export const updateOwnerListingSchema = z.object({
  property_type: z.enum(['house', 'apartment', 'townhouse', 'unit', 'land', 'rural']).optional(),
  listing_type: z.enum(['buy', 'rent']).optional(),
  sale_method: z.enum(['private_treaty', 'auction', 'tender']).optional(),
  unit_number: z.string().optional(),
  street_number: z.string().min(1).optional(),
  street_name: z.string().min(1).optional(),
  suburb: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  postcode: z.string().min(4).max(10).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  car_spaces: z.number().int().min(0).optional(),
  land_size_sqm: z.number().positive().optional(),
  build_size_sqm: z.number().positive().optional(),
  price: z.number().positive().optional(),
  price_min: z.number().positive().optional(),
  price_max: z.number().positive().optional(),
  price_display: z.string().optional(),
  is_price_hidden: z.boolean().optional(),
  headline: z.string().min(10).max(150).optional(),
  description: z.string().min(20).optional(),
  features: z.array(z.string()).optional(),
  available_from: z.string().datetime({ offset: true }).optional(),
  auction_at: z.string().datetime({ offset: true }).optional(),
});

export type UpdateOwnerListingDto = z.infer<typeof updateOwnerListingSchema>;
