import { AdminCoursesClient } from './courses-client';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';

export default async function AdminCoursesPage() {
  await requireAuth();
  const supabase = createClient();

  const [{ data: courses }, { data: teachers }] = await Promise.all([
    supabase
      .from('courses')
      .select('id, name, description, teacher_id, created_at, teacher:profiles!courses_teacher_id_fkey(full_name, email)')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'teacher')
      .order('full_name'),
  ]);

  return (
    <AdminCoursesClient
      initialCourses={(courses ?? []) as unknown as CourseRow[]}
      teachers={(teachers ?? []) as TeacherRow[]}
    />
  );
}

export interface CourseRow {
  id: string;
  name: string;
  description: string | null;
  teacher_id: string | null;
  created_at: string;
  teacher: { full_name: string | null; email: string } | null;
}

export interface TeacherRow {
  id: string;
  full_name: string | null;
  email: string;
}
