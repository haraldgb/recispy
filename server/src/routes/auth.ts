import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { ApiError } from '../errors.js';
import { getDb, schema } from '../db/client.js';
import { googleVerifier } from '../auth/google.js';
import { signSession } from '../auth/jwt.js';
import { setSessionCookie, clearSessionCookie } from '../auth/cookie.js';

const bodySchema = z.object({ id_token: z.string().min(1) });

export const authRoutes = new Hono();

authRoutes.post('/google', async (c) => {
  let parsed: { id_token: string };
  try {
    parsed = bodySchema.parse(await c.req.json());
  } catch {
    throw new ApiError(400, 'invalid_input', 'id_token required');
  }

  const verify = googleVerifier();
  let g;
  try {
    g = await verify(parsed.id_token);
  } catch {
    throw new ApiError(401, 'unauthenticated', 'Invalid Google token');
  }

  const db = getDb();
  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.googleSub, g.sub))
    .limit(1);

  let userRow;
  if (existing.length > 0) {
    userRow = existing[0]!;
  } else {
    const inserted = await db
      .insert(schema.users)
      .values({
        googleSub: g.sub,
        email: g.email,
        name: g.name,
        pictureUrl: g.pictureUrl,
        isAllowed: false,
      })
      .returning();
    userRow = inserted[0]!;
  }

  const token = await signSession({ userId: Number(userRow.id) });
  setSessionCookie(c, token);

  return c.json({
    user: {
      id: Number(userRow.id),
      email: userRow.email,
      name: userRow.name,
      picture_url: userRow.pictureUrl,
      is_allowed: userRow.isAllowed,
    },
  });
});

authRoutes.post('/logout', (c) => {
  clearSessionCookie(c);
  return c.json({});
});
