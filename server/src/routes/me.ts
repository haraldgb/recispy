import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { sessionMiddleware } from '../auth/middleware.js';
import { getDb, schema } from '../db/client.js';
import { ApiError } from '../errors.js';

type Env = { Variables: { userId?: number; isAllowed?: boolean | null } };

export const meRoutes = new Hono<Env>();

meRoutes.get('/', sessionMiddleware, async (c) => {
  const userId = c.get('userId') as number;
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  if (rows.length === 0) throw new ApiError(401, 'unauthenticated', 'User missing');
  const u = rows[0]!;
  return c.json({
    user: {
      id: Number(u.id),
      email: u.email,
      name: u.name,
      picture_url: u.pictureUrl,
      is_allowed: u.isAllowed,
    },
  });
});
