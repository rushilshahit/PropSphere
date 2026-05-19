export const configuration = () => ({
  port: parseInt(process.env['PORT'] ?? '3001', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  supabase: {
    url: process.env['SUPABASE_URL'] ?? '',
    serviceKey: process.env['SUPABASE_SERVICE_KEY'] ?? '',
  },
  redis: {
    url: process.env['REDIS_URL'] ?? 'redis://localhost:6379',
  },
  resend: {
    apiKey: process.env['RESEND_API_KEY'] ?? '',
    fromEmail: process.env['RESEND_FROM_EMAIL'] ?? 'PropSphere <noreply@propsphere.app>',
    testRecipient: process.env['RESEND_TEST_RECIPIENT'] ?? '',
  },
  googleMaps: {
    serverKey: process.env['GOOGLE_MAPS_SERVER_KEY'] ?? '',
  },
});
