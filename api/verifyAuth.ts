/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OAuth2Client } from 'google-auth-library';

const ALLOWED_EMAIL_SUFFIX = '@d1aloga.com';

export interface VerifiedGoogleUser {
  email: string;
  name?: string;
  picture?: string;
}

function extractBearerToken(authHeader: string | string[] | undefined): string | null {
  const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!header?.startsWith('Bearer ')) {
    return null;
  }
  const token = header.slice('Bearer '.length).trim();
  return token || null;
}

export async function verifyGoogleIdToken(
  authHeader: string | string[] | undefined
): Promise<VerifiedGoogleUser | null> {
  const idToken = extractBearerToken(authHeader);
  if (!idToken) {
    return null;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    console.error('GOOGLE_CLIENT_ID environment variable is not set');
    return null;
  }

  const client = new OAuth2Client(clientId);

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload?.email || payload.email_verified !== true) {
      return null;
    }

    const email = payload.email.toLowerCase();
    if (!email.endsWith(ALLOWED_EMAIL_SUFFIX)) {
      return null;
    }

    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Google ID token verification failed:', message);
    return null;
  }
}

export function unauthorizedResponse() {
  return {
    success: false,
    error: 'Unauthorized. Sign in with a verified @d1aloga.com Google account.',
  };
}
