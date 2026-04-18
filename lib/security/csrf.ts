import 'server-only';
import type { NextRequest, NextResponse } from 'next/server';

/**
 * CSRF protection based on the double-submit cookie pattern + Origin validation.
 *
 *   * On any non-mutating request we ensure a `nocturna-csrf` cookie exists
 *     (SameSite=Strict, Secure, NOT HttpOnly so the client JS can echo it).
 *   * On every POST/PUT/PATCH/DELETE we require:
 *       1. An `Origin` or `Referer` header whose host matches the request host.
 *       2. A `x-csrf-token` header whose value equals the cookie.
 *
 *   Exceptions (Origin check still applies, but cookie/header echo is optional):
 *   endpoints that are entry points into the session lifecycle and may be hit
 *   before a cookie exists (signup) or when a token is being issued (logout).
 */

export const CSRF_COOKIE = 'nocturna-csrf';
export const CSRF_HEADER = 'x-csrf-token';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const ECHO_EXEMPT_PREFIXES: readonly string[] = [
  '/api/auth/signup',
  '/api/auth/logout',
  '/auth/callback',
];

export class CsrfError extends Error {
  public readonly code: 'origin_mismatch' | 'token_mismatch' | 'missing_token';
  constructor(code: 'origin_mismatch' | 'token_mismatch' | 'missing_token') {
    super(code);
    this.code = code;
  }
}

function randomToken(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  let binary = '';
  for (let i = 0; i < arr.length; i += 1) binary += String.fromCharCode(arr[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function ensureCsrfCookie(request: NextRequest, response: NextResponse): string {
  const existing = request.cookies.get(CSRF_COOKIE)?.value;
  if (existing && existing.length >= 16) {
    return existing;
  }
  const token = randomToken();
  response.cookies.set({
    name: CSRF_COOKIE,
    value: token,
    httpOnly: false,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return token;
}

function hostFromHeader(raw: string | null): string | null {
  if (!raw) return null;
  try {
    return new URL(raw).host;
  } catch {
    return null;
  }
}

function requestHost(request: NextRequest): string {
  const fwdHost = request.headers.get('x-forwarded-host');
  if (fwdHost) return fwdHost.trim();
  const host = request.headers.get('host');
  if (host) return host;
  return request.nextUrl.host;
}

/**
 * Trusted host allowlist. We consider a request same-origin if its Origin/
 * Referer matches any of:
 *   1. The resolved request host (x-forwarded-host → host → nextUrl.host).
 *   2. The host of NEXT_PUBLIC_BASE_URL (canonical public URL). This covers
 *      deployments where the edge proxy rewrites the upstream host header
 *      (Emergent preview, some CDN configurations).
 */
function trustedHosts(request: NextRequest): Set<string> {
  const hosts = new Set<string>();
  hosts.add(requestHost(request));
  const publicUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (publicUrl) {
    try {
      hosts.add(new URL(publicUrl).host);
    } catch {
      /* ignore malformed env */
    }
  }
  return hosts;
}

/**
 * Three-state same-origin check. Unlike a single boolean, this distinguishes
 * "no usable Origin/Referer was provided" from "Origin/Referer were provided
 * but they don't match".
 *   * 'allowed' : Origin or Referer match the trusted host allowlist.
 *   * 'denied'  : a header was provided but its host is NOT trusted (attack).
 *   * 'missing' : neither Origin nor Referer is usable. Legitimate in some
 *                 sandboxed-iframe or strict-referrer-policy browser contexts
 *                 (e.g. Emergent preview iframe). Caller falls back to the
 *                 double-submit cookie, which is the cryptographic same-origin
 *                 proof (the CSRF cookie is SameSite=Strict, so an attacker
 *                 page cannot send it; it is non-HttpOnly, so only same-origin
 *                 JS can read its value to echo into x-csrf-token).
 */
function originCheck(request: NextRequest): 'allowed' | 'denied' | 'missing' {
  const expected = trustedHosts(request);
  const rawOrigin = request.headers.get('origin');
  // Browsers send the literal string "null" for Origin in sandboxed iframes,
  // data: URIs, etc. Treat it as "no origin reported".
  const originHost =
    rawOrigin && rawOrigin !== 'null' ? hostFromHeader(rawOrigin) : null;
  if (originHost) return expected.has(originHost) ? 'allowed' : 'denied';
  const refererHost = hostFromHeader(request.headers.get('referer'));
  if (refererHost) return expected.has(refererHost) ? 'allowed' : 'denied';
  return 'missing';
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function needsCsrfCheck(request: NextRequest): boolean {
  return MUTATING_METHODS.has(request.method);
}

/**
 * Validates a mutating request. Throws CsrfError on failure. Caller should
 * convert it to an HTTP 403 with the standard error envelope.
 *
 * Defence layers:
 *   * Origin/Referer allowlist (when the browser provides it).
 *   * Double-submit cookie echo (cryptographic same-origin proof).
 * At least one MUST succeed. Echo-exempt endpoints require the Origin check
 * because they cannot rely on the double-submit (no cookie yet / token being
 * rotated).
 */
export function validateCsrf(request: NextRequest): void {
  if (!needsCsrfCheck(request)) return;

  const pathname = request.nextUrl.pathname;
  const echoExempt = ECHO_EXEMPT_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const origin = originCheck(request);

  // Hard reject when Origin/Referer are provided but not trusted — that is a
  // genuine cross-site request attempt.
  if (origin === 'denied') {
    throw new CsrfError('origin_mismatch');
  }

  // Echo-exempt endpoints (signup/logout/callback) have no double-submit to
  // fall back on, so they MUST provide a trusted Origin or Referer.
  if (echoExempt) {
    if (origin !== 'allowed') {
      throw new CsrfError('origin_mismatch');
    }
    return;
  }

  // Non-exempt mutating request. Require the double-submit cookie echo.
  // When origin === 'allowed' we have defence-in-depth; when origin ===
  // 'missing' (sandboxed iframes, strict referrer policy) the double-submit
  // is the sole but sufficient proof.
  const cookie = request.cookies.get(CSRF_COOKIE)?.value;
  const header = request.headers.get(CSRF_HEADER);
  if (!cookie || !header) {
    throw new CsrfError(origin === 'missing' ? 'origin_mismatch' : 'missing_token');
  }
  if (!constantTimeEqual(cookie, header)) {
    throw new CsrfError('token_mismatch');
  }
}
