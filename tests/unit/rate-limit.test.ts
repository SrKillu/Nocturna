import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  enforceRateLimit,
  enforceCombinedRateLimit,
  clientIp,
  RATE_LIMITS,
} from '@/lib/rate-limit';
import { ApiError } from '@/lib/errors';
import { mockRequest } from '../helpers/mock-request';

/**
 * T11 · Rate Limiting
 *
 * Verifies the sliding-window limiter:
 *   1. Allows up to `limit` hits in the window.
 *   2. Rejects the (limit+1)-th hit with ApiError(RATE_LIMITED).
 *   3. Uses an exponential ban: once the window is exceeded the caller is
 *      locked out even for requests that would otherwise fit a new window.
 *   4. Different scope keys (per user, per IP) are isolated.
 */
describe('T11 · rate-limit', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('allows exactly `limit` hits inside the window', () => {
    const rule = { bucket: 'test.allow', limit: 5, windowMs: 60_000 };
    for (let i = 0; i < rule.limit; i += 1) {
      expect(() => enforceRateLimit(rule, 'user-a')).not.toThrow();
    }
  });

  it('blocks the (limit+1)-th request with RATE_LIMITED', () => {
    const rule = { bucket: 'test.block', limit: 3, windowMs: 60_000 };
    for (let i = 0; i < 3; i += 1) enforceRateLimit(rule, 'user-b');
    try {
      enforceRateLimit(rule, 'user-b');
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe('RATE_LIMITED');
      expect((err as ApiError).status).toBe(429);
    }
  });

  it('isolates scope keys (different users do not share quota)', () => {
    const rule = { bucket: 'test.isolate', limit: 2, windowMs: 60_000 };
    enforceRateLimit(rule, 'user-x');
    enforceRateLimit(rule, 'user-x');
    // user-x exhausted; user-y still has full quota
    expect(() => enforceRateLimit(rule, 'user-y')).not.toThrow();
    expect(() => enforceRateLimit(rule, 'user-y')).not.toThrow();
    expect(() => enforceRateLimit(rule, 'user-y')).toThrow(/too many/i);
  });

  it('applies an exponential ban after violation (fake timers)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    const rule = { bucket: 'test.ban', limit: 2, windowMs: 1_000 };
    enforceRateLimit(rule, 'k1');
    enforceRateLimit(rule, 'k1');
    expect(() => enforceRateLimit(rule, 'k1')).toThrow();
    // Advance past the window but still inside the 2-minute ban.
    vi.advanceTimersByTime(30_000);
    expect(() => enforceRateLimit(rule, 'k1')).toThrow();
    // Advance past the 2-minute ban.
    vi.advanceTimersByTime(3 * 60_000);
    expect(() => enforceRateLimit(rule, 'k1')).not.toThrow();
    vi.useRealTimers();
  });

  it('enforces combined (IP + userId) quotas', () => {
    const rule = { bucket: 'test.combined', limit: 2, windowMs: 60_000 };
    const req1 = mockRequest({ forwardedFor: '1.2.3.4' });
    const req2 = mockRequest({ forwardedFor: '5.6.7.8' });
    enforceCombinedRateLimit({ rule, request: req1, userId: 'u1' });
    enforceCombinedRateLimit({ rule, request: req1, userId: 'u1' });
    // same user+ip -> over quota
    expect(() =>
      enforceCombinedRateLimit({ rule, request: req1, userId: 'u1' })
    ).toThrow(/too many/i);
    // different user from different IP is untouched
    expect(() =>
      enforceCombinedRateLimit({ rule, request: req2, userId: 'u2' })
    ).not.toThrow();
  });

  it('extracts client IP from x-forwarded-for / x-real-ip', () => {
    expect(clientIp(mockRequest({ forwardedFor: '10.0.0.1, 1.1.1.1' }))).toBe('10.0.0.1');
    expect(clientIp(mockRequest({ headers: { 'x-real-ip': '9.9.9.9' } }))).toBe('9.9.9.9');
    expect(clientIp(mockRequest())).toBe('unknown');
  });

  it('exposes tuned limits per bucket', () => {
    expect(RATE_LIMITS.authSignup.limit).toBeLessThan(RATE_LIMITS.authEvent.limit);
    expect(RATE_LIMITS.fileUpload.windowMs).toBe(60_000);
    expect(RATE_LIMITS.adminUserCreate.limit).toBeGreaterThan(0);
  });
});
