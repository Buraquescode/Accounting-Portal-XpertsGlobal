// Reads .env once, validates every variable and exports a frozen `env` object.
// Failing here, at startup, gives a clear message instead of a confusing crash later.
import dotenv from 'dotenv';
import { z } from 'zod';

// Tests use their own database, so they load .env.test instead of .env.
dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env', quiet: true });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'is required'),
  JWT_SECRET: z.string().min(32, 'must be at least 32 characters (use a long random value)'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  COOKIE_NAME: z.string().default('portal_session'),
  CLIENT_ORIGIN: z.string().url(),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().positive().default(5),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
  throw new Error(`Invalid environment configuration:\n${lines.join('\n')}\nCheck backend/.env`);
}

export const env = Object.freeze(parsed.data);
