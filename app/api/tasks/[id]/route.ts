import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { getTaskDetail } from '@/lib/services/tasks.service';
import { toApiErrorResponse, ApiError } from '@/lib/errors';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth();
    const detail = await getTaskDetail(ctx, params.id);
    if (!detail) throw new ApiError('NOT_FOUND', 'Task not found');
    return NextResponse.json({ data: detail });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
