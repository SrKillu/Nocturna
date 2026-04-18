import { NextRequest } from 'next/server';

/**
 * Factory for NextRequest objects used by unit tests.
 *
 * We only wire the subset of HTTP metadata our middleware / security layers
 * actually look at (method, URL, headers, cookies). The real NextRequest is
 * constructed so Next.js internals (`nextUrl`, `cookies`) behave identically.
 */
export interface MockRequestOptions {
  method?: string;
  path?: string;
  origin?: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  forwardedFor?: string;
  host?: string;
}

export function mockRequest(opts: MockRequestOptions = {}): NextRequest {
  const host = opts.host ?? 'nocturna.test';
  const origin = opts.origin ?? `https://${host}`;
  const method = opts.method ?? 'GET';
  const url = `${origin}${opts.path ?? '/'}`;

  const headers = new Headers({
    host,
    ...opts.headers,
  });
  if (opts.forwardedFor) headers.set('x-forwarded-for', opts.forwardedFor);

  const cookiePairs = Object.entries(opts.cookies ?? {})
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
  if (cookiePairs) headers.set('cookie', cookiePairs);

  return new NextRequest(url, { method, headers });
}
