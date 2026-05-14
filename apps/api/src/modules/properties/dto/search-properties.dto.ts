import { z } from 'zod';

export const searchPropertiesSchema = z.object({
  listingType: z.enum(['buy', 'rent', 'sold']).default('buy'),
  query: z.string().optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  bedrooms: z.coerce.number().optional(),
  bathrooms: z.coerce.number().optional(),
  carSpaces: z.coerce.number().optional(),
  propertyTypes: z.string().optional(), // comma-separated
  features: z.string().optional(),      // comma-separated
  sortBy: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
  publishedSince: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(50).default(24),
});

export type SearchPropertiesDto = z.infer<typeof searchPropertiesSchema>;
