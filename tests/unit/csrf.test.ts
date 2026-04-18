import { describe, it, expect } from 'vitest';
import { NextResponse } from 'next/server';
import {
  validateCsrf,
  needsCsrfCheck,
  ensureCsrfCookie,
  CsrfError,
  CSRF_COOKIE,
  CSRF_HEADER,
} from '@/lib/security/csrf';
import { mockRequest } from '../helpers/mock-request';

/**
 * T12 · CSRF double-submit cookie + Origin check.
 *
 * Contract:
 *   * Safe methods (GET/HEAD/OPTIONS) are always allowed.
 *   * Mutating methods (POST/PUT/PATCH/DELETE) require:
 *        1. Origin or Referer matching the request host.
 *        2. `nocturna-csrf` cookie == `x-csrf-token` header (constant-time).
 *   * Exempt endpoints (/api/auth/signup, /api/auth/logout, /auth/callback)
 *     still enforce Origin but skip the echo.
 */
describe('T12 · CSRF', () => {
  const token = 'abc123abc123abc123abc123';

  it('needsCsrfCheck flags only mutating methods', () => {
    expect(needsCsrfCheck(mockRequest({ method: 'GET' }))).toBe(false);
    expect(needsCsrfCheck(mockRequest({ method: 'HEAD' }))).toBe(false);
    expect(needsCsrfCheck(mockRequest({ method: 'OPTIONS' }))).toBe(false);
    expect(needsCsrfCheck(mockRequest({ method: 'POST' }))).toBe(true);
    expect(needsCsrfCheck(mockRequest({ method: 'PUT' }))).toBe(true);
    expect(needsCsrfCheck(mockRequest({ method: 'PATCH' }))).toBe(true);
    expect(needsCsrfCheck(mockRequest({ method: 'DELETE' }))).toBe(true);
  });

  it('accepts a valid POST with matching origin + cookie/header pair', () => {
    const req = mockRequest({
      method: 'POST',
      path: '/api/courses',
      origin: 'https://nocturna.test',
      headers: { origin: 'https://nocturna.test', [CSRF_HEADER]: token },
      cookies: { [CSRF_COOKIE]: token },
    });
    expect(() => validateCsrf(req)).not.toThrow();
  });

  it('rejects POST when Origin host does not match', () => {
    const req = mockRequest({
      method: 'POST',
      path: '/api/courses',
      origin: 'https://nocturna.test',
      headers: { origin: 'https://evil.example', [CSRF_HEADER]: token },
      cookies: { [CSRF_COOKIE]: token },
    });
    try {
      validateCsrf(req);
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(CsrfError);
      expect((err as CsrfError).code).toBe('origin_mismatch');
    }
  });

  it('falls back to Referer when Origin is absent', () => {
    const req = mockRequest({
      method: 'POST',
      path: '/api/courses',
      origin: 'https://nocturna.test',
      headers: { referer: 'https://nocturna.test/dashboard', [CSRF_HEADER]: token },
      cookies: { [CSRF_COOKIE]: token },
    });
    expect(() => validateCsrf(req)).not.toThrow();
  });

  it('rejects when cookie is missing', () => {
    const req = mockRequest({
      method: 'POST',
      path: '/api/courses',
      origin: 'https://nocturna.test',
      headers: { origin: 'https://nocturna.test', [CSRF_HEADER]: token },
    });
    try {
      validateCsrf(req);
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as CsrfError).code).toBe('missing_token');
    }
  });

  it('rejects when header is missing', () => {
    const req = mockRequest({
      method: 'POST',
      path: '/api/courses',
      origin: 'https://nocturna.test',
      headers: { origin: 'https://nocturna.test' },
      cookies: { [CSRF_COOKIE]: token },
    });
    try {
      validateCsrf(req);
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as CsrfError).code).toBe('missing_token');
    }
  });

  it('rejects when cookie and header differ', () => {
    const req = mockRequest({
      method: 'POST',
      path: '/api/courses',
      origin: 'https://nocturna.test',
      headers: { origin: 'https://nocturna.test', [CSRF_HEADER]: token },
      cookies: { [CSRF_COOKIE]: 'x'.repeat(token.length) },
    });
    try {
      validateCsrf(req);
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as CsrfError).code).toBe('token_mismatch');
    }
  });

  it('echo-exempt endpoints still enforce Origin but skip token echo', () => {
    const good = mockRequest({
      method: 'POST',
      path: '/api/auth/signup',
      origin: 'https://nocturna.test',
      headers: { origin: 'https://nocturna.test' },
    });
    expect(() => validateCsrf(good)).not.toThrow();

    const bad = mockRequest({
      method: 'POST',
      path: '/api/auth/signup',
      origin: 'https://nocturna.test',
      headers: { origin: 'https://evil.example' },
    });
    expect(() => validateCsrf(bad)).toThrow(CsrfError);
  });

  it('ensureCsrfCookie issues a new token if missing', () => {
    const req = mockRequest({ method: 'GET', path: '/' });
    const res = NextResponse.next({ request: req });
    const token = ensureCsrfCookie(req, res);
    expect(token.length).toBeGreaterThanOrEqual(16);
    const cookieHeader = res.cookies.get(CSRF_COOKIE);
    expect(cookieHeader?.value).toBe(token);
    expect(cookieHeader?.sameSite).toBe('strict');
  });

  it('ensureCsrfCookie preserves an existing valid token', () => {
    const req = mockRequest({ cookies: { [CSRF_COOKIE]: token } });
    const res = NextResponse.next({ request: req });
    const returned = ensureCsrfCookie(req, res);
    expect(returned).toBe(token);
  });
});
