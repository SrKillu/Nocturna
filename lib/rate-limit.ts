import 'server-only';
import { ApiError } from '@/lib/errors';
import type { NextRequest } from 'next/server';

/**
 * Sliding-window rate limiter with exponential temp-ban.
 *
 *   * `events` keeps timestamps per key and discards anything outside the
 *     current window on every check (true sliding window).
 *   * `bans` stores an absolute `blockedUntil` timestamp. Every time a key
 *     overflows the window its ban duration doubles (2m -> 4m -> ... capped).
 *
 * In-memory only. For multi-instance deployments, swap `events`/`bans` for a
 * Redis-backed store (the public API stays the same).
 */

interface EventWindow {
  hits: number[];
  violations: number;
  blockedUntil: number;
}

const store = new Map<string, EventWindow>();
const MAX_STORE = 4096;
const BASE_BAN_MS = 2 * 60_000;   // 2 minutes
const MAX_BAN_MS  = 60 * 60_000;  // 1 hour

function sweep(now: number): void {
  if (store.size < MAX_STORE) return;
  for (const [k, v] of store) {
    if (v.blockedUntil < now && v.hits.length === 0) store.delete(k);
  }
}

export interface RateLimitRule {
  bucket: string;
  limit: number;
  windowMs: number;
}

export function clientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}

export function enforceRateLimit(rule: RateLimitRule, scopeKey: string): void {
  const now = Date.now();
  sweep(now);
  const key = `${rule.bucket}:${scopeKey}`;
  const state = store.get(key) ?? { hits: [], violations: 0, blockedUntil: 0 };

  if (state.blockedUntil > now) {
    store.set(key, state);
    throw new ApiError('RATE_LIMITED', 'Too many requests, please try again later');
  }

  const windowStart = now - rule.windowMs;
  state.hits = state.hits.filter((t) => t > windowStart);

  if (state.hits.length >= rule.limit) {
    state.violations += 1;
    const banMs = Math.min(BASE_BAN_MS * 2 ** Math.max(0, state.violations - 1), MAX_BAN_MS);
    state.blockedUntil = now + banMs;
    store.set(key, state);
    throw new ApiError('RATE_LIMITED', 'Too many requests, please try again later');
  }

  state.hits.push(now);
  store.set(key, state);
}

export function enforceCombinedRateLimit(params: {
  rule: RateLimitRule;
  request: NextRequest;
  userId?: string;
}): void {
  const ip = clientIp(params.request);
  if (params.userId) enforceRateLimit(params.rule, `user:${params.userId}`);
  enforceRateLimit(params.rule, `ip:${ip}`);
}

export const RATE_LIMITS = {
  adminUserCreate: { bucket: 'admin.users.create', limit: 10, windowMs: 60_000 } satisfies RateLimitRule,
  authSignup:      { bucket: 'auth.signup',        limit: 3,  windowMs: 60_000 } satisfies RateLimitRule,
  authEvent:       { bucket: 'auth.event',         limit: 30, windowMs: 60_000 } satisfies RateLimitRule,
  fileUpload:      { bucket: 'files.upload',       limit: 30, windowMs: 60_000 } satisfies RateLimitRule,
  fileDownload:    { bucket: 'files.download',     limit: 60, windowMs: 60_000 } satisfies RateLimitRule,
};
