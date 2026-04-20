'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Mail, UserRound } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/api/client';

interface StudentRow {
  enrollment_id: string;
  student_id: string;
  full_name: string | null;
  email: string;
  enrolled_at: string;
}

function initials(name: string | null, email: string): string {
  const src = (name?.trim() || email).trim();
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function CourseStudentsTab({ courseId }: { courseId: string }) {
  const [rows, setRows] = useState<StudentRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/courses/${courseId}/students`);
      const json = (await res.json().catch(() => ({}))) as { data?: StudentRow[] };
      setRows(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <UserRound className="h-4 w-4" />
          </span>
          <div>
            <CardTitle className="text-base">Estudiantes</CardTitle>
            <CardDescription>
              {rows
                ? `${rows.length} matriculado${rows.length === 1 ? '' : 's'}`
                : '—'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </p>
        ) : !rows || rows.length === 0 ? (
          <p className="rounded-md border border-dashed bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            Todavía no hay estudiantes matriculados en este curso.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-2 py-2 font-medium">Nombre</th>
                  <th className="px-2 py-2 font-medium">Email</th>
                  <th className="px-2 py-2 font-medium">Inscripción</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.enrollment_id} className="border-b last:border-b-0">
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {initials(s.full_name, s.email)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate font-medium">
                          {s.full_name?.trim() || s.email.split('@')[0]}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {s.email}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-xs text-muted-foreground">
                      {formatDate(s.enrolled_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
