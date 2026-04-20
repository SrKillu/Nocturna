import 'server-only';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/errors';
import type { AuthenticatedContext } from '@/lib/types/auth';

// ─────────────────────────────────────────────────────────────────────────
// Tipos y validaciones
// ─────────────────────────────────────────────────────────────────────────

export const createDailyWorkSchema = z.object({
  title: z.string().trim().min(2, 'Mínimo 2 caracteres').max(200),
  description: z.string().trim().max(4000).optional().nullable(),
});
export type CreateDailyWorkInput = z.infer<typeof createDailyWorkSchema>;

export const submitDailyWorkSchema = z.object({
  content: z.string().trim().min(1, 'La respuesta no puede estar vacía').max(8000),
});
export type SubmitDailyWorkInput = z.infer<typeof submitDailyWorkSchema>;

export interface DailyWorkRow {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
  /** relleno cuando hacemos query del curso desde el alumno. */
  my_submission: {
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
  } | null;
  submissions_count: number;
}

export interface DailyWorkSubmissionRow {
  id: string;
  work_id: string;
  student_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  student: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers RBAC
// ─────────────────────────────────────────────────────────────────────────

async function assertCanManageCourse(
  ctx: AuthenticatedContext,
  courseId: string
): Promise<{ institution_id: string; teacher_id: string | null }> {
  const sb = createClient();
  const { data: c, error } = await sb
    .from('courses')
    .select('id, institution_id, teacher_id')
    .eq('id', courseId)
    .maybeSingle();
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
  if (!c) throw new ApiError('NOT_FOUND', 'Curso no encontrado');
  const isStaff = ctx.role === 'admin' || ctx.role === 'super_admin';
  const isOwnerTeacher = ctx.role === 'teacher' && c.teacher_id === ctx.userId;
  if (!isStaff && !isOwnerTeacher) {
    throw new ApiError('FORBIDDEN', 'No puedes gestionar trabajos en este curso');
  }
  return { institution_id: c.institution_id, teacher_id: c.teacher_id };
}

async function assertEnrolledOrStaff(
  ctx: AuthenticatedContext,
  courseId: string
): Promise<void> {
  if (ctx.role === 'admin' || ctx.role === 'super_admin') return;
  const sb = createClient();
  if (ctx.role === 'teacher') {
    const { data: c } = await sb
      .from('courses')
      .select('teacher_id')
      .eq('id', courseId)
      .maybeSingle();
    if (c?.teacher_id === ctx.userId) return;
  }
  if (ctx.role === 'student') {
    const { count } = await sb
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId)
      .eq('student_id', ctx.userId);
    if ((count ?? 0) > 0) return;
  }
  throw new ApiError('FORBIDDEN', 'No tienes acceso a este curso');
}

// ─────────────────────────────────────────────────────────────────────────
// List / Create / Delete trabajos
// ─────────────────────────────────────────────────────────────────────────

export async function listDailyWorks(
  ctx: AuthenticatedContext,
  courseId: string
): Promise<DailyWorkRow[]> {
  await assertEnrolledOrStaff(ctx, courseId);
  const sb = createClient();

  const { data: works, error } = await sb
    .from('daily_work')
    .select('id, course_id, title, description, created_by, created_at')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
  const rows = (works ?? []) as Array<Omit<DailyWorkRow, 'my_submission' | 'submissions_count'>>;
  if (rows.length === 0) return [];

  const workIds = rows.map((r) => r.id);

  // Counts por work (un solo query).
  const { data: countRows } = await sb
    .from('daily_work_submissions')
    .select('work_id')
    .in('work_id', workIds);
  const countByWork = new Map<string, number>();
  for (const r of countRows ?? []) {
    const wid = (r as { work_id: string }).work_id;
    countByWork.set(wid, (countByWork.get(wid) ?? 0) + 1);
  }

  // Mi submission (si student).
  let mine = new Map<
    string,
    { id: string; content: string; created_at: string; updated_at: string }
  >();
  if (ctx.role === 'student') {
    const { data: subs } = await sb
      .from('daily_work_submissions')
      .select('id, work_id, content, created_at, updated_at')
      .in('work_id', workIds)
      .eq('student_id', ctx.userId);
    mine = new Map(
      (subs ?? []).map((s) => [
        (s as { work_id: string }).work_id,
        {
          id: (s as { id: string }).id,
          content: (s as { content: string }).content,
          created_at: (s as { created_at: string }).created_at,
          updated_at: (s as { updated_at: string }).updated_at,
        },
      ])
    );
  }

  return rows.map((r) => ({
    ...r,
    submissions_count: countByWork.get(r.id) ?? 0,
    my_submission: mine.get(r.id) ?? null,
  }));
}

