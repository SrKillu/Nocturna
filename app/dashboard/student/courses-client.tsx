'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CoursePreview } from './page';

export function StudentCoursesClient({
  available,
  mine,
}: {
  available: CoursePreview[];
  mine: CoursePreview[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function enroll(courseId: string) {
    setPendingId(courseId);
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload?.error?.message ?? 'Error al matricular');
        return;
      }
      toast.success('Matriculado');
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Mis cursos</h1>
        {mine.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              Todavía no estás matriculado en ningún curso. Matriculándote abajo.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {mine.map((c) => (
              <Card key={c.id} className="transition-colors hover:border-primary/60">
                <CardHeader>
                  <CardTitle className="text-lg">{c.name}</CardTitle>
                  <CardDescription>
                    Profesor: {c.teacher?.full_name ?? c.teacher?.email ?? 'Sin asignar'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/dashboard/student/courses/${c.id}`}>
                    <Button size="sm">Ver tareas</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Cursos disponibles</h2>
        {available.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              No hay cursos disponibles en tu institución por ahora.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {available.map((c) => (
              <Card key={c.id}>
                <CardHeader>
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <CardDescription>
                    Profesor: {c.teacher?.full_name ?? c.teacher?.email ?? 'Sin asignar'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" onClick={() => enroll(c.id)} disabled={pendingId === c.id}>
                    {pendingId === c.id ? 'Matriculando…' : 'Matricularme'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
