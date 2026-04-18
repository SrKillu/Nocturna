import type { LucideIcon } from 'lucide-react';
import { BookOpen, ClipboardList, FileUp, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardKpis } from '@/lib/services/dashboard.service';
import type { UserRole } from '@/lib/types/database';

interface KpiGridProps {
  kpis: DashboardKpis;
  role: UserRole;
}

export function KpiGrid({ kpis, role }: KpiGridProps) {
  const cards = buildCards(kpis, role);
  return (
    <section
      aria-label="Indicadores clave"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {cards.map((card) => (
        <KpiCard key={card.title} {...card} />
      ))}
    </section>
  );
}

interface KpiCard {
  title: string;
  value: number;
  hint: string;
  icon: LucideIcon;
}

function buildCards(k: DashboardKpis, role: UserRole): KpiCard[] {
  const isStudent = role === 'student';
  return [
    {
      title: isStudent ? 'Mis cursos' : 'Cursos activos',
      value: k.activeCourses,
      hint: isStudent ? 'Matriculados en tu institución' : 'Cursos en tu institución',
      icon: BookOpen,
    },
    {
      title: isStudent ? 'Tareas pendientes' : 'Entregas por revisar',
      value: k.pendingTasks,
      hint: isStudent ? 'Tareas sin enviar o en revisión' : 'Esperando tu calificación',
      icon: ClipboardList,
    },
    {
      title: 'Entregas (7 d)',
      value: k.recentSubmissions,
      hint: 'Enviadas en los últimos 7 días',
      icon: FileUp,
    },
    {
      title: 'Calificadas (7 d)',
      value: k.gradedSubmissions,
      hint: 'Procesadas en los últimos 7 días',
      icon: GraduationCap,
    },
  ];
}

function KpiCard({ title, value, hint, icon: Icon }: KpiCard) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        <span className="rounded-md bg-muted p-1.5 text-muted-foreground">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-3xl font-semibold tabular-nums">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
