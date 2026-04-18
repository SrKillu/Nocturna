import { CalendarClock, FileText, User2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatRelativeDate } from '@/lib/utils/date';
import type { SubmissionListItem } from '@/lib/services/submissions.service';
import type { UserRole, SubmissionStatus } from '@/lib/types/database';

interface SubmissionRowProps {
  item: SubmissionListItem;
  role: UserRole;
}

export function SubmissionRow({ item, role }: SubmissionRowProps) {
  return (
    <div className="flex items-start gap-3 px-4 py-4 sm:px-6">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <FileText className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {item.task_title ?? 'Tarea'}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {item.course_name ? <span className="truncate">{item.course_name}</span> : null}
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3 w-3" aria-hidden />
            {formatRelativeDate(item.submitted_at)}
          </span>
          {role !== 'student' && item.student_name ? (
            <span className="inline-flex items-center gap-1">
              <User2 className="h-3 w-3" aria-hidden />
              <span className="truncate">{item.student_name ?? item.student_email}</span>
            </span>
          ) : null}
          {item.file_path ? (
            <span className="truncate">Archivo adjunto</span>
          ) : (
            <span className="text-muted-foreground/80">Sin archivo</span>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <StatusBadge status={item.status} />
        {item.grade_score !== null && item.grade_max !== null ? (
          <p className="mt-1 text-xs tabular-nums text-muted-foreground">
            {item.grade_score} / {item.grade_max}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
  if (status === 'graded') return <Badge variant="secondary">Calificada</Badge>;
  if (status === 'submitted') return <Badge variant="outline">Enviada</Badge>;
  if (status === 'late') return <Badge variant="destructive">Tarde</Badge>;
  if (status === 'returned') return <Badge>Devuelta</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}
