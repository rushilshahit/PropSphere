import { z } from 'zod';

export const createOfferSchema = z.object({
  propertyId:     z.string().uuid(),
  agentId:        z.string().uuid(),
  amount:         z.number().positive(),
  message:        z.string().max(500).optional(),
  isConfidential: z.boolean().default(false),
  senderName:     z.string().min(2),
  senderEmail:    z.string().email(),
  senderPhone:    z.string().optional(),
});

export type CreateOfferDto = z.infer<typeof createOfferSchema>;
