import { OAuth2Client } from 'google-auth-library';
import { env } from '../env.js';

export type GoogleUser = {
  sub: string;
  email: string;
  name: string | null;
  pictureUrl: string | null;
};

type VerifierClient = Pick<OAuth2Client, 'verifyIdToken'>;

export function makeGoogleVerifier(client: VerifierClient, audience: string) {
  return async function verify(idToken: string): Promise<GoogleUser> {
    const ticket = await client.verifyIdToken({ idToken, audience });
    const payload = ticket.getPayload();
    if (!payload) throw new Error('google: missing payload');
    if (payload.email_verified !== true) throw new Error('google: email not verified');
    return {
      sub: payload.sub,
      email: payload.email ?? '',
      name: payload.name ?? null,
      pictureUrl: payload.picture ?? null,
    };
  };
}

let cached: ReturnType<typeof makeGoogleVerifier> | null = null;
export function googleVerifier() {
  if (!cached) {
    const clientId = env().GOOGLE_CLIENT_ID;
    cached = makeGoogleVerifier(new OAuth2Client(clientId), clientId);
  }
  return cached;
}
