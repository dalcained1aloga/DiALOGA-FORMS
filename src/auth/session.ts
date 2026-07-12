/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SESSION_STORAGE_KEY } from './constants';
import type { StoredSession } from './types';

export function loadStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const session = JSON.parse(raw) as StoredSession;
    if (!session.idToken || !session.email || !session.expiresAt) {
      return null;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (session.expiresAt <= nowSeconds) {
      clearStoredSession();
      return null;
    }

    return session;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function saveStoredSession(session: StoredSession): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}
