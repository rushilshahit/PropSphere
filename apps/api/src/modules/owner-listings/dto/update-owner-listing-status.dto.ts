import { z } from 'zod';

export const updateOwnerListingStatusSchema = z.object({
  status: z.enum(['active', 'withdrawn', 'sold', 'leased']),
});

export type UpdateOwnerListingStatusDto = z.infer<typeof updateOwnerListingStatusSchema>;
