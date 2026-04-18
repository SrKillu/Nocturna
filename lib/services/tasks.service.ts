import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/errors';
import type { AuthenticatedContext } from '@/lib/types/auth';
import type { CreateTaskInput } from '@/lib/validations/tasks';

const TASK_FILES_BUCKET = 'task_files';
const TASK_FILE_MAX_BYTES = 25 * 1024 * 1024; // 25MB

export interface CreateTaskFile {
  name: string;
  mime: string;
  bytes: Uint8Array | ArrayBuffer;
  size: number;
}

export async function createTask(
  ctx: AuthenticatedContext,
  input: CreateTaskInput,
  file?: CreateTaskFile
) {
  if (ctx.role !== 'teacher' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw new ApiError('FORBIDDEN', 'Only teachers or admins can create tasks');
  }

  const supabase = createClient();

  // Confirm course belongs to tenant + caller has permission.
  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .select('id, teacher_id, institution_id')
    .eq('id', input.courseId)
    .single();

  if (courseErr || !course) throw new ApiError('NOT_FOUND', 'Course not found');

  if (
    ctx.role === 'teacher' &&
    course.teacher_id !== ctx.userId
  ) {
    throw new ApiError('FORBIDDEN', 'Teacher not assigned to this course');
  }

  if (file && file.size > TASK_FILE_MAX_BYTES) {
    throw new ApiError('VALIDATION_ERROR', 'Archivo demasiado grande (máx 25 MB)');
  }

  // 1) Insert task row first — we need its id for the storage path.
  const { data: inserted, error } = await supabase
    .from('tasks')
    .insert({
      institution_id: ctx.institutionId,
      course_id: input.courseId,
      title: input.title,
      description: input.description ?? null,
      due_date: input.dueDate ?? null,
      max_score: input.maxScore ?? 100,
      created_by: ctx.userId,
    })
    .select('*')
    .single();

  if (error) throw new ApiError('INTERNAL_ERROR', error.message);

  // 2) If there's a file, upload it and update the task with its metadata.
  //    On upload failure we compensate by deleting the task to avoid orphans.
  if (file) {
    const safeName = sanitizeFilename(file.name);
    const path = `${ctx.institutionId}/${input.courseId}/${inserted.id}/${safeName}`;
    const bytes = file.bytes instanceof Uint8Array ? file.bytes : new Uint8Array(file.bytes);

    const up = await supabase.storage
      .from(TASK_FILES_BUCKET)
      .upload(path, bytes, {
        contentType: file.mime || 'application/octet-stream',
        upsert: true,
      });

    if (up.error) {
      await supabase.from('tasks').delete().eq('id', inserted.id);
      throw new ApiError(
        'INTERNAL_ERROR',
        `No se pudo subir el archivo: ${up.error.message}`
      );
    }

    const { data: updated, error: upErr } = await supabase
      .from('tasks')
      .update({
        file_url: path,
        file_name: safeName,
        file_size: file.size,
      })
      .eq('id', inserted.id)
      .select('*')
      .single();

    if (upErr) {
      // Best-effort compensation.
      await supabase.storage.from(TASK_FILES_BUCKET).remove([path]).catch(() => undefined);
      await supabase.from('tasks').delete().eq('id', inserted.id);
      throw new ApiError('INTERNAL_ERROR', upErr.message);
    }
    return updated;
  }

  return inserted;
}

function sanitizeFilename(raw: string): string {
  // Strip directory components and keep only a conservative subset to avoid
  // Supabase storage path surprises. Defaults to "archivo" if empty.
  const base = raw.split(/[\\/]/).pop() ?? '';
  const cleaned = base.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120);
  return cleaned || 'archivo';
}

/**
 * Mints a short-lived signed URL for a task's attachment, after checking that
 * the caller is allowed to see it. Storage RLS enforces the same rules from
 * the DB side — this is defence-in-depth + a friendly 403/404.
 */
