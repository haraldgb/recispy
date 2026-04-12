import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { sessionMiddleware, allowlistMiddleware } from '../src/auth/middleware.js';
import { signSession } from '../src/auth/jwt.js';
import { SESSION_COOKIE } from '../src/auth/cookie.js';
import { createTestUser, makeTestDb } from './helpers.js';
import { ApiError, errorResponse } from '../src/errors.js';

function appWith(handler: (app: Hono) => void) {
  const app = new Hono();
  app.onError((err, c) => {
    if (err instanceof ApiError) {
      return c.json(errorResponse(err.code, err.message), err.status as 400 | 401 | 403 | 404 | 422 | 500);
    }
    return c.json(errorResponse('internal', 'Internal server error'), 500);
  });
  handler(app);
  return app;
}

describe('sessionMiddleware', () => {
  it('returns 401 when no cookie present', async () => {
    const app = appWith((a) => {
      a.use('*', sessionMiddleware);
      a.get('/x', (c) => c.json({ ok: true }));
    });
    const res = await app.request('/x');
    expect(res.status).toBe(401);
  });

  it('attaches userId on valid cookie', async () => {
    const { pool } = makeTestDb();
    const user = await createTestUser(pool);
    const token = await signSession({ userId: user.id });
    const app = appWith((a) => {
      a.use('*', sessionMiddleware);
      a.get('/x', (c) => c.json({ userId: (c as any).get('userId') }));
    });
    const res = await app.request('/x', {
      headers: { cookie: `${SESSION_COOKIE}=${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { userId: number };
    expect(body.userId).toBe(user.id);
    await pool.end();
  });
});

describe('allowlistMiddleware', () => {
  it('returns 403 for non-allowlisted users', async () => {
    const { pool } = makeTestDb();
    const user = await createTestUser(pool, { isAllowed: false });
    const token = await signSession({ userId: user.id });
    const app = appWith((a) => {
      a.use('*', sessionMiddleware, allowlistMiddleware);
      a.get('/x', (c) => c.json({ ok: true }));
    });
    const res = await app.request('/x', {
      headers: { cookie: `${SESSION_COOKIE}=${token}` },
    });
    expect(res.status).toBe(403);
    await pool.end();
  });

  it('passes for allowlisted users', async () => {
    const { pool } = makeTestDb();
    const user = await createTestUser(pool, { isAllowed: true });
    const token = await signSession({ userId: user.id });
    const app = appWith((a) => {
      a.use('*', sessionMiddleware, allowlistMiddleware);
      a.get('/x', (c) => c.json({ ok: true }));
    });
    const res = await app.request('/x', {
      headers: { cookie: `${SESSION_COOKIE}=${token}` },
    });
    expect(res.status).toBe(200);
    await pool.end();
  });
});
