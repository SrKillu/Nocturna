import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
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

export function apiErrorResponse(code: ErrorCode, message: string, details?: unknown) {
  const payload: ApiErrorShape = { error: { code, message } };
  if (details !== undefined) payload.error.details = details;
  return NextResponse.json(payload, { status: STATUS_MAP[code] });
}

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
