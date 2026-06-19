import { MessageSquareText } from 'lucide-react';

import { V2GuardianAlertsPreview } from '@/components/v2/guardian-space/v2-guardian-alerts-preview';
import { V2GuardianAttendancePreview } from '@/components/v2/guardian-space/v2-guardian-attendance-preview';
import { V2GuardianEmptyState } from '@/components/v2/guardian-space/v2-guardian-empty-state';
import { V2GuardianEvaluationsPreview } from '@/components/v2/guardian-space/v2-guardian-evaluations-preview';
import { V2GuardianNextActions } from '@/components/v2/guardian-space/v2-guardian-next-actions';
import { V2GuardianSpaceHeader } from '@/components/v2/guardian-space/v2-guardian-space-header';
import { V2GuardianStudentsOverview } from '@/components/v2/guardian-space/v2-guardian-students-overview';
import type { GuardianSpaceV2ViewModel } from '@/lib/types/guardian-space-v2';

interface V2GuardianSpacePageProps {
  guardianSpace: GuardianSpaceV2ViewModel | null;
}

export function V2GuardianSpacePage({
  guardianSpace,
}: V2GuardianSpacePageProps) {
  if (!guardianSpace || guardianSpace.students.length === 0) {
    return <V2GuardianEmptyState />;
  }

  return (
    <div className="space-y-5">
      <V2GuardianSpaceHeader guardianSpace={guardianSpace} />
      <V2GuardianStudentsOverview students={guardianSpace.students} />

      <div className="grid gap-5 lg:grid-cols-2">
        <V2GuardianAttendancePreview attendance={guardianSpace.attendance} />
        <V2GuardianEvaluationsPreview evaluations={guardianSpace.evaluations} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <V2GuardianAlertsPreview alerts={guardianSpace.alerts} />
        <V2GuardianNextActions actions={guardianSpace.nextActions} />
      </div>

      <section className="rounded-md border bg-card" aria-labelledby="guardian-communications-title">
        <div className="border-b px-4 py-3">
          <h2 id="guardian-communications-title" className="flex items-center gap-2 font-semibold">
            <MessageSquareText className="h-4 w-4 text-primary" aria-hidden />
            Comunicados
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Información académica reciente de demostración.
          </p>
        </div>
        <ul className="divide-y">
          {guardianSpace.communications.map((communication) => (
            <li key={communication.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{communication.title}</p>
                <span className="text-xs text-muted-foreground">
                  {communication.dateLabel}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {communication.detail}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
