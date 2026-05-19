import { z } from 'zod';

export const createEnquirySchema = z.object({
  property_id: z.string().uuid().optional(),
  agent_id: z.string().uuid(),
  sender_name: z.string().min(1),
  sender_email: z.string().email(),
  sender_phone: z.string().optional(),
  message: z.string().min(10),
});

export type CreateEnquiryDto = z.infer<typeof createEnquirySchema>;
