import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app.js';

describe('createApp', () => {
  it('responds 200 on GET /api/health', async () => {
    const app = createApp();
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it('returns 404 JSON envelope on unknown route', async () => {
    const app = createApp();
    const res = await app.request('/api/nope');
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('not_found');
  });
});
