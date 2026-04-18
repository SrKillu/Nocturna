import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/errors';
import type { AuthenticatedContext } from '@/lib/types/auth';
import type { SubmitTaskInput } from '@/lib/validations/submissions';

export async function submitTask(
  ctx: AuthenticatedContext,
  taskId: string,
  input: SubmitTaskInput
) {
  if (ctx.role !== 'student') {
    throw new ApiError('FORBIDDEN', 'Only students can submit tasks');
  }
  const supabase = createClient();

  // Upsert submission so a student can re-submit while status = 'submitted'.
  const { data: existing } = await supabase
    .from('submissions')
    .select('id, status')
    .eq('task_id', taskId)
    .eq('student_id', ctx.userId)
    .maybeSingle();

  if (existing && existing.status === 'graded') {
    throw new ApiError('CONFLICT', 'Submission already graded');
  }

  if (existing) {
    const { data, error } = await supabase
      .from('submissions')
      .update({
        content: input.content ?? null,
        file_path: input.filePath ?? null,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('*')
      .single();
    if (error) throw new ApiError('INTERNAL_ERROR', error.message);
    return data;
  }

  const { data, error } = await supabase
    .from('submissions')
    .insert({
      institution_id: ctx.institutionId,
      task_id: taskId,
      student_id: ctx.userId,
      content: input.content ?? null,
      file_path: input.filePath ?? null,
      status: 'submitted',
    })
    .select('*')
    .single();

  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
  return data;
}

export async function listSubmissionsForTask(
  ctx: AuthenticatedContext,
  taskId: string
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('submissions')
    .select('*, student:profiles!submissions_student_id_fkey(id, full_name, email), grade:grades(*)')
    .eq('task_id', taskId)
    .order('submitted_at', { ascending: false });
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
  return data ?? [];
}

export async function getMySubmissionForTask(
  ctx: AuthenticatedContext,
  taskId: string
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('submissions')
    .select('*, grade:grades(*)')
    .eq('task_id', taskId)
    .eq('student_id', ctx.userId)
    .maybeSingle();
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
  return data;
}

import type { SubmissionStatus } from '@/lib/types/database';

export interface SubmissionListItem {
  id: string;
  task_id: string;
  task_title: string | null;
  course_id: string;
  course_name: string | null;
  status: SubmissionStatus;
  submitted_at: string;
  file_path: string | null;
  grade_score: number | null;
  grade_max: number | null;
  student_id: string;
  student_name: string | null;
  student_email: string | null;
}

/**
 * Student-facing: own submissions across every task, newest first.
 * RLS already clamps to the caller's institution; we add the student_id
 * filter for belt-and-suspenders and to keep the query narrow.
 */
export async function listMySubmissions(
  ctx: AuthenticatedContext
): Promise<SubmissionListItem[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('submissions')
    .select(
      'id, task_id, status, submitted_at, file_path, student_id, task:tasks!inner(title, course_id, max_score, course:courses!inner(name)), grade:grades(score)'
    )
    .eq('student_id', ctx.userId)
    .order('submitted_at', { ascending: false });

  return ((data ?? []) as unknown as Array<{
    id: string;
    task_id: string;
    status: SubmissionStatus;
    submitted_at: string;
    file_path: string | null;
    student_id: string;
    task: { title: string; course_id: string; max_score: number; course: { name: string } | null } | null;
    grade: Array<{ score: number }> | null;
  }>).map((r) => ({
    id: r.id,
    task_id: r.task_id,
    task_title: r.task?.title ?? null,
    course_id: r.task?.course_id ?? '',
    course_name: r.task?.course?.name ?? null,
    status: r.status,
    submitted_at: r.submitted_at,
    file_path: r.file_path,
    grade_score: r.grade?.[0]?.score ?? null,
    grade_max: r.task?.max_score ?? null,
    student_id: r.student_id,
    student_name: null,
    student_email: null,
  }));
}

/**
 * Staff-facing: submissions for courses the caller can review.
 *   teacher → submissions of tasks belonging to courses they teach
 *   admin   → every submission in the tenant
 * Optional `status` narrows by submission status.
 */
export async function listSubmissionsForReview(
  ctx: AuthenticatedContext,
  opts: { status?: SubmissionStatus | null } = {}
): Promise<SubmissionListItem[]> {
  if (ctx.role === 'student') {
    throw new ApiError('FORBIDDEN', 'Students cannot list tenant submissions');
  }
  const supabase = createClient();
  let query = supabase
    .from('submissions')
    .select(
      'id, task_id, status, submitted_at, file_path, student_id, task:tasks!inner(title, course_id, max_score, course:courses!inner(name, teacher_id)), student:profiles!submissions_student_id_fkey(full_name, email), grade:grades(score)'
    )
    .order('submitted_at', { ascending: false });

  if (opts.status) query = query.eq('status', opts.status);
  if (ctx.role === 'teacher') query = query.eq('task.course.teacher_id', ctx.userId);

  const { data } = await query;
  return ((data ?? []) as unknown as Array<{
    id: string;
    task_id: string;
    status: SubmissionStatus;
    submitted_at: string;
    file_path: string | null;
    student_id: string;
    task: { title: string; course_id: string; max_score: number; course: { name: string } | null } | null;
    student: { full_name: string | null; email: string } | null;
    grade: Array<{ score: number }> | null;
  }>).map((r) => ({
    id: r.id,
    task_id: r.task_id,
    task_title: r.task?.title ?? null,
    course_id: r.task?.course_id ?? '',
    course_name: r.task?.course?.name ?? null,
    status: r.status,
    submitted_at: r.submitted_at,
    file_path: r.file_path,
    grade_score: r.grade?.[0]?.score ?? null,
    grade_max: r.task?.max_score ?? null,
    student_id: r.student_id,
    student_name: r.student?.full_name ?? null,
    student_email: r.student?.email ?? null,
  }));
}

