import { ShieldAlert } from 'lucide-react';

import { V2GradebookGradeBadge } from '@/components/v2/gradebook/v2-gradebook-grade-badge';
import type { GradebookV2Record } from '@/lib/types/gradebook-v2';

export function V2GradebookRiskPanel({
  records,
}: {
  records: readonly GradebookV2Record[];
}) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="gradebook-risk-title">
      <div className="border-b px-4 py-3">
        <h2 id="gradebook-risk-title" className="flex items-center gap-2 font-semibold">
          <ShieldAlert className="h-4 w-4 text-primary" aria-hidden />
          Seguimiento prioritario
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Señales mock para revisión académica.
        </p>
      </div>
      {records.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">
          No hay señales de riesgo en la vista actual.
        </p>
      ) : (
        <ul className="divide-y">
          {records.map((record) => (
            <li key={record.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{record.studentName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {record.courseName} · {record.nextAction}
                </p>
              </div>
              <V2GradebookGradeBadge grade={record.averageGrade} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
