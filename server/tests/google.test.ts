import { describe, it, expect, vi } from 'vitest';
import { makeGoogleVerifier } from '../src/auth/google.js';

describe('google verifier', () => {
  it('returns user info from a valid token', async () => {
    const fakeClient = {
      verifyIdToken: vi.fn().mockResolvedValue({
        getPayload: () => ({
          sub: 'google-sub-1',
          email: 'a@b.com',
          name: 'Alice',
          picture: 'http://img',
          email_verified: true,
        }),
      }),
    } as any;
    const verify = makeGoogleVerifier(fakeClient, 'client-id');
    const user = await verify('fake-token');
    expect(user).toEqual({
      sub: 'google-sub-1',
      email: 'a@b.com',
      name: 'Alice',
      pictureUrl: 'http://img',
    });
  });

  it('throws on missing payload', async () => {
    const fakeClient = {
      verifyIdToken: vi.fn().mockResolvedValue({ getPayload: () => null }),
    } as any;
    const verify = makeGoogleVerifier(fakeClient, 'client-id');
    await expect(verify('x')).rejects.toThrow();
  });

  it('throws on unverified email', async () => {
    const fakeClient = {
      verifyIdToken: vi.fn().mockResolvedValue({
        getPayload: () => ({
          sub: 's',
          email: 'a@b.com',
          email_verified: false,
        }),
      }),
    } as any;
    const verify = makeGoogleVerifier(fakeClient, 'client-id');
    await expect(verify('x')).rejects.toThrow(/verified/);
  });
});
