import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/api/auth';
import { listCourseStudents } from '@/lib/services/students.service';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth();
    requireRole(ctx, ['admin', 'super_admin', 'teacher']);
    const data = await listCourseStudents(ctx, params.id);
    return NextResponse.json({ data });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
