import { SignJWT, jwtVerify } from 'jose';
import { env } from '../env.js';

const ISSUER = 'recispy';

function secretKey(): Uint8Array {
  return new TextEncoder().encode(env().JWT_SECRET);
}

export type SessionClaims = { userId: number };

export async function signSession(
  claims: SessionClaims,
  expiresIn: string = '7d',
): Promise<string> {
  return await new SignJWT({ userId: claims.userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey());
}

export async function verifySession(token: string): Promise<SessionClaims> {
  const { payload } = await jwtVerify(token, secretKey(), { issuer: ISSUER });
  if (typeof payload.userId !== 'number') {
    throw new Error('invalid payload');
  }
  return { userId: payload.userId };
}
