import { z } from 'zod';

export const boundingBoxSchema = z.object({
  swLat: z.coerce.number(),
  swLng: z.coerce.number(),
  neLat: z.coerce.number(),
  neLng: z.coerce.number(),
});

export type BoundingBoxDto = z.infer<typeof boundingBoxSchema>;
