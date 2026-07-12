import dotenv from 'dotenv';
dotenv.config();

const required = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    // Don't crash on import in dev tooling (e.g. prisma), just warn.
    // Real validation happens when server boots (see server.ts).
    return '';
  }
  return value;
};

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: required('DATABASE_URL'),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev-access-secret'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@gearup.com',
    password: process.env.ADMIN_PASSWORD || 'Admin123!',
    name: process.env.ADMIN_NAME || 'GearUp Admin',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    successUrl: process.env.CLIENT_SUCCESS_URL || 'http://localhost:5000/api/payments/success',
    cancelUrl: process.env.CLIENT_CANCEL_URL || 'http://localhost:5000/api/payments/cancel',
  },

  corsOrigin: process.env.CORS_ORIGIN || '*',
};

// Fail fast in production if critical secrets are missing/still using dev defaults.
export const assertRequiredEnv = (): void => {
  if (env.nodeEnv !== 'production') return;
  const missing: string[] = [];
  if (!env.databaseUrl) missing.push('DATABASE_URL');
  if (!process.env.JWT_ACCESS_SECRET) missing.push('JWT_ACCESS_SECRET');
  if (!process.env.JWT_REFRESH_SECRET) missing.push('JWT_REFRESH_SECRET');
  if (!env.stripe.secretKey) missing.push('STRIPE_SECRET_KEY');
  if (missing.length) {
    throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
  }
};
