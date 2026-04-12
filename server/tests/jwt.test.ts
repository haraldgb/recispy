import { describe, it, expect } from 'vitest';
import { signSession, verifySession } from '../src/auth/jwt.js';

describe('session jwt', () => {
  it('round-trips a user id', async () => {
    const token = await signSession({ userId: 42 });
    const claims = await verifySession(token);
    expect(claims.userId).toBe(42);
  });

  it('rejects a tampered token', async () => {
    const token = await signSession({ userId: 1 });
    const tampered = token.slice(0, -2) + 'xx';
    await expect(verifySession(tampered)).rejects.toThrow();
  });

  it('rejects an expired token', async () => {
    const token = await signSession({ userId: 1 }, '1s');
    await new Promise((r) => setTimeout(r, 1100));
    await expect(verifySession(token)).rejects.toThrow();
  });
});
