import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { enrollStudentSchema } from '@/lib/validations/courses';
import { enrollStudent } from '@/lib/services/courses.service';
import {
  enrollStudentByEmail,
  enrollByEmailSchema,
  unenrollStudent,
} from '@/lib/services/enrollments.service';
import { toApiErrorResponse, ApiError } from '@/lib/errors';

export const runtime = 'nodejs';

/**
 * POST /api/courses/:id/enroll — supports two request shapes:
 *   { studentId: uuid }   → enroll by id (legacy, still used internally).
 *   { email: string }     → enroll by email (preferred for UI flows).
 * Whichever you send, the underlying service enforces the same guardrails:
 * tenant isolation, course ownership (teacher) or admin role, and dedupe.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth();
    const json = await request.json().catch(() => ({}));

    const byEmail = enrollByEmailSchema.safeParse(json);
    if (byEmail.success) {
      const result = await enrollStudentByEmail(ctx, params.id, byEmail.data);
      return NextResponse.json({ data: result }, { status: 201 });
    }

    const byId = enrollStudentSchema.safeParse(json);
    if (byId.success) {
      const enrollment = await enrollStudent(ctx, params.id, byId.data.studentId);
      return NextResponse.json({ data: enrollment }, { status: 201 });
    }

    throw new ApiError(
      'VALIDATION_ERROR',
      'Debes enviar { email } o { studentId }'
    );
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

const deleteSchema = z.object({ studentId: z.string().uuid() });

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth();
    const json = await request.json().catch(() => ({}));
    const parsed = deleteSchema.safeParse(json);
    const studentId = parsed.success
      ? parsed.data.studentId
      : request.nextUrl.searchParams.get('studentId');
    if (!studentId) {
      throw new ApiError('VALIDATION_ERROR', 'studentId requerido');
    }
    await unenrollStudent(ctx, params.id, studentId);
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
