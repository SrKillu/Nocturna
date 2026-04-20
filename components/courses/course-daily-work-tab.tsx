'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  BookOpenCheck,
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  Plus,
  Send,
  Trash2,
  Users2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { apiFetch } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/lib/types/database';

interface DailyWorkRow {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
  submissions_count: number;
  my_submission: {
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
  } | null;
}

interface DailyWorkSubmission {
  id: string;
  work_id: string;
  student_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  student: { id: string; full_name: string | null; email: string } | null;
}

function timeOf(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function CourseDailyWorkTab({
  courseId,
  role,
  canManage,
}: {
  courseId: string;
  role: UserRole;
  canManage: boolean;
}) {
  const [rows, setRows] = useState<DailyWorkRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const isStudent = role === 'student';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/courses/${courseId}/daily-work`);
      const json = (await res.json().catch(() => ({}))) as { data?: DailyWorkRow[] };
      setRows(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      const res = await apiFetch(`/api/courses/${courseId}/daily-work`, {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
        }),
      });
      if (!res.ok) {
        toast.error('No se pudo crear el trabajo');
        return;
      }
      toast.success('Trabajo publicado');
      setTitle('');
      setDescription('');
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function onDelete(id: string, title: string) {
    if (!window.confirm(`¿Eliminar "${title}" y todas sus respuestas?`)) return;
    const res = await apiFetch(`/api/daily-work/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('No se pudo eliminar');
      return;
    }
    toast.success('Trabajo eliminado');
    await load();
  }

  const sorted = useMemo(() => rows ?? [], [rows]);

  return (
    <div className="space-y-4">
      {canManage ? (
        <form
          onSubmit={onCreate}
          className="space-y-3 rounded-md border bg-muted/30 p-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="dw-title">Título del trabajo</Label>
            <Input
              id="dw-title"
              placeholder="Ej. Reflexión sobre el capítulo 5"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={creating}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dw-desc">Instrucciones (opcional)</Label>
            <Textarea
              id="dw-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={creating}
              placeholder="Podés detallar qué esperás que respondan…"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={creating || !title.trim()}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publicando…
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 h-4 w-4" /> Publicar trabajo
                </>
              )}
            </Button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </p>
      ) : sorted.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <BookOpenCheck className="h-5 w-5 text-muted-foreground" aria-hidden />
            </span>
            <p className="text-sm text-muted-foreground">
              {canManage
                ? 'Todavía no publicaste ningún trabajo.'
                : 'No hay trabajos publicados todavía.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {sorted.map((w) => (
            <WorkItem
              key={w.id}
              work={w}
              canManage={canManage}
              isStudent={isStudent}
              onChanged={load}
              onDelete={() => onDelete(w.id, w.title)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function WorkItem({
  work,
  canManage,
  isStudent,
  onChanged,
  onDelete,
}: {
  work: DailyWorkRow;
  canManage: boolean;
  isStudent: boolean;
  onChanged: () => Promise<void>;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(work.my_submission?.content ?? '');
  const [sending, setSending] = useState(false);
  const [subs, setSubs] = useState<DailyWorkSubmission[] | null>(null);
  const [loadingSubs, setLoadingSubs] = useState(false);

  async function loadSubs() {
    if (!canManage) return;
    setLoadingSubs(true);
    try {
      const res = await apiFetch(`/api/daily-work/${work.id}`);
      const json = (await res.json().catch(() => ({}))) as {
        data?: DailyWorkSubmission[];
      };
      setSubs(json.data ?? []);
    } finally {
      setLoadingSubs(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      const res = await apiFetch(`/api/daily-work/${work.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ content: content.trim() }),
      });
      if (!res.ok) {
        toast.error('No se pudo enviar');
        return;
      }
      toast.success(work.my_submission ? 'Respuesta actualizada' : 'Respuesta enviada');
      await onChanged();
    } finally {
      setSending(false);
    }
  }

  return (
    <li className="rounded-md border bg-card">
      <div className="flex items-start justify-between gap-3 p-4">
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            if (!open && canManage && !subs) void loadSubs();
          }}
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
        >
          {open ? (
            <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{work.title}</p>
            {work.description ? (
              <p
                className={cn(
                  'text-xs text-muted-foreground',
                  open ? 'whitespace-pre-wrap' : 'truncate'
                )}
              >
                {work.description}
              </p>
            ) : null}
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> {timeOf(work.created_at)}
              </span>
              {canManage ? (
                <span className="inline-flex items-center gap-1">
                  <Users2 className="h-3 w-3" /> {work.submissions_count} respuesta
                  {work.submissions_count === 1 ? '' : 's'}
                </span>
              ) : null}
              {isStudent && work.my_submission ? (
                <Badge variant="secondary">Entregada</Badge>
              ) : null}
            </div>
          </div>
        </button>
        {canManage ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onDelete}
            aria-label={`Eliminar ${work.title}`}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        ) : null}
      </div>

      {open ? (
        <div className="space-y-3 border-t bg-muted/20 px-4 py-3">
          {isStudent ? (
            <form onSubmit={onSubmit} className="space-y-2">
              <Label htmlFor={`dw-content-${work.id}`}>Tu respuesta</Label>
              <Textarea
                id={`dw-content-${work.id}`}
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={sending}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {work.my_submission
                    ? `Actualizada ${timeOf(work.my_submission.updated_at)}`
                    : 'Sin entregar todavía'}
                </span>
                <Button type="submit" size="sm" disabled={sending || !content.trim()}>
                  {sending ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-1.5 h-4 w-4" />
                  )}
                  {work.my_submission ? 'Actualizar' : 'Enviar'}
                </Button>
              </div>
            </form>
          ) : null}

          {canManage ? (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Respuestas
              </p>
              {loadingSubs ? (
                <p className="text-sm text-muted-foreground">Cargando…</p>
              ) : !subs || subs.length === 0 ? (
                <p className="rounded-md border border-dashed bg-background px-3 py-4 text-center text-xs text-muted-foreground">
                  Sin respuestas todavía.
                </p>
              ) : (
                <ul className="space-y-2">
                  {subs.map((s) => (
                    <li
                      key={s.id}
                      className="rounded-md border bg-background p-3 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="truncate font-medium text-foreground">
                          {s.student?.full_name?.trim() || s.student?.email || 'Estudiante'}
                        </span>
                        <span>{timeOf(s.updated_at)}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                        {s.content}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
