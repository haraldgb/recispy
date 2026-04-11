import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  TEST_DATABASE_URL: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  PORT: z.coerce.number().int().positive(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),
});

export type Env = z.infer<typeof schema>;

export function parseEnv(input: Record<string, string | undefined>): Env {
  return schema.parse(input);
}

let cached: Env | null = null;
export function env(): Env {
  if (!cached) cached = parseEnv(process.env);
  return cached;
}
