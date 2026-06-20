import { BookOpenCheck, CalendarClock, FileCheck2 } from 'lucide-react';

import { V2EvaluationGradeBadge } from '@/components/v2/evaluations/v2-evaluation-grade-badge';
import {
  V2EvaluationStatusBadge,
  V2EvaluationTypeBadge,
} from '@/components/v2/evaluations/v2-evaluation-status-badge';
import type { EvaluationV2ListItem } from '@/lib/types/evaluations-v2';

export function V2EvaluationsMobileList({
  evaluations,
}: {
  evaluations: readonly EvaluationV2ListItem[];
}) {
  return (
    <ul className="divide-y overflow-hidden rounded-md border bg-card xl:hidden">
      {evaluations.map((evaluation) => (
        <li key={evaluation.id} className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">{evaluation.title}</p>
              <div className="mt-1">
                <V2EvaluationTypeBadge type={evaluation.type} />
              </div>
            </div>
            <V2EvaluationStatusBadge status={evaluation.status} />
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex min-w-0 items-start gap-2">
              <BookOpenCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                <p className="truncate">{evaluation.courseName}</p>
                <p className="text-xs text-muted-foreground">{evaluation.sectionLabel}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <p>{evaluation.deadlineLabel}</p>
            </div>
            <div className="flex items-start gap-2">
              <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <p>
                {evaluation.submittedCount}/{evaluation.expectedCount} entregas ·{' '}
                {evaluation.pendingReviewCount} por revisar
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <span className="text-xs text-muted-foreground">Promedio</span>
              <V2EvaluationGradeBadge averageGrade={evaluation.averageGrade} />
            </div>
          </div>
          <p className="text-right text-xs font-medium text-muted-foreground">
            {evaluation.nextAction}
          </p>
        </li>
      ))}
    </ul>
  );
}
