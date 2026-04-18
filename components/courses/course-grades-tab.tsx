'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api/client';

interface GradeRow {
  id: string;
  student_id: string;
  exam_score: number | null;
  final_score: number | null;
  comments: string | null;
  student: { id: string; full_name: string | null; email: string } | null;
}

type Draft = { exam: string; final: string; comments: string };

export function CourseGradesTab({
  courseId,
  canManage,
  isStudent,
  ownUserId,
}: {
  courseId: string;
  canManage: boolean;
  isStudent: boolean;
  ownUserId: string;
}) {
  const [rows, setRows] = useState<GradeRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/courses/${courseId}/grades`);
      const json = (await res.json().catch(() => ({}))) as { data?: GradeRow[] };
      const list = json.data ?? [];
      setRows(list);
      const d: Record<string, Draft> = {};
      for (const r of list) {
        d[r.student_id] = {
          exam: r.exam_score == null ? '' : String(r.exam_score),
          final: r.final_score == null ? '' : String(r.final_score),
          comments: r.comments ?? '',
        };
      }
      setDrafts(d);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(studentId: string) {
    const d = drafts[studentId];
    if (!d) return;
    setSavingId(studentId);
    try {
      const body = {
        studentId,
        examScore: d.exam.trim() === '' ? null : Number(d.exam),
        finalScore: d.final.trim() === '' ? null : Number(d.final),
        comments: d.comments.trim() ? d.comments.trim() : null,
      };
      const res = await apiFetch(`/api/courses/${courseId}/grades`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      if (!res.ok) {
        toast.error('No se pudo guardar', { description: json.error?.message });
        return;
      }
      toast.success('Nota guardada');
      await load();
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  if (!rows || rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        {isStudent
          ? 'Aún no tienes notas en este curso.'
          : 'Todavía no hay estudiantes inscritos.'}
      </p>
    );
  }

  const visible = isStudent ? rows.filter((r) => r.student_id === ownUserId) : rows;

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2 text-left">Estudiante</th>
            <th className="px-4 py-2 text-left">Examen</th>
            <th className="px-4 py-2 text-left">Final</th>
            <th className="px-4 py-2 text-left">Comentarios</th>
            {canManage ? <th className="px-4 py-2" /> : null}
          </tr>
        </thead>
        <tbody className="divide-y">
          {visible.map((r) => {
            const d = drafts[r.student_id] ?? { exam: '', final: '', comments: '' };
            const saving = savingId === r.student_id;
            return (
              <tr key={r.student_id}>
                <td className="px-4 py-2">
                  <p className="font-medium">
                    {r.student?.full_name?.trim() || r.student?.email || r.student_id}
                  </p>
                  {r.student?.email ? (
                    <p className="text-xs text-muted-foreground">{r.student.email}</p>
                  ) : null}
                </td>
                <td className="px-4 py-2">
                  {canManage ? (
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={d.exam}
                      onChange={(e) =>
                        setDrafts((s) => ({
                          ...s,
                          [r.student_id]: { ...d, exam: e.target.value },
                        }))
                      }
                      disabled={saving}
                      className="w-24"
                    />
                  ) : (
                    <span>{r.exam_score ?? '—'}</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {canManage ? (
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={d.final}
                      onChange={(e) =>
                        setDrafts((s) => ({
                          ...s,
                          [r.student_id]: { ...d, final: e.target.value },
                        }))
                      }
                      disabled={saving}
                      className="w-24"
                    />
                  ) : (
                    <span className="font-medium">{r.final_score ?? '—'}</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {canManage ? (
                    <Textarea
                      rows={2}
                      value={d.comments}
                      onChange={(e) =>
                        setDrafts((s) => ({
                          ...s,
                          [r.student_id]: { ...d, comments: e.target.value },
                        }))
                      }
                      disabled={saving}
                    />
                  ) : (
                    <span className="text-muted-foreground">{r.comments ?? ''}</span>
                  )}
                </td>
                {canManage ? (
                  <td className="px-4 py-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => save(r.student_id)}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="mr-1.5 h-4 w-4" /> Guardar
                        </>
                      )}
                    </Button>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
