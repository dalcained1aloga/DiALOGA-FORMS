/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface GoogleIdTokenPayload {
  email?: string;
  name?: string;
  picture?: string;
  exp?: number;
  email_verified?: boolean;
}

export function decodeGoogleIdToken(token: string): GoogleIdTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json) as GoogleIdTokenPayload;
  } catch {
    return null;
  }
}
