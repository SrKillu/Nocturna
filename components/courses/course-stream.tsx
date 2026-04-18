import {
  Activity,
  BookOpenCheck,
  ClipboardList,
  FileUp,
  type LucideIcon,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { CourseActivityItem } from '@/lib/services/courses.service';
import { formatRelativeDate } from '@/lib/utils/date';

interface CourseStreamProps {
  items: CourseActivityItem[];
}

/**
 * Google Classroom “Stream” equivalent. A mixed feed of the three events
 * that matter most inside a course: new tasks, incoming submissions, posted
 * grades. One visual element per event type keeps the scan cost low.
 */
export function CourseStream({ items }: CourseStreamProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Activity className="h-5 w-5" />
          </span>
          <p className="font-medium text-foreground">Aún no hay actividad</p>
          <p className="max-w-xs">
            Cuando se publiquen tareas, lleguen entregas o se califique, verás aquí una
            línea de tiempo del curso.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Novedades</CardTitle>
        <CardDescription>Actividad reciente del curso.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-5 border-l border-border/70 pl-6">
          {items.map((it) => {
            const { Icon, tint } = describe(it.kind);
            return (
              <li key={it.id} className="relative">
                <span
                  aria-hidden
                  className={`absolute -left-[33px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background ${tint}`}
                >
                  <Icon className="h-3 w-3" />
                </span>
                <p className="text-sm font-medium leading-tight">{it.title}</p>
                {it.subtitle ? (
                  <p className="text-xs text-muted-foreground">{it.subtitle}</p>
                ) : null}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatRelativeDate(it.at)}
                </p>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

function describe(kind: CourseActivityItem['kind']): { Icon: LucideIcon; tint: string } {
  switch (kind) {
    case 'task_created':
      return { Icon: ClipboardList, tint: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300' };
    case 'submission':
      return { Icon: FileUp, tint: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300' };
    case 'grade':
      return { Icon: BookOpenCheck, tint: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' };
    default:
      return { Icon: Activity, tint: 'bg-muted text-muted-foreground' };
  }
}
