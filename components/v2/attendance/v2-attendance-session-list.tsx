import { CalendarClock, CheckCircle2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { AttendanceV2Session } from '@/lib/types/attendance-v2';

export function V2AttendanceSessionList({
  sessions,
}: {
  sessions: readonly AttendanceV2Session[];
}) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="attendance-sessions-title">
      <div className="border-b px-4 py-3">
        <h2 id="attendance-sessions-title" className="font-semibold">
          Sesiones recientes
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Registro operativo de demostración.
        </p>
      </div>
      <ul className="divide-y">
        {sessions.map((session) => {
          const Icon = session.status === 'recorded' ? CheckCircle2 : CalendarClock;
          return (
            <li key={session.id} className="space-y-2 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{session.courseName}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.sectionLabel} · {session.dateLabel}
                    </p>
                  </div>
                </div>
                <Badge variant={session.status === 'recorded' ? 'secondary' : 'outline'}>
                  {session.status === 'recorded' ? 'Registrada' : 'Pendiente'}
                </Badge>
              </div>
              <p className="pl-6 text-xs text-muted-foreground">
                {session.status === 'recorded'
                  ? `${session.presentCount} de ${session.expectedCount} presentes`
                  : `${session.expectedCount} estudiantes esperados`}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
