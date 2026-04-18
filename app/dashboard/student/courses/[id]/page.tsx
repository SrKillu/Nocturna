import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { StudentCourseClient } from './course-client';

export default async function StudentCoursePage({ params }: { params: { id: string } }) {
  const ctx = await requireAuth();
  const supabase = createClient();

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', params.id)
    .eq('student_id', ctx.userId)
    .maybeSingle();

  if (!enrollment) return notFound();

  const [{ data: course }, { data: tasks }, { data: mySubs }] = await Promise.all([
    supabase.from('courses').select('id, name, description').eq('id', params.id).single(),
    supabase
      .from('tasks')
      .select('id, title, description, due_date, max_score')
      .eq('course_id', params.id)
      .order('due_date', { ascending: true, nullsFirst: false }),
    supabase
      .from('submissions')
      .select('id, task_id, status, content, submitted_at, grade:grades(score, feedback)')
      .eq('student_id', ctx.userId),
  ]);

  if (!course) return notFound();

  const subsByTask = new Map<string, StudentSubmission>();
  for (const s of (mySubs ?? []) as unknown as StudentSubmission[]) {
    subsByTask.set(s.task_id, s);
  }

  const tasksWithMine = (tasks ?? []).map((t) => ({ ...t, mine: subsByTask.get(t.id) ?? null }));

  return <StudentCourseClient course={course} tasks={tasksWithMine as StudentTaskRow[]} />;
}

export interface StudentSubmission {
  id: string;
  task_id: string;
  status: string;
  content: string | null;
  submitted_at: string;
  grade: { score: number; feedback: string | null } | null;
}

export interface StudentTaskRow {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_score: number;
  mine: StudentSubmission | null;
}
