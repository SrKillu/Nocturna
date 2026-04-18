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
