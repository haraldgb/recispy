import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { eq } from 'drizzle-orm';
import { SESSION_COOKIE } from './cookie.js';
import { verifySession } from './jwt.js';
import { ApiError } from '../errors.js';
import { getDb, schema } from '../db/client.js';

export async function sessionMiddleware(c: Context, next: Next) {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) throw new ApiError(401, 'unauthenticated', 'No session');
  let claims: { userId: number };
  try {
    claims = await verifySession(token);
  } catch {
    throw new ApiError(401, 'unauthenticated', 'Invalid session');
  }
  c.set('userId', claims.userId);
  c.set('isAllowed', null);
  await next();
}

export async function allowlistMiddleware(c: Context, next: Next) {
  const userId = c.get('userId') as number | undefined;
  if (!userId) throw new ApiError(401, 'unauthenticated', 'No session');
  const db = getDb();
  const rows = await db
    .select({ isAllowed: schema.users.isAllowed })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  if (rows.length === 0) throw new ApiError(401, 'unauthenticated', 'User missing');
  if (!rows[0]!.isAllowed) throw new ApiError(403, 'not_allowlisted', 'Not allowlisted');
  await next();
}
