'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Mail, UserMinus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api/client';

/**
 * In-place form + list to enroll students by email. Shown only to staff
 * (admin / super_admin / assigned teacher). Parent page gates visibility.
 *
 * UX:
 *   * Submit by email → creates the enrollment and reloads the page data.
 *   * Each row has an "unenroll" button with a confirm step.
 *   * Non-existing emails produce a helpful toast referencing the admin.
 */
export function EnrollStudentPanel({
  courseId,
  canManage,
  enrolled,
}: {
  courseId: string;
  canManage: boolean;
  enrolled: Array<{ id: string; email: string; full_name: string | null }>;
}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  if (!canManage) return null;

  async function addByEmail(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const res = await apiFetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        body: JSON.stringify({ email: trimmed }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        error?: { message?: string; code?: string };
      };
      if (!res.ok) {
        toast.error('No se pudo inscribir', {
          description: payload?.error?.message ?? `HTTP ${res.status}`,
        });
        return;
      }
      toast.success('Estudiante inscrito');
      setEmail('');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeStudent(studentId: string, label: string) {
    if (!window.confirm(`¿Quitar a ${label} del curso?`)) return;
    const res = await apiFetch(`/api/courses/${courseId}/enroll`, {
      method: 'DELETE',
      body: JSON.stringify({ studentId }),
    });
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      toast.error('No se pudo quitar', {
        description: payload?.error?.message ?? `HTTP ${res.status}`,
      });
      return;
    }
    toast.success('Estudiante removido');
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={addByEmail}
        className="flex flex-col gap-2 rounded-md border bg-muted/30 p-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1 space-y-1.5">
          <label htmlFor="enroll-email" className="text-sm font-medium">
            Agregar estudiante por email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="enroll-email"
              type="email"
              autoComplete="off"
              placeholder="estudiante@institucion.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              className="pl-9"
            />
          </div>
        </div>
        <Button type="submit" disabled={busy || !email.trim()}>
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Agregando…
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" /> Inscribir
            </>
          )}
        </Button>
      </form>

      {enrolled.length > 0 ? (
        <ul className="divide-y rounded-md border">
          {enrolled.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {s.full_name?.trim() || s.email}
                </p>
                <p className="truncate text-xs text-muted-foreground">{s.email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  removeStudent(s.id, s.full_name?.trim() || s.email)
                }
                aria-label={`Quitar a ${s.full_name ?? s.email}`}
              >
                <UserMinus className="mr-1.5 h-4 w-4" /> Quitar
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          Todavía no hay estudiantes inscritos.
        </p>
      )}
    </div>
  );
}
