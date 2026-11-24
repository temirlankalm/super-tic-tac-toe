/**
 * Shared analytics & admin constants and host helpers (Edge & Node compatible).
 */

export const ADMIN_COOKIE_NAME = 'sttt_admin_session';
export const ADMIN_BADGE_COOKIE_NAME = 'sttt_admin_badge';

/**
 * Checks whether an incoming HTTP request host corresponds to the admin subdomain.
 * Matches: admin.ttt.temr.dev, admin.localhost, or any admin.* subdomain.
 */
export function isAdminHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const cleanHost = host.split(':')[0].toLowerCase();
  return (
    cleanHost === 'admin.ttt.temr.dev' ||
    cleanHost === 'admin.localhost' ||
    cleanHost.startsWith('admin.')
  );
}

function extractCleanHost(hostOrReq: { headers: { get: (k: string) => string | null } } | string | null | undefined): string {
  let host = '';
  if (typeof hostOrReq === 'string') {
    host = hostOrReq;
  } else if (hostOrReq && typeof hostOrReq === 'object' && 'headers' in hostOrReq) {
    host = hostOrReq.headers.get('x-forwarded-host') || hostOrReq.headers.get('host') || '';
  }
  return host.split(':')[0].toLowerCase();
}

/**
 * Resolves the cookie domain for admin.ttt.temr.dev scoping.
 * Scopes to admin.ttt.temr.dev in production; leaves undefined on localhost for host-only cookies.
 */
export function getAdminCookieDomain(hostOrReq: { headers: { get: (k: string) => string | null } } | string | null | undefined): string | undefined {
  const cleanHost = extractCleanHost(hostOrReq);
  if (cleanHost === 'admin.ttt.temr.dev') {
    return 'admin.ttt.temr.dev';
  }
  return undefined;
}

/**
 * Resolves the cookie domain for the non-privileged admin visibility badge (.ttt.temr.dev).
 * Allows ttt.temr.dev to show the "analytics" button exclusively to the authenticated admin,
 * while keeping the privileged session cookie strictly scoped to admin.ttt.temr.dev.
 */
export function getAdminBadgeCookieDomain(hostOrReq: { headers: { get: (k: string) => string | null } } | string | null | undefined): string | undefined {
  const cleanHost = extractCleanHost(hostOrReq);
  if (cleanHost === 'ttt.temr.dev' || cleanHost.endsWith('.ttt.temr.dev')) {
    return '.ttt.temr.dev';
  }
  return undefined;
}