export async function createDailyWork(
  ctx: AuthenticatedContext,
  courseId: string,
  input: CreateDailyWorkInput
): Promise<DailyWorkRow> {
  const course = await assertCanManageCourse(ctx, courseId);
  const sb = createClient();

  const { data, error } = await sb
    .from('daily_work')
    .insert({
      institution_id: course.institution_id,
      course_id: courseId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      created_by: ctx.userId,
    })
    .select('id, course_id, title, description, created_by, created_at')
    .single();
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);

  return {
    ...(data as Omit<DailyWorkRow, 'my_submission' | 'submissions_count'>),
    my_submission: null,
    submissions_count: 0,
  };
}

export async function deleteDailyWork(
  ctx: AuthenticatedContext,
  workId: string
): Promise<void> {
  const sb = createClient();
  const { data: work } = await sb
    .from('daily_work')
    .select('id, course_id')
    .eq('id', workId)
    .maybeSingle();
  if (!work) throw new ApiError('NOT_FOUND', 'Trabajo no encontrado');
  await assertCanManageCourse(ctx, work.course_id as string);
  const { error } = await sb.from('daily_work').delete().eq('id', workId);
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
}

// ─────────────────────────────────────────────────────────────────────────
// Submissions
// ─────────────────────────────────────────────────────────────────────────

export async function submitDailyWork(
  ctx: AuthenticatedContext,
  workId: string,
  input: SubmitDailyWorkInput
): Promise<DailyWorkSubmissionRow> {
  if (ctx.role !== 'student') {
    throw new ApiError('FORBIDDEN', 'Solo estudiantes pueden enviar trabajos');
  }
  const sb = createClient();

  const { data: work, error: wErr } = await sb
    .from('daily_work')
    .select('id, course_id')
    .eq('id', workId)
    .maybeSingle();
  if (wErr) throw new ApiError('INTERNAL_ERROR', wErr.message);
  if (!work) throw new ApiError('NOT_FOUND', 'Trabajo no encontrado');

  // Upsert por (work_id, student_id) — el único constraint lo garantiza.
  const { data, error } = await sb
    .from('daily_work_submissions')
    .upsert(
      {
        work_id: workId,
        student_id: ctx.userId,
        content: input.content.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'work_id,student_id' }
    )
    .select('id, work_id, student_id, content, created_at, updated_at')
    .single();
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);

  return {
    ...(data as Omit<DailyWorkSubmissionRow, 'student'>),
    student: null,
  };
}

export async function listDailyWorkSubmissions(
  ctx: AuthenticatedContext,
  workId: string
): Promise<DailyWorkSubmissionRow[]> {
  const sb = createClient();
  const { data: work, error: wErr } = await sb
    .from('daily_work')
    .select('id, course_id')
    .eq('id', workId)
    .maybeSingle();
  if (wErr) throw new ApiError('INTERNAL_ERROR', wErr.message);
  if (!work) throw new ApiError('NOT_FOUND', 'Trabajo no encontrado');
  await assertCanManageCourse(ctx, work.course_id as string);

  const { data: subs, error } = await sb
    .from('daily_work_submissions')
    .select('id, work_id, student_id, content, created_at, updated_at')
    .eq('work_id', workId)
    .order('created_at', { ascending: false });
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
  const rows = (subs ?? []) as Array<Omit<DailyWorkSubmissionRow, 'student'>>;
  if (rows.length === 0) return [];

  const ids = [...new Set(rows.map((r) => r.student_id))];
  const { data: profs } = await sb
    .from('profiles')
    .select('id, full_name, email')
    .in('id', ids);
  const byId = new Map(
    (profs ?? []).map((p) => [
      p.id as string,
      {
        id: p.id as string,
        full_name: (p.full_name as string | null) ?? null,
        email: p.email as string,
      },
    ])
  );

  return rows.map((r) => ({ ...r, student: byId.get(r.student_id) ?? null }));
}
