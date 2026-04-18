import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { StudentCoursesClient } from './courses-client';

export default async function StudentHomePage() {
  const ctx = await requireAuth();
  const supabase = createClient();

  const [{ data: allCourses }, { data: myEnrollments }] = await Promise.all([
    supabase
      .from('courses')
      .select('id, name, description, teacher:profiles!courses_teacher_id_fkey(full_name, email)')
      .order('created_at', { ascending: false }),
    supabase.from('enrollments').select('course_id').eq('student_id', ctx.userId),
  ]);

  const enrolledIds = new Set((myEnrollments ?? []).map((e) => e.course_id));
  const available = (allCourses ?? []).filter((c) => !enrolledIds.has(c.id));
  const mine = (allCourses ?? []).filter((c) => enrolledIds.has(c.id));

  return <StudentCoursesClient available={available as unknown as CoursePreview[]} mine={mine as unknown as CoursePreview[]} />;
}

export interface CoursePreview {
  id: string;
  name: string;
  description: string | null;
  teacher: { full_name: string | null; email: string } | null;
}
