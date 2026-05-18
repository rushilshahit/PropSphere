import { z } from 'zod';

export const createCollectionSchema = z.object({
  name: z.string().min(1).max(100),
});
export type CreateCollectionDto = z.infer<typeof createCollectionSchema>;

export const addPropertySchema = z.object({
  propertyId: z.string().uuid(),
  notes: z.string().max(500).optional(),
});
export type AddPropertyDto = z.infer<typeof addPropertySchema>;

export const updateNoteSchema = z.object({
  notes: z.string().max(500),
});
export type UpdateNoteDto = z.infer<typeof updateNoteSchema>;
