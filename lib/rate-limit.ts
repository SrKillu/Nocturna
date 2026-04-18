import 'server-only';
import { ApiError } from '@/lib/errors';
import type { NextRequest } from 'next/server';

/**
 * In-memory fixed-window rate limiter.
 *
 * Trade-offs:
 *   * Works per Next.js process; in a multi-instance deployment each instance
 *     keeps its own counter. For Nocturna's MVP that's acceptable; swap for
 *     Redis/Upstash in production if you scale horizontally.
 *   * Zero dependencies, no cold-start, O(1) per request.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

function now(): number {
  return Date.now();
}

function sweep(current: number): void {
  // Occasional cleanup to keep the map bounded.
  if (store.size < 1024) return;
  for (const [k, v] of store) {
    if (v.resetAt < current) store.delete(k);
  }
}

export interface RateLimitRule {
  /** Unique endpoint identifier. */
  bucket: string;
  /** Max requests allowed in the window. */
  limit: number;
  /** Window size in milliseconds. */
  windowMs: number;
}

export function clientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}

/**
 * Consume one unit from the bucket. Throws ApiError('RATE_LIMITED') on exceed.
 */
export function enforceRateLimit(rule: RateLimitRule, scopeKey: string): void {
  const t = now();
  sweep(t);
  const key = `${rule.bucket}:${scopeKey}`;
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt < t) {
    store.set(key, { count: 1, resetAt: t + rule.windowMs });
    return;
  }
  if (bucket.count >= rule.limit) {
    throw new ApiError('RATE_LIMITED', 'Too many requests, please try again later');
  }
  bucket.count += 1;
}

/**
 * Convenience wrapper that combines user + IP keys when a user context is
 * available, or falls back to IP-only for unauthenticated endpoints.
 */
export function enforceCombinedRateLimit(params: {
  rule: RateLimitRule;
  request: NextRequest;
  userId?: string;
}): void {
  const ip = clientIp(params.request);
  if (params.userId) {
    enforceRateLimit(params.rule, `user:${params.userId}`);
  }
  enforceRateLimit(params.rule, `ip:${ip}`);
}

// Preset rules --------------------------------------------------------
export const RATE_LIMITS = {
  adminUserCreate: { bucket: 'admin.users.create', limit: 10, windowMs: 60_000 } satisfies RateLimitRule,
  authSignup:      { bucket: 'auth.signup',        limit: 3,  windowMs: 60_000 } satisfies RateLimitRule,
  fileUpload:      { bucket: 'files.upload',       limit: 30, windowMs: 60_000 } satisfies RateLimitRule,
  fileDownload:    { bucket: 'files.download',     limit: 60, windowMs: 60_000 } satisfies RateLimitRule,
};
