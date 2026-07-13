/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DEFAULT_ALLOWED_DOMAINS = ['d1aloga.com'];

function parseAllowedEmailDomains(raw: string | undefined): string[] {
  const domains = (raw ?? 'd1aloga.com')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  return domains.length > 0 ? domains : DEFAULT_ALLOWED_DOMAINS;
}

export const ALLOWED_EMAIL_DOMAINS = parseAllowedEmailDomains(
  import.meta.env.VITE_ALLOWED_EMAIL_DOMAINS
);

export function isAllowedEmail(email: string): boolean {
  const atIndex = email.lastIndexOf('@');
  if (atIndex < 0) {
    return false;
  }
  const domain = email.slice(atIndex + 1).toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
}

export function formatAllowedDomainsLabel(): string {
  if (ALLOWED_EMAIL_DOMAINS.length === 1) {
    return `@${ALLOWED_EMAIL_DOMAINS[0]}`;
  }
  return ALLOWED_EMAIL_DOMAINS.map((d) => `@${d}`).join(', ');
}

export const DOMAIN_RESTRICTED_MESSAGE =
  ALLOWED_EMAIL_DOMAINS.length === 1
    ? `Acceso restringido a cuentas @${ALLOWED_EMAIL_DOMAINS[0]}`
    : 'Acceso restringido a cuentas autorizadas';

export const SESSION_STORAGE_KEY = 'dialoga_auth_session';
