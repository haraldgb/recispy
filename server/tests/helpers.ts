import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../src/db/schema.js';

export function makeTestDb() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  return { db: drizzle(pool, { schema }), pool };
}

export async function createTestUser(
  pool: pg.Pool,
  overrides: Partial<{ email: string; isAllowed: boolean; googleSub: string; name: string }> = {},
): Promise<{ id: number; email: string; isAllowed: boolean }> {
  const email = overrides.email ?? `user${Date.now()}@test.local`;
  const sub = overrides.googleSub ?? `sub-${Date.now()}-${Math.random()}`;
  const isAllowed = overrides.isAllowed ?? true;
  const name = overrides.name ?? 'Test User';
  const result = await pool.query<{ id: number }>(
    `INSERT INTO users (google_sub, email, name, is_allowed) VALUES ($1,$2,$3,$4) RETURNING id`,
    [sub, email, name, isAllowed],
  );
  return { id: Number(result.rows[0]!.id), email, isAllowed };
}
