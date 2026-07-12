/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AuthUser {
  email: string;
  name: string;
  picture?: string;
}

export interface StoredSession extends AuthUser {
  idToken: string;
  expiresAt: number;
}
