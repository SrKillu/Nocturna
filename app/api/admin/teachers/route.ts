import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth, requireRole } from '@/lib/api/auth';
import {
  createTeacher,
  createTeacherSchema,
  listTeachers,
} from '@/lib/services/teachers.service';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const ctx = await requireAuth();
    requireRole(ctx, ['admin', 'super_admin']);
    const teachers = await listTeachers(ctx);
    return NextResponse.json({ data: teachers });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    requireRole(ctx, ['admin', 'super_admin']);
    const body = await request.json();
    const input = createTeacherSchema.parse(body);
    const result = await createTeacher(ctx, input);
    // Return the password once so the admin can hand it to the teacher.
    // Not persisted anywhere.
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
