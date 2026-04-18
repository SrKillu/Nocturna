'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { StudentTaskRow } from './page';

export function StudentCourseClient({
  course,
  tasks,
}: {
  course: { id: string; name: string; description: string | null };
  tasks: StudentTaskRow[];
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{course.name}</h1>
        {course.description && (
          <p className="text-sm text-muted-foreground">{course.description}</p>
        )}
      </div>
      {tasks.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
          El profesor aún no ha publicado tareas.
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => <TaskCard key={t.id} task={t} />)}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task }: { task: StudentTaskRow }) {
  const router = useRouter();
  const [content, setContent] = useState(task.mine?.content ?? '');
  const [saving, setSaving] = useState(false);
  const graded = task.mine?.status === 'graded';

  async function submit() {
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/submissions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload?.error?.message ?? 'Error al entregar');
        return;
      }
      toast.success('Entrega enviada');
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">{task.title}</CardTitle>
            {task.description && (
              <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">Máx {task.max_score} pts</Badge>
              {task.due_date && (
                <Badge variant="outline">Vence {new Date(task.due_date).toLocaleString('es')}</Badge>
              )}
              {task.mine && (
                <Badge variant={graded ? 'default' : 'secondary'}>
                  {graded ? `Calificada: ${task.mine.grade?.score ?? '?'} / ${task.max_score}` : 'Entregada'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label>Mi respuesta</Label>
          <Textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={graded}
            placeholder="Escribe o pega tu entrega aquí..."
          />
        </div>
        {graded && task.mine?.grade?.feedback && (
          <div className="rounded-md bg-accent p-3 text-sm">
            <p className="font-medium">Retroalimentación del profesor</p>
            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{task.mine.grade.feedback}</p>
          </div>
        )}
        {!graded && (
          <Button onClick={submit} disabled={saving || content.trim().length === 0}>
            {saving ? 'Enviando…' : task.mine ? 'Actualizar entrega' : 'Entregar'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
