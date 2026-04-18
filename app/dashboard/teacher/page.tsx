import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function TeacherHomePage() {
  const ctx = await requireAuth();
  const supabase = createClient();
  const { data: courses } = await supabase
    .from('courses')
    .select('id, name, description')
    .eq('teacher_id', ctx.userId)
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mis cursos</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona tareas y califica entregas de tus estudiantes.
        </p>
      </div>
      {(!courses || courses.length === 0) ? (
        <Card>
          <CardHeader>
            <CardTitle>Aún no te han asignado cursos</CardTitle>
            <CardDescription>
              Pide al administrador de tu institución que te asigne como profesor a un curso.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((c) => (
            <Card key={c.id} className="transition-colors hover:border-primary/60">
              <CardHeader>
                <CardTitle className="text-lg">{c.name}</CardTitle>
                {c.description && <CardDescription>{c.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <Link href={`/dashboard/teacher/courses/${c.id}`}>
                  <Button size="sm">Abrir curso</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
