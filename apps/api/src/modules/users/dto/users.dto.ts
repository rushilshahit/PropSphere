import { z } from 'zod';

export const trackRecentlyViewedSchema = z.object({
  propertyId: z.string().uuid(),
});

export type TrackRecentlyViewedDto = z.infer<typeof trackRecentlyViewedSchema>;

export const updateProfileSchema = z.object({
  full_name: z.string().min(2).optional(),
  phone: z.string().optional(),
  role: z.enum(['buyer', 'seller', 'pending_agent']).optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
