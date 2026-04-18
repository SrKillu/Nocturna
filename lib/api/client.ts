'use client';

import { CSRF_COOKIE, CSRF_HEADER } from '@/lib/security/csrf.client';

/**
 * fetch() wrapper that automatically attaches the CSRF header for mutating
 * requests. The double-submit cookie is set by the middleware on every GET;
 * this helper just echoes it into `x-csrf-token`.
 */
function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const pattern = new RegExp(`(?:^|; )${name.replace(/[.$?*|{}()\[\]\\/+^]/g, '\\$&')}=([^;]*)`);
  const match = document.cookie.match(pattern);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? 'GET').toUpperCase();
  const mutating = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
  const headers = new Headers(init.headers);

  if (mutating) {
    const token = readCookie(CSRF_COOKIE);
    if (token) headers.set(CSRF_HEADER, token);
    if (!headers.has('content-type') && init.body) {
      headers.set('content-type', 'application/json');
    }
  }

  return fetch(input, { ...init, headers, credentials: 'same-origin' });
}
