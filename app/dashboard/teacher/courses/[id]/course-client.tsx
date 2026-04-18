'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Plus, Users } from 'lucide-react';
import type { TaskRow, StudentRow } from './page';

interface SubmissionWithGrade {
  id: string;
  student_id: string;
  content: string | null;
  status: string;
  submitted_at: string;
  student: { full_name: string | null; email: string } | null;
  grade: { score: number; feedback: string | null } | null;
}

export function TeacherCourseClient({
  course,
  tasks: initialTasks,
  students,
}: {
  course: { id: string; name: string; description: string | null };
  tasks: TaskRow[];
  students: StudentRow[];
}) {
  const router = useRouter();
  const [tasks] = useState(initialTasks);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState(100);
  const [loading, setLoading] = useState(false);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          title,
          description: description || null,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          maxScore: Number(maxScore),
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload?.error?.message ?? 'Error al crear la tarea');
        return;
      }
      toast.success('Tarea creada');
      setTitle('');
      setDescription('');
      setDueDate('');
      setMaxScore(100);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{course.name}</h1>
        {course.description && (
          <p className="text-sm text-muted-foreground">{course.description}</p>
        )}
      </div>

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks"><ClipboardList className="mr-2 h-4 w-4" /> Tareas</TabsTrigger>
          <TabsTrigger value="students"><Users className="mr-2 h-4 w-4" /> Estudiantes</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4" /> Nueva tarea
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createTask} className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Título</Label>
                  <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label>Fecha límite</Label>
                  <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label>Puntaje máximo</Label>
                  <Input type="number" min={1} max={1000} value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} />
                </div>
                <div className="space-y-2 md:col-span-4">
                  <Label>Descripción</Label>
                  <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="md:col-span-4">
                  <Button type="submit" disabled={loading}>{loading ? 'Creando…' : 'Crear tarea'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {tasks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  Todavía no has creado tareas.
                </CardContent>
              </Card>
            ) : (
              tasks.map((t) => <TaskCard key={t.id} task={t} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estudiantes matriculados ({students.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {students.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Aún no hay estudiantes matriculados en este curso.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Nombre</TableHead><TableHead>Correo</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.full_name ?? '—'}</TableCell>
                        <TableCell>{s.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TaskCard({ task }: { task: TaskRow }) {
  const [open, setOpen] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionWithGrade[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/submissions`);
      const payload = await res.json();
      if (res.ok) setSubmissions(payload.data);
    } finally {
      setLoading(false);
    }
  }, [task.id]);

  useEffect(() => {
    if (open && !submissions) void load();
  }, [open, submissions, load]);

  async function grade(sub: SubmissionWithGrade, score: number, feedback: string) {
    const res = await fetch(`/api/submissions/${sub.id}/grade`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ score, feedback: feedback || null }),
    });
    const payload = await res.json();
    if (!res.ok) {
      toast.error(payload?.error?.message ?? 'Error al calificar');
      return;
    }
    toast.success('Calificación guardada');
    void load();
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
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">Máx {task.max_score} pts</Badge>
              {task.due_date && (
                <Badge variant="outline">Vence {new Date(task.due_date).toLocaleString('es')}</Badge>
              )}
            </div>
          </div>
          <Button size="sm" variant={open ? 'secondary' : 'default'} onClick={() => setOpen((v) => !v)}>
            {open ? 'Ocultar entregas' : 'Ver entregas'}
          </Button>
        </div>
      </CardHeader>
      {open && (
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}
          {!loading && submissions && submissions.length === 0 && (
            <p className="text-sm text-muted-foreground">Aún no hay entregas.</p>
          )}
          {!loading && submissions && submissions.length > 0 && (
            <div className="space-y-3">
              {submissions.map((s) => (
                <SubmissionRow key={s.id} submission={s} maxScore={task.max_score} onGrade={grade} />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function SubmissionRow({
  submission,
  maxScore,
  onGrade,
}: {
  submission: SubmissionWithGrade;
  maxScore: number;
  onGrade: (s: SubmissionWithGrade, score: number, feedback: string) => Promise<void>;
}) {
  const [score, setScore] = useState<number>(submission.grade?.score ?? 0);
  const [feedback, setFeedback] = useState<string>(submission.grade?.feedback ?? '');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try { await onGrade(submission, score, feedback); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{submission.student?.full_name ?? submission.student?.email ?? 'Estudiante'}</p>
          <p className="text-xs text-muted-foreground">
            Entregado el {new Date(submission.submitted_at).toLocaleString('es')}
          </p>
        </div>
        <Badge variant={submission.status === 'graded' ? 'default' : 'secondary'}>
          {submission.status === 'graded' ? 'Calificada' : 'Entregada'}
        </Badge>
      </div>
      {submission.content && (
        <p className="mt-3 whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm">{submission.content}</p>
      )}
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <Label>Puntaje (de {maxScore})</Label>
          <Input type="number" min={0} max={maxScore} value={score} onChange={(e) => setScore(Number(e.target.value))} />
        </div>
        <div className="md:col-span-2 space-y-1">
          <Label>Retroalimentación</Label>
          <Input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Opcional" />
        </div>
      </div>
      <div className="mt-3">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? 'Guardando…' : submission.grade ? 'Actualizar calificación' : 'Calificar'}
        </Button>
      </div>
    </div>
  );
}
