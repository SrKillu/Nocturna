import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { createTaskSchema } from '@/lib/validations/tasks';
import { createTask, listTasksForCourse } from '@/lib/services/tasks.service';
import { toApiErrorResponse, ApiError } from '@/lib/errors';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    const body = await request.json();
    const input = createTaskSchema.parse(body);
    const task = await createTask(ctx, input);
    return NextResponse.json({ data: task }, { status: 201 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    const courseId = request.nextUrl.searchParams.get('courseId');
    if (!courseId) throw new ApiError('VALIDATION_ERROR', 'courseId is required');
    const tasks = await listTasksForCourse(ctx, courseId);
    return NextResponse.json({ data: tasks });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
