import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/errors';
import type { AuthenticatedContext } from '@/lib/types/auth';
import type { GradeSubmissionInput } from '@/lib/validations/grades';

export async function gradeSubmission(
  ctx: AuthenticatedContext,
  submissionId: string,
  input: GradeSubmissionInput
) {
  if (ctx.role !== 'teacher' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw new ApiError('FORBIDDEN', 'Only teachers or admins can grade');
  }
  const supabase = createClient();

  // Upsert grade.
  const { data: existing } = await supabase
    .from('grades')
    .select('id')
    .eq('submission_id', submissionId)
    .maybeSingle();

  let grade;
  if (existing) {
    const { data, error } = await supabase
      .from('grades')
      .update({
        score: input.score,
        feedback: input.feedback ?? null,
        teacher_id: ctx.userId,
        graded_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('*')
      .single();
    if (error) throw new ApiError('INTERNAL_ERROR', error.message);
    grade = data;
  } else {
    const { data, error } = await supabase
      .from('grades')
      .insert({
        institution_id: ctx.institutionId,
        submission_id: submissionId,
        teacher_id: ctx.userId,
        score: input.score,
        feedback: input.feedback ?? null,
      })
      .select('*')
      .single();
    if (error) throw new ApiError('INTERNAL_ERROR', error.message);
    grade = data;
  }

  // Flip submission status to 'graded'.
  await supabase
    .from('submissions')
    .update({ status: 'graded' })
    .eq('id', submissionId);

  return grade;
}
