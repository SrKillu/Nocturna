import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default async function StudentTasksPage() {
  const ctx = await requireAuth();
  const supabase = createClient();

  const { data } = await supabase
    .from('enrollments')
    .select('course:courses(id, name, tasks:tasks(id, title, due_date, max_score))')
    .eq('student_id', ctx.userId);

  const { data: subs } = await supabase
    .from('submissions')
    .select('task_id, status, grade:grades(score)')
    .eq('student_id', ctx.userId);

  const subMap = new Map<string, { status: string; score?: number }>();
  for (const s of subs ?? []) {
    subMap.set(s.task_id, {
      status: s.status,
      score: (s.grade as { score?: number } | null)?.score,
    });
  }

  const courses = (data ?? []).map((e: { course: unknown }) => e.course).filter(Boolean) as {
    id: string;
    name: string;
    tasks: { id: string; title: string; due_date: string | null; max_score: number }[];
  }[];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mis tareas</h1>
        <p className="text-sm text-muted-foreground">Todas las tareas de los cursos en los que estás matriculado.</p>
      </div>
      {courses.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aún no estás matriculado en ningún curso.
        </CardContent></Card>
      ) : (
        courses.map((course) => (
          <Card key={course.id}>
            <CardHeader><CardTitle className="text-base">{course.name}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {course.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin tareas publicadas.</p>
              ) : course.tasks.map((t) => {
                const sub = subMap.get(t.id);
                return (
                  <Link
                    key={t.id}
                    href={`/dashboard/student/courses/${course.id}`}
                    className="flex items-center justify-between rounded-md border bg-card p-3 transition-colors hover:border-primary/60"
                  >
                    <div>
                      <p className="font-medium">{t.title}</p>
                      {t.due_date && (
                        <p className="text-xs text-muted-foreground">
                          Vence {new Date(t.due_date).toLocaleString('es')}
                        </p>
                      )}
                    </div>
                    <Badge variant={sub?.status === 'graded' ? 'default' : sub ? 'secondary' : 'outline'}>
                      {sub?.status === 'graded'
                        ? `Calificada ${sub.score ?? '?'} / ${t.max_score}`
                        : sub
                        ? 'Entregada'
                        : 'Pendiente'}
                    </Badge>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
