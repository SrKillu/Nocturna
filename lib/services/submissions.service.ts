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
