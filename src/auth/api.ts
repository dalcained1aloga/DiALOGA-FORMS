/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function authFetch(idToken: string, input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${idToken}`);
  return fetch(input, { ...init, headers });
}
