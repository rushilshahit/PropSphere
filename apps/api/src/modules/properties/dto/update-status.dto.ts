import { z } from 'zod';

export const updateStatusSchema = z.object({
  status: z.string().min(1),
  soldPrice: z.number().positive().optional(),
  soldAt: z.string().optional(),
});

export type UpdateStatusDto = z.infer<typeof updateStatusSchema>;
