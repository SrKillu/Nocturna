import { CalendarClock } from 'lucide-react';

import { V2EvaluationStatusBadge } from '@/components/v2/evaluations/v2-evaluation-status-badge';
import type { EvaluationV2ListItem } from '@/lib/types/evaluations-v2';

export function V2EvaluationDeadlinesPanel({
  deadlines,
}: {
  deadlines: readonly EvaluationV2ListItem[];
}) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="evaluation-deadlines-title">
      <div className="border-b px-4 py-3">
        <h2 id="evaluation-deadlines-title" className="flex items-center gap-2 font-semibold">
          <CalendarClock className="h-4 w-4 text-primary" aria-hidden />
          Próximas fechas límite
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Agenda académica de demostración.
        </p>
      </div>
      <ul className="divide-y">
        {deadlines.map((evaluation) => (
          <li key={evaluation.id} className="space-y-2 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{evaluation.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {evaluation.courseName} · {evaluation.sectionLabel}
                </p>
              </div>
              <V2EvaluationStatusBadge status={evaluation.status} />
            </div>
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>{evaluation.deadlineLabel}</span>
              <span>{evaluation.expectedCount - evaluation.submittedCount} pendientes</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
