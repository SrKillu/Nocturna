import { ClipboardCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  GuardianEvaluationV2,
  GuardianSpaceV2Tone,
} from '@/lib/types/guardian-space-v2';

interface V2GuardianEvaluationsPreviewProps {
  evaluations: readonly GuardianEvaluationV2[];
}

const toneStyles: Record<GuardianSpaceV2Tone, string> = {
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  info: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  neutral: 'border-border bg-muted text-muted-foreground',
};

export function V2GuardianEvaluationsPreview({
  evaluations,
}: V2GuardianEvaluationsPreviewProps) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="guardian-evaluations-title">
      <div className="border-b px-4 py-3">
        <h2 id="guardian-evaluations-title" className="flex items-center gap-2 font-semibold">
          <ClipboardCheck className="h-4 w-4 text-primary" aria-hidden />
          Evaluaciones
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Resultados recientes de demostración.
        </p>
      </div>
      <ul className="divide-y">
        {evaluations.map((evaluation) => (
          <li key={evaluation.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{evaluation.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {evaluation.studentName} · {evaluation.courseName}
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn('whitespace-nowrap', toneStyles[evaluation.tone])}
            >
              {evaluation.resultLabel}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