export async function getTaskFileSignedUrl(
  ctx: AuthenticatedContext,
  taskId: string,
  expiresInSec = 60
): Promise<{ url: string; fileName: string; size: number | null }> {
  const supabase = createClient();
  const { data: task, error } = await supabase
    .from('tasks')
    .select('id, course_id, file_url, file_name, file_size, institution_id')
    .eq('id', taskId)
    .maybeSingle();
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
  if (!task) throw new ApiError('NOT_FOUND', 'Tarea no encontrada');
  if (!task.file_url) throw new ApiError('NOT_FOUND', 'La tarea no tiene archivo adjunto');

  // Authorization (app-level): admin/super_admin OR teacher of the course OR enrolled student.
  if (ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    if (ctx.role === 'teacher') {
      const { data: c } = await supabase
        .from('courses')
        .select('teacher_id')
        .eq('id', task.course_id)
        .maybeSingle();
      if (!c || c.teacher_id !== ctx.userId) {
        throw new ApiError('FORBIDDEN', 'Sin acceso al archivo');
      }
    } else {
      const { count } = await supabase
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', task.course_id)
        .eq('student_id', ctx.userId);
      if (!count || count < 1) {
        throw new ApiError('FORBIDDEN', 'Sin acceso al archivo');
      }
    }
  }

  const signed = await supabase.storage
    .from(TASK_FILES_BUCKET)
    .createSignedUrl(task.file_url, expiresInSec, {
      download: task.file_name ?? undefined,
    });
  if (signed.error || !signed.data?.signedUrl) {
    throw new ApiError(
      'INTERNAL_ERROR',
      signed.error?.message ?? 'No se pudo generar URL firmada'
    );
  }
  return {
    url: signed.data.signedUrl,
    fileName: task.file_name ?? 'archivo',
    size: task.file_size,
  };
}

export async function listTasksForCourse(ctx: AuthenticatedContext, courseId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('course_id', courseId)
    .order('due_date', { ascending: true, nullsFirst: false });
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
  return data ?? [];
}

export async function getTask(ctx: AuthenticatedContext, taskId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('*, course:courses(id, name, teacher_id)')
    .eq('id', taskId)
    .single();
  if (error || !data) throw new ApiError('NOT_FOUND', 'Task not found');
  return data;
}

export async function listTasksForStudent(ctx: AuthenticatedContext) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('enrollments')
    .select('course:courses(id, name, tasks:tasks(*))')
    .eq('student_id', ctx.userId);
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
  return data ?? [];
}

export interface TaskListItem {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_score: number;
  course_id: string;
  course_name: string | null;
  submission_count: number;
  own_submission_status: import('@/lib/types/database').SubmissionStatus | null;
  created_at: string;
}

/**
 * Cross-course task listing. Scope:
 *   * student  → tasks of courses they\'re enrolled in
 *   * teacher  → tasks of courses they teach
 *   * admin    → every task in the tenant
 *
 * `courseId` narrows the result further. The server-side RLS already
 * guarantees tenant isolation; this helper just filters by scope so we do
 * not ship over-broad rows to the UI.
 */
