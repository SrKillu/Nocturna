import { CalendarClock, ClipboardList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatRelativeDate } from '@/lib/utils/date';
import type { TaskListItem } from '@/lib/services/tasks.service';
import type { UserRole } from '@/lib/types/database';

interface TaskListRowProps {
  task: TaskListItem;
  role: UserRole;
}

export function TaskListRow({ task, role }: TaskListRowProps) {
  const isStudent = role === 'student';
  return (
    <div className="flex items-start gap-3 px-4 py-4 sm:px-6">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <ClipboardList className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{task.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {task.course_name ? <span className="truncate">{task.course_name}</span> : null}
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3 w-3" aria-hidden />
            {task.due_date ? formatRelativeDate(task.due_date) : 'Sin fecha'}
          </span>
          <span>Máx. {task.max_score}</span>
        </div>
      </div>
      <div className="shrink-0">
        {isStudent ? (
          <StudentStatus status={task.own_submission_status} />
        ) : (
          <Badge variant={task.submission_count > 0 ? 'default' : 'outline'}>
            {task.submission_count} por revisar
          </Badge>
        )}
      </div>
    </div>
  );
}

function StudentStatus({ status }: { status: TaskListItem['own_submission_status'] }) {
  if (status === 'graded') return <Badge variant="secondary">Calificada</Badge>;
  if (status === 'submitted') return <Badge variant="outline">Enviada</Badge>;
  if (status === 'late') return <Badge variant="destructive">Tarde</Badge>;
  return <Badge variant="destructive">Pendiente</Badge>;
}
