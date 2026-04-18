import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/errors';
import type { AuthenticatedContext } from '@/lib/types/auth';
import type { GradeSubmissionInput } from '@/lib/validations/grades';

/**
 * Idempotent grading via the Postgres RPC `grade_submission`:
 * upsert grade + flip submission status + audit log, all in one SQL scope.
 * Ownership (teacher of the course) is enforced inside the RPC too.
 */
export async function gradeSubmission(
  ctx: AuthenticatedContext,
  submissionId: string,
  input: GradeSubmissionInput
) {
  if (ctx.role !== 'teacher' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw new ApiError('FORBIDDEN', 'Only teachers or admins can grade');
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc('grade_submission', {
    p_submission_id: submissionId,
    p_score: input.score,
    p_feedback: input.feedback ?? null,
  });

  if (error) {
    // Map Postgres error codes to stable HTTP shapes without leaking details.
    const code = (error as { code?: string }).code;
    if (code === 'P0002') throw new ApiError('NOT_FOUND', 'Submission not found');
    if (code === '42501') throw new ApiError('FORBIDDEN', 'Not allowed to grade this submission');
    if (code === '22023') throw new ApiError('VALIDATION_ERROR', 'Score out of range');
    // eslint-disable-next-line no-console
    console.error('[grade_submission] rpc failed', error);
    throw new ApiError('INTERNAL_ERROR', 'Could not save grade');
  }

  return data;
}

export interface GradeListItem {
  submission_id: string;
  task_id: string;
  task_title: string;
  course_id: string;
  course_name: string;
  student_id: string;
  student_name: string | null;
  student_email: string | null;
  status: import('@/lib/types/database').SubmissionStatus;
  submitted_at: string;
  max_score: number;
  score: number | null;
  feedback: string | null;
  graded_at: string | null;
}

/**
 * Student-facing: every submission of the current user together with its
 * grade (if any). Ordered newest first.
 */
export async function listGradesForStudent(
  ctx: AuthenticatedContext
): Promise<GradeListItem[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('submissions')
    .select(
      'id, task_id, status, submitted_at, student_id, task:tasks!inner(title, course_id, max_score, course:courses!inner(id, name)), grade:grades(score, feedback, graded_at)'
    )
    .eq('student_id', ctx.userId)
    .order('submitted_at', { ascending: false });

  return ((data ?? []) as unknown as Array<{
    id: string;
    task_id: string;
    status: import('@/lib/types/database').SubmissionStatus;
    submitted_at: string;
    student_id: string;
    task: { title: string; course_id: string; max_score: number; course: { id: string; name: string } } | null;
    grade: Array<{ score: number; feedback: string | null; graded_at: string }> | null;
  }>).map((r) => {
    const g = r.grade?.[0] ?? null;
    return {
      submission_id: r.id,
      task_id: r.task_id,
      task_title: r.task?.title ?? '',
      course_id: r.task?.course?.id ?? '',
      course_name: r.task?.course?.name ?? '',
      student_id: r.student_id,
      student_name: null,
      student_email: null,
      status: r.status,
      submitted_at: r.submitted_at,
      max_score: r.task?.max_score ?? 0,
      score: g?.score ?? null,
      feedback: g?.feedback ?? null,
      graded_at: g?.graded_at ?? null,
    };
  });
}

/**
 * Staff-facing: submissions the caller can grade.
 *   teacher → submissions of tasks in their courses
 *   admin   → every submission in the tenant
 */
export async function listGradesForReview(
  ctx: AuthenticatedContext,
  opts: { onlyPending?: boolean } = {}
): Promise<GradeListItem[]> {
  if (ctx.role === 'student') {
    throw new ApiError('FORBIDDEN', 'Students cannot review grades');
  }
  const supabase = createClient();
  let query = supabase
    .from('submissions')
    .select(
      'id, task_id, status, submitted_at, student_id, task:tasks!inner(title, course_id, max_score, course:courses!inner(id, name, teacher_id)), student:profiles!submissions_student_id_fkey(full_name, email), grade:grades(score, feedback, graded_at)'
    )
    .order('submitted_at', { ascending: false });

  if (ctx.role === 'teacher') query = query.eq('task.course.teacher_id', ctx.userId);
  if (opts.onlyPending) query = query.eq('status', 'submitted');

  const { data } = await query;
  return ((data ?? []) as unknown as Array<{
    id: string;
    task_id: string;
    status: import('@/lib/types/database').SubmissionStatus;
    submitted_at: string;
    student_id: string;
    task: { title: string; course_id: string; max_score: number; course: { id: string; name: string } } | null;
    student: { full_name: string | null; email: string } | null;
    grade: Array<{ score: number; feedback: string | null; graded_at: string }> | null;
  }>).map((r) => {
    const g = r.grade?.[0] ?? null;
    return {
      submission_id: r.id,
      task_id: r.task_id,
      task_title: r.task?.title ?? '',
      course_id: r.task?.course?.id ?? '',
      course_name: r.task?.course?.name ?? '',
      student_id: r.student_id,
      student_name: r.student?.full_name ?? null,
      student_email: r.student?.email ?? null,
      status: r.status,
      submitted_at: r.submitted_at,
      max_score: r.task?.max_score ?? 0,
      score: g?.score ?? null,
      feedback: g?.feedback ?? null,
      graded_at: g?.graded_at ?? null,
    };
  });
}

