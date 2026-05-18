import { z } from 'zod';

export const trackRecentlyViewedSchema = z.object({
  propertyId: z.string().uuid(),
});

export type TrackRecentlyViewedDto = z.infer<typeof trackRecentlyViewedSchema>;