export async function listAllTasks(
  ctx: AuthenticatedContext,
  opts: { courseId?: string | null } = {}
): Promise<TaskListItem[]> {
  const supabase = createClient();

  if (ctx.role === 'student') {
    let query = supabase
      .from('tasks')
      .select(
        'id, title, description, due_date, max_score, course_id, created_at, course:courses!inner(name, enrollments!inner(student_id)), submissions(id, status, student_id)'
      )
      .eq('course.enrollments.student_id', ctx.userId)
      .order('due_date', { ascending: true, nullsFirst: false });
    if (opts.courseId) query = query.eq('course_id', opts.courseId);
    const { data } = await query;
    return ((data ?? []) as unknown as Array<{
      id: string;
      title: string;
      description: string | null;
      due_date: string | null;
      max_score: number;
      course_id: string;
      created_at: string;
      course: { name: string } | null;
      submissions: Array<{ status: import('@/lib/types/database').SubmissionStatus; student_id: string }>;
    }>).map((t) => {
      const own = t.submissions?.find((s) => s.student_id === ctx.userId) ?? null;
      return {
        id: t.id,
        title: t.title,
        description: t.description,
        due_date: t.due_date,
        max_score: t.max_score,
        course_id: t.course_id,
        course_name: t.course?.name ?? null,
        submission_count: 0,
        own_submission_status: own?.status ?? null,
        created_at: t.created_at,
      };
    });
  }

  // Teacher / admin
  let query = supabase
    .from('tasks')
    .select(
      'id, title, description, due_date, max_score, course_id, created_at, course:courses!inner(name, teacher_id), submissions(id, status)'
    )
    .order('due_date', { ascending: true, nullsFirst: false });

  if (ctx.role === 'teacher') {
    query = query.eq('course.teacher_id', ctx.userId);
  }
  if (opts.courseId) query = query.eq('course_id', opts.courseId);

  const { data } = await query;
  return ((data ?? []) as unknown as Array<{
    id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    max_score: number;
    course_id: string;
    created_at: string;
    course: { name: string } | null;
    submissions: Array<{ id: string; status: import('@/lib/types/database').SubmissionStatus }>;
  }>).map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    due_date: t.due_date,
    max_score: t.max_score,
    course_id: t.course_id,
    course_name: t.course?.name ?? null,
    submission_count: (t.submissions ?? []).filter((s) => s.status === 'submitted').length,
    own_submission_status: null,
    created_at: t.created_at,
  }));
}

export interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_score: number;
  created_at: string;
  course: { id: string; name: string; teacher_id: string | null };
  submission_count: number;
  submitted_count: number;
  graded_count: number;
  own_submission: {
    id: string;
    status: import('@/lib/types/database').SubmissionStatus;
    submitted_at: string;
  } | null;
  can_edit: boolean;
  /** Attachment metadata. Null when the task has no file. */
  file_name: string | null;
  file_size: number | null;
  has_file: boolean;
}

export async function getTaskDetail(
  ctx: AuthenticatedContext,
  taskId: string
): Promise<TaskDetail | null> {
  const supabase = createClient();

  const { data: task } = await supabase
    .from('tasks')
    .select(
      'id, title, description, due_date, max_score, created_at, file_url, file_name, file_size, course:courses!inner(id, name, teacher_id)'
    )
    .eq('id', taskId)
    .maybeSingle();

  if (!task) return null;
  const typed = task as unknown as {
    id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    max_score: number;
    created_at: string;
    file_url: string | null;
    file_name: string | null;
    file_size: number | null;
    course: { id: string; name: string; teacher_id: string | null };
  };

  const [subsAgg, own] = await Promise.all([
    supabase.from('submissions').select('id, status').eq('task_id', taskId),
    ctx.role === 'student'
      ? supabase
          .from('submissions')
          .select('id, status, submitted_at')
          .eq('task_id', taskId)
          .eq('student_id', ctx.userId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const subs = (subsAgg.data ?? []) as Array<{
    id: string;
    status: import('@/lib/types/database').SubmissionStatus;
  }>;

  const canEdit =
    ctx.role === 'admin' ||
    ctx.role === 'super_admin' ||
    (ctx.role === 'teacher' && typed.course.teacher_id === ctx.userId);

  return {
    id: typed.id,
    title: typed.title,
    description: typed.description,
    due_date: typed.due_date,
    max_score: typed.max_score,
    created_at: typed.created_at,
    course: typed.course,
    submission_count: subs.length,
    submitted_count: subs.filter((s) => s.status === 'submitted').length,
    graded_count: subs.filter((s) => s.status === 'graded').length,
    own_submission: (own.data ?? null) as TaskDetail['own_submission'],
    can_edit: canEdit,
    file_name: typed.file_name,
    file_size: typed.file_size,
    has_file: Boolean(typed.file_url),
  };
}

