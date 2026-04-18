import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { requireAuth } from '@/lib/api/auth';
import { roleLabel } from '@/lib/rbac/labels';
import { BookOpen, ClipboardList, FileUp, GraduationCap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Panel · Nocturna',
};

export default async function DashboardHome() {
  const ctx = await requireAuth();
  return (
    <>
      <PageHeader
        title="Panel"
        description={`Bienvenido·a de nuevo. Rol actual: ${roleLabel(ctx.role)}.`}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<BookOpen className="h-4 w-4" />} title="Cursos" hint="Gestión y matriculación" />
        <StatCard icon={<ClipboardList className="h-4 w-4" />} title="Tareas" hint="Creación y seguimiento" />
        <StatCard icon={<FileUp className="h-4 w-4" />} title="Entregas" hint="Archivos y estado" />
        <StatCard icon={<GraduationCap className="h-4 w-4" />} title="Calificaciones" hint="Histórico y feedback" />
      </div>
    </>
  );
}

function StatCard({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className="rounded-md bg-muted p-1.5 text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <CardDescription>{hint}</CardDescription>
      </CardContent>
    </Card>
  );
}
