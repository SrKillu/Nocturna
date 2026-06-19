import { ListChecks, ShieldAlert } from 'lucide-react';

import { V2StudentRiskBadge } from '@/components/v2/students/v2-student-status-badge';
import type { StudentV2Profile } from '@/lib/types/students-v2';

interface V2StudentRiskSummaryProps {
  student: StudentV2Profile;
}

export function V2StudentRiskSummary({ student }: V2StudentRiskSummaryProps) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="student-risk-title">
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3 sm:px-5">
        <div>
          <h2 id="student-risk-title" className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-4 w-4 text-primary" aria-hidden />
            Seguimiento
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Prioridad y próximas acciones de demostración.
          </p>
        </div>
        <V2StudentRiskBadge risk={student.risk} />
      </div>
      <ul className="divide-y">
        {student.nextActions.map((action) => (
          <li key={action} className="flex items-start gap-2 px-4 py-3 text-sm sm:px-5">
            <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <span>{action}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
