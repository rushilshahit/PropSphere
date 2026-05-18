import { z } from 'zod';

export const batchPropertiesSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(20),
});

export type BatchPropertiesDto = z.infer<typeof batchPropertiesSchema>;
