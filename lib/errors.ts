import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface ApiErrorShape {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

const STATUS_MAP: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.status = STATUS_MAP[code];
    this.details = details;
  }
}

/**
 * Build the canonical NextResponse error envelope.
 * NEVER includes internal details other than the caller-provided `details`.
 */
export function apiErrorResponse(code: ErrorCode, message: string, details?: unknown) {
  const payload: ApiErrorShape = { error: { code, message } };
  if (details !== undefined) payload.error.details = details;
  const res = NextResponse.json(payload, { status: STATUS_MAP[code] });
  if (code === 'RATE_LIMITED') {
    res.headers.set('Retry-After', '60');
  }
  return res;
}

/**
 * Maps any thrown value to the standard shape. Never leaks stack traces or
 * raw Postgres error messages back to the client.
 */
export function toApiErrorResponse(err: unknown) {
  if (err instanceof ApiError) {
    return apiErrorResponse(err.code, err.message, err.details);
  }
  if (err instanceof ZodError) {
    return apiErrorResponse('VALIDATION_ERROR', 'Invalid request payload', err.flatten());
  }
  if (err instanceof Error) {
    // eslint-disable-next-line no-console
    console.error('[API] Unhandled error:', err);
    return apiErrorResponse('INTERNAL_ERROR', 'Something went wrong');
  }
  // eslint-disable-next-line no-console
  console.error('[API] Unknown error:', err);
  return apiErrorResponse('INTERNAL_ERROR', 'Unknown error');
}
