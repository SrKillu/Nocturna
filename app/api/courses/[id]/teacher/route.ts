import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { assignTeacherSchema } from '@/lib/validations/courses';
import { assignTeacher } from '@/lib/services/courses.service';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth();
    const body = await request.json();
    const input = assignTeacherSchema.parse(body);
    const course = await assignTeacher(ctx, params.id, input.teacherId);
    return NextResponse.json({ data: course });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
