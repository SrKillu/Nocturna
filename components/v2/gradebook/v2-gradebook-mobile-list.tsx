import { BookOpenCheck, ClipboardCheck } from 'lucide-react';

import { V2GradebookGradeBadge } from '@/components/v2/gradebook/v2-gradebook-grade-badge';
import {
  V2GradebookStatusBadge,
  V2GradebookTrendBadge,
} from '@/components/v2/gradebook/v2-gradebook-status-badge';
import type { GradebookV2Record } from '@/lib/types/gradebook-v2';

export function V2GradebookMobileList({
  records,
}: {
  records: readonly GradebookV2Record[];
}) {
  return (
    <ul className="divide-y overflow-hidden rounded-md border bg-card xl:hidden">
      {records.map((record) => (
        <li key={record.id} className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{record.studentName}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {record.studentCode}
              </p>
            </div>
            <V2GradebookGradeBadge grade={record.averageGrade} />
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex min-w-0 items-start gap-2">
              <BookOpenCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                <p className="truncate">{record.courseName}</p>
                <p className="text-xs text-muted-foreground">{record.sectionLabel}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <p>{record.lastEvaluationLabel}</p>
                <p className="text-xs text-muted-foreground">
                  {record.pendingEvaluations} pendientes
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <V2GradebookStatusBadge status={record.status} />
            <V2GradebookTrendBadge trend={record.trend} />
            <span className="ml-auto text-xs text-muted-foreground">
              {record.nextAction}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
