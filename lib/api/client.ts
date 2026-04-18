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
    // Only set JSON Content-Type for plain JSON bodies. FormData/Blob/URLSearchParams
    // bodies must let the browser choose the correct Content-Type (and boundary).
    const body = init.body;
    const isJsonBody =
      typeof body === 'string' ||
      (body != null &&
        typeof body === 'object' &&
        !(body instanceof FormData) &&
        !(body instanceof Blob) &&
        !(body instanceof URLSearchParams) &&
        !(typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer));
    if (!headers.has('content-type') && body && isJsonBody) {
      headers.set('content-type', 'application/json');
    }
  }

  return fetch(input, { ...init, headers, credentials: 'same-origin' });
}
