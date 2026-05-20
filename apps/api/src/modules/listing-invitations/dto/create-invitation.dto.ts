import { z } from 'zod';

export const createInvitationSchema = z.object({
  propertyId: z.string().uuid(),
  agentId: z.string().uuid(),
  message: z.string().max(500).optional(),
});

export type CreateInvitationDto = z.infer<typeof createInvitationSchema>;
