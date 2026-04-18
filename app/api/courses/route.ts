import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { createCourseSchema } from '@/lib/validations/courses';
import { createCourse, listCourses } from '@/lib/services/courses.service';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const ctx = await requireAuth();
    const courses = await listCourses(ctx);
    return NextResponse.json({ data: courses });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    const body = await request.json();
    const input = createCourseSchema.parse(body);
    const course = await createCourse(ctx, input);
    return NextResponse.json({ data: course }, { status: 201 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
