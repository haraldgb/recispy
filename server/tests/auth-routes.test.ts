import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApp } from '../src/app.js';
import { createTestUser, makeTestDb } from './helpers.js';
import { signSession } from '../src/auth/jwt.js';
import { SESSION_COOKIE } from '../src/auth/cookie.js';

const fakeVerifier = vi.fn();
vi.mock('../src/auth/google.js', async () => {
  return {
    googleVerifier: () => fakeVerifier,
    makeGoogleVerifier: (await vi.importActual<any>('../src/auth/google.js')).makeGoogleVerifier,
  };
});

beforeEach(() => fakeVerifier.mockReset());

describe('POST /api/auth/google', () => {
  it('upserts user and sets cookie', async () => {
    fakeVerifier.mockResolvedValue({
      sub: 'g-1',
      email: 'a@b.com',
      name: 'Alice',
      pictureUrl: null,
    });
    const app = createApp();
    const res = await app.request('/api/auth/google', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id_token: 'fake' }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toContain(SESSION_COOKIE);
    const body = (await res.json()) as any;
    expect(body.user.email).toBe('a@b.com');
    expect(body.user.is_allowed).toBe(false);
  });

  it('400 on missing id_token', async () => {
    const app = createApp();
    const res = await app.request('/api/auth/google', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the cookie', async () => {
    const app = createApp();
    const res = await app.request('/api/auth/logout', { method: 'POST' });
    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toMatch(/recispy_session=;/);
  });
});

describe('GET /api/me', () => {
  it('returns the current user', async () => {
    const { pool } = makeTestDb();
    const user = await createTestUser(pool, { email: 'me@test.local' });
    const token = await signSession({ userId: user.id });
    const app = createApp();
    const res = await app.request('/api/me', {
      headers: { cookie: `${SESSION_COOKIE}=${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.user.email).toBe('me@test.local');
    await pool.end();
  });

  it('401 without cookie', async () => {
    const app = createApp();
    const res = await app.request('/api/me');
    expect(res.status).toBe(401);
  });
});
