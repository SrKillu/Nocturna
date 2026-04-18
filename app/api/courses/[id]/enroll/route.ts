import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { enrollStudentSchema } from '@/lib/validations/courses';
import { enrollStudent } from '@/lib/services/courses.service';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth();
    const json = await request.json().catch(() => ({}));
    const input = enrollStudentSchema.parse(json);
    const enrollment = await enrollStudent(ctx, params.id, input.studentId);
    return NextResponse.json({ data: enrollment }, { status: 201 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
