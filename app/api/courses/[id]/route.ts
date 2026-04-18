import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { getCourseDetail } from '@/lib/services/courses.service';
import { toApiErrorResponse, ApiError } from '@/lib/errors';

export const runtime = 'nodejs';

/**
 * GET /api/courses/:id
 *
 * Returns the aggregated detail for a single course. RLS filters cross-tenant
 * access; we surface a plain 404 when the caller can’t see the row so we
 * don’t leak existence.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth();
    const detail = await getCourseDetail(ctx, params.id);
    if (!detail) throw new ApiError('NOT_FOUND', 'Course not found');
    return NextResponse.json({ data: detail });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
