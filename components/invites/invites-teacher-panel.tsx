'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InviteQrCard } from '@/components/invites/invite-qr-card';
import {
  inviteStatus,
  type StudentInviteRow,
} from '@/lib/invites/types';
import type { UserRole } from '@/lib/types/database';

interface CourseOption {
  id: string;
  name: string;
  teacher_id: string | null;
}

interface Props {
  role: UserRole;
  userId: string;
  courses: CourseOption[];
  initialInvites: StudentInviteRow[];
}

export function InvitesTeacherPanel({ role, userId, courses, initialInvites }: Props) {
  // Teacher solo ve sus cursos; admin ve todos (backend ya filtra por RLS, pero
  // hacemos defensa en profundidad en la UI).
  const eligibleCourses = useMemo(() => {
    if (role === 'teacher') return courses.filter((c) => c.teacher_id === userId);
    return courses;
  }, [courses, role, userId]);

  const [invites, setInvites] = useState<StudentInviteRow[]>(initialInvites);
  const [courseId, setCourseId] = useState<string>(eligibleCourses[0]?.id ?? '');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId) {
      toast.error('Seleccioná un curso');
      return;
    }
    setCreating(true);
    try {
      const res = await apiFetch('/api/invites/students', {
        method: 'POST',
        body: JSON.stringify({ courseId, expiresInDays }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        data?: StudentInviteRow;
        error?: { message?: string };
      };
      if (!res.ok || !json.data) {
        toast.error('No se pudo generar el QR', { description: json.error?.message });
        return;
      }
      setInvites((prev) => [json.data as StudentInviteRow, ...prev]);
      toast.success('Invitación creada');
    } finally {
      setCreating(false);
    }
  }

  async function revokeOrDelete(id: string) {
    const current = invites.find((i) => i.id === id);
    const isRevoked = current?.revoked === true;
    const label = isRevoked ? 'eliminar definitivamente' : 'revocar';
    if (!window.confirm(`¿Seguro que querés ${label} esta invitación?`)) return;
    setRevokingId(id);
    try {
      const res = await apiFetch(`/api/invites/students/${id}`, { method: 'DELETE' });
      const json = (await res.json().catch(() => ({}))) as {
        data?: { deleted?: boolean };
      };
      if (!res.ok) {
        toast.error(isRevoked ? 'No se pudo eliminar' : 'No se pudo revocar');
        return;
      }
      if (json.data?.deleted) {
        setInvites((prev) => prev.filter((i) => i.id !== id));
        toast.success('Invitación eliminada');
      } else {
        setInvites((prev) =>
          prev.map((i) => (i.id === id ? { ...i, revoked: true } : i))
        );
        toast.success('Invitación revocada');
      }
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Invitaciones para estudiantes</CardTitle>
        <CardDescription>
          Generá un QR por curso. Al escanearlo, el estudiante queda inscripto automáticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {eligibleCourses.length === 0 ? (
          <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            Todavía no sos el profesor de ningún curso.
          </p>
        ) : (
          <form
            onSubmit={create}
            className="grid gap-3 rounded-md border bg-muted/30 p-4 sm:grid-cols-[minmax(0,1fr)_120px_auto] sm:items-end"
          >
            <div className="space-y-1.5">
              <Label htmlFor="s-course">Curso</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger id="s-course">
                  <SelectValue placeholder="Selecciona un curso" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleCourses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-exp">Expira (días)</Label>
              <Input
                id="s-exp"
                type="number"
                min={1}
                max={30}
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))}
                disabled={creating}
              />
            </div>
            <Button type="submit" disabled={creating || !courseId}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 h-4 w-4" /> Generar QR
                </>
              )}
            </Button>
          </form>
        )}

        {invites.length === 0 ? (
          <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No hay invitaciones a estudiantes todavía.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {invites.map((inv) => (
              <InviteQrCard
                key={inv.id}
                token={inv.token}
                status={inviteStatus(inv)}
                expiresAt={inv.expires_at}
                title={inv.course_name ?? 'Curso'}
                subtitle={`Creada ${new Date(inv.created_at).toLocaleDateString('es', {
                  day: '2-digit',
                  month: 'short',
                })}`}
                onRevoke={() => revokeOrDelete(inv.id)}
                onDelete={() => revokeOrDelete(inv.id)}
                revoking={revokingId === inv.id}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
