import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { createTaskSchema } from '@/lib/validations/tasks';
import {
  createTask,
  listTasksForCourse,
  type CreateTaskFile,
} from '@/lib/services/tasks.service';
import { toApiErrorResponse, ApiError } from '@/lib/errors';

export const runtime = 'nodejs';

const TASK_FILE_MAX_BYTES = 25 * 1024 * 1024; // keep in sync with service

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    const contentType = request.headers.get('content-type') ?? '';

    // Parse either multipart/form-data (with optional file) or plain JSON.
    let body: Record<string, unknown>;
    let file: CreateTaskFile | undefined;

    if (contentType.toLowerCase().startsWith('multipart/form-data')) {
      const form = await request.formData();
      body = {
        courseId: form.get('courseId') ?? undefined,
        title: form.get('title') ?? undefined,
        description: form.get('description') ?? undefined,
        dueDate: form.get('dueDate') ?? undefined,
        maxScore:
          form.get('maxScore') != null ? Number(form.get('maxScore')) : undefined,
      };
      const raw = form.get('file');
      if (raw instanceof File && raw.size > 0) {
        if (raw.size > TASK_FILE_MAX_BYTES) {
          throw new ApiError('VALIDATION_ERROR', 'Archivo demasiado grande (máx 25 MB)');
        }
        const buf = await raw.arrayBuffer();
        file = {
          name: raw.name || 'archivo',
          mime: raw.type || 'application/octet-stream',
          bytes: new Uint8Array(buf),
          size: raw.size,
        };
      }
      // Clean up empty strings for optional fields
      if (body.description === '') body.description = null;
      if (body.dueDate === '')     body.dueDate = null;
    } else {
      body = (await request.json()) as Record<string, unknown>;
    }

    const input = createTaskSchema.parse(body);
    const task = await createTask(ctx, input, file);
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
