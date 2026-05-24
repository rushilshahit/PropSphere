import { z } from 'zod';

export const createInspectionsSchema = z.object({
  slots: z
    .array(
      z.object({
        type: z.enum(['open_home', 'private']),
        starts_at: z.string().datetime(),
        ends_at: z.string().datetime(),
      }),
    )
    .min(1),
});

export type CreateInspectionsDto = z.infer<typeof createInspectionsSchema>;
