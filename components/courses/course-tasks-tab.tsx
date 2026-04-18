import Link from 'next/link';
import { CalendarClock, ChevronRight, ClipboardList, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatRelativeDate } from '@/lib/utils/date';
import type { UserRole } from '@/lib/types/database';

interface CourseTasksTabProps {
  tasks: Array<{
    id: string;
    title: string;
    due_date: string | null;
    max_score: number;
  }>;
  courseId: string;
  role: UserRole;
}

export function CourseTasksTab({ tasks, courseId, role }: CourseTasksTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Tareas del curso</CardTitle>
          <CardDescription>Listado ordenado por fecha de entrega.</CardDescription>
        </div>
        {role === 'teacher' || role === 'admin' || role === 'super_admin' ? (
          <Link
            href={`/tasks?courseId=${courseId}`}
            className="text-xs font-medium text-primary hover:underline"
          >
            Gestionar en Módulo de Tareas →
          </Link>
        ) : null}
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <ClipboardList className="h-5 w-5" />
            </span>
            <p className="font-medium text-foreground">Aún no hay tareas</p>
            <p className="max-w-xs">
              Las tareas que se publiquen para este curso aparecerán aquí ordenadas por
              fecha de entrega.
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {tasks.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/tasks/${t.id}`}
                  className="group flex items-center gap-3 py-3 transition-colors hover:text-primary first:pt-0 last:pb-0"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ClipboardList className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                      {t.title}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        {t.due_date ? formatRelativeDate(t.due_date) : 'Sin fecha'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Target className="h-3 w-3" /> Máx. {t.max_score}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    Ver
                  </Badge>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
