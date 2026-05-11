import { z } from 'zod';

export const webEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_MAPBOX_TOKEN: z.string().min(1),
  VITE_API_BASE_URL: z.string().url(),
  VITE_POSTHOG_KEY: z.string().optional(),
});

export const apiEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  REDIS_URL: z.string().url(),
  RESEND_API_KEY: z.string().min(1),
  FCM_SERVER_KEY: z.string().optional(),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type WebEnv = z.infer<typeof webEnvSchema>;
export type ApiEnv = z.infer<typeof apiEnvSchema>;
