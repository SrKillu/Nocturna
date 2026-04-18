import Link from 'next/link';
import { ArrowRight, CalendarClock, ClipboardList, CheckCircle2, Clock } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TaskPreview } from '@/lib/services/dashboard.service';
import type { UserRole } from '@/lib/types/database';
import { formatRelativeDate } from '@/lib/utils/date';

interface TasksCardProps {
  tasks: TaskPreview[];
  role: UserRole;
}

export function TasksCard({ tasks, role }: TasksCardProps) {
  const isStudent = role === 'student';
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">
            {isStudent ? 'Tareas pendientes' : 'Entregas por revisar'}
          </CardTitle>
          <CardDescription>
            {isStudent
              ? 'Prioriza según fecha de entrega.'
              : 'Entregas que esperan tu calificación.'}
          </CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-xs">
          <Link href={isStudent ? '/tasks' : '/submissions'} aria-label="Ver todo">
            Ver todas <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-1">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card px-4 py-8 text-center">
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ClipboardList className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-sm font-medium">Nada pendiente</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              {isStudent
                ? 'Cuando se te asignen tareas aparecerán aquí ordenadas por fecha.'
                : 'Las entregas que lleguen se mostrarán en esta lista.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <ClipboardList className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{task.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    {task.course_name ? <span className="truncate">{task.course_name}</span> : null}
                    {task.due_date ? (
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" aria-hidden />
                        {formatRelativeDate(task.due_date)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <TaskStatus task={task} isStudent={isStudent} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TaskStatus({ task, isStudent }: { task: TaskPreview; isStudent: boolean }) {
  if (isStudent) {
    const status = task.submission_status;
    if (status === 'graded') {
      return (
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="h-3 w-3" /> Calificada
        </Badge>
      );
    }
    if (status === 'submitted') {
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" /> Enviada
        </Badge>
      );
    }
    return <Badge variant="destructive">Pendiente</Badge>;
  }
  return (
    <Badge variant={task.submission_count ? 'default' : 'outline'}>
      {task.submission_count ?? 0} por revisar
    </Badge>
  );
}
