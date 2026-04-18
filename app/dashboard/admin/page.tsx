import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, ClipboardList } from 'lucide-react';

export default async function AdminOverviewPage() {
  const ctx = await requireAuth();
  const supabase = createClient();

  const [{ count: coursesCount }, { count: usersCount }, { count: tasksCount }] = await Promise.all([
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('*', { count: 'exact', head: true }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Panel de administración</h1>
        <p className="text-sm text-muted-foreground">
          Bienvenido{ctx.email ? `, ${ctx.email}` : ''}. Gestiona tu institución desde aquí.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={<BookOpen className="h-5 w-5" />} label="Cursos" value={coursesCount ?? 0} />
        <StatCard icon={<Users className="h-5 w-5" />} label="Usuarios" value={usersCount ?? 0} />
        <StatCard icon={<ClipboardList className="h-5 w-5" />} label="Tareas" value={tasksCount ?? 0} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Crea tu primer curso</CardTitle>
            <CardDescription>
              Asigna un profesor responsable. Los estudiantes podrán matricularse después.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/admin/courses">
              <Button>Ir a cursos</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Invita a tu equipo</CardTitle>
            <CardDescription>
              Añade profesores y estudiantes a tu institución con un clic.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/admin/users">
              <Button variant="secondary">Ir a usuarios</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
