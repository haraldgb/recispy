import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from '../env.js';
import * as schema from './schema.js';

let pool: pg.Pool | null = null;
let db: NodePgDatabase<typeof schema> | null = null;

export function getDb(): NodePgDatabase<typeof schema> {
  if (!db) {
    pool = new pg.Pool({ connectionString: env().DATABASE_URL });
    db = drizzle(pool, { schema });
  }
  return db;
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}

export type Database = NodePgDatabase<typeof schema>;
export { schema };
