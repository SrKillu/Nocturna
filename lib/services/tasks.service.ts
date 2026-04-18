import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/errors';
import type { AuthenticatedContext } from '@/lib/types/auth';
import type { CreateTaskInput } from '@/lib/validations/tasks';

export async function createTask(ctx: AuthenticatedContext, input: CreateTaskInput) {
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

  const { data, error } = await supabase
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
  return data;
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
