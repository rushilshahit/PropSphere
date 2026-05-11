import { z } from 'zod';

export const CreateSavedSearchSchema = z.object({
  name: z.string().min(1).max(100),
  filters: z.record(z.unknown()),
  alertFreq: z.enum(['instant', 'daily', 'weekly']),
});

export const UpdateSavedSearchSchema = z.object({
  alertEnabled: z.boolean().optional(),
  alertFreq: z.enum(['instant', 'daily', 'weekly']).optional(),
});

export type CreateSavedSearchDto = z.infer<typeof CreateSavedSearchSchema>;
export type UpdateSavedSearchDto = z.infer<typeof UpdateSavedSearchSchema>;
