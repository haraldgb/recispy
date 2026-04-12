import { afterAll, beforeAll, beforeEach } from 'vitest';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import * as schema from '../src/db/schema.js';

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ??
  'postgres://recispy:devpassword@127.0.0.1:5432/recispy_test';

process.env.DATABASE_URL = TEST_DB_URL;
process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
process.env.GOOGLE_CLIENT_ID = 'test.apps.googleusercontent.com';
process.env.JWT_SECRET = 'a'.repeat(32);
process.env.PORT = '0';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'fatal';

let pool: pg.Pool;

beforeAll(async () => {
  pool = new pg.Pool({ connectionString: TEST_DB_URL });
  const db = drizzle(pool, { schema });
  await migrate(db, { migrationsFolder: './src/db/migrations' });
});

beforeEach(async () => {
  await pool.query(
    'TRUNCATE TABLE user_notes, utensils, method_steps, ingredients, recipes, users RESTART IDENTITY CASCADE',
  );
});

afterAll(async () => {
  await pool.end();
});
