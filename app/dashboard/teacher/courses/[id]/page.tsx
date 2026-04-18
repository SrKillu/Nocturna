import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { TeacherCourseClient } from './course-client';

export default async function TeacherCoursePage({ params }: { params: { id: string } }) {
  const ctx = await requireAuth();
  const supabase = createClient();

  const { data: course } = await supabase
    .from('courses')
    .select('id, name, description, teacher_id')
    .eq('id', params.id)
    .single();
  if (!course) return notFound();
  if (course.teacher_id !== ctx.userId && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    return notFound();
  }

  const [{ data: tasks }, { data: enrollments }] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, description, due_date, max_score, created_at')
      .eq('course_id', params.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('enrollments')
      .select('student:profiles!enrollments_student_id_fkey(id, full_name, email)')
      .eq('course_id', params.id),
  ]);

  return (
    <TeacherCourseClient
      course={course}
      tasks={(tasks ?? []) as TaskRow[]}
      students={((enrollments ?? []).map((e: { student: unknown }) => e.student).filter(Boolean)) as StudentRow[]}
    />
  );
}

export interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_score: number;
  created_at: string;
}

export interface StudentRow {
  id: string;
  full_name: string | null;
  email: string;
}
