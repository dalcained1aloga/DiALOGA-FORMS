/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OAuth2Client } from 'google-auth-library';

const DEFAULT_ALLOWED_DOMAINS = ['d1aloga.com'];

function parseAllowedEmailDomains(raw: string | undefined): string[] {
  const domains = (raw ?? 'd1aloga.com')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  return domains.length > 0 ? domains : DEFAULT_ALLOWED_DOMAINS;
}

const ALLOWED_EMAIL_DOMAINS = parseAllowedEmailDomains(process.env.ALLOWED_EMAIL_DOMAINS);

function isEmailDomainAllowed(email: string): boolean {
  const atIndex = email.lastIndexOf('@');
  if (atIndex < 0) {
    return false;
  }
  const domain = email.slice(atIndex + 1).toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
}

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
    if (!isEmailDomainAllowed(email)) {
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
  const domainHint =
    ALLOWED_EMAIL_DOMAINS.length === 1
      ? `@${ALLOWED_EMAIL_DOMAINS[0]}`
      : 'an authorized organization';
  return {
    success: false,
    error: `Unauthorized. Sign in with a verified ${domainHint} Google account.`,
  };
}
