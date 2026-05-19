import { z } from 'zod';

export const agentApplicationSchema = z.object({
  agencyMode: z.enum(['join', 'create']),
  existingAgencyId: z.string().uuid().optional(),
  newAgency: z
    .object({
      name: z.string().min(2),
      address: z.string().min(5),
      phone: z.string().min(7),
    })
    .optional(),
  licenseNo: z.string().min(3),
  licenseDocUrl: z.string().url().optional(),
  bio: z.string().min(30),
  yearsActive: z.number().int().min(0).max(50),
  avatarUrl: z.string().url().optional(),
});

export type AgentApplicationDto = z.infer<typeof agentApplicationSchema>;
