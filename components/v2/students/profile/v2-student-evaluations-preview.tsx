import { ClipboardCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { StudentV2EvaluationPreview } from '@/lib/types/students-v2';

interface V2StudentEvaluationsPreviewProps {
  evaluations: readonly StudentV2EvaluationPreview[];
}

export function V2StudentEvaluationsPreview({
  evaluations,
}: V2StudentEvaluationsPreviewProps) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="student-evaluations-title">
      <div className="border-b px-4 py-3">
        <h2 id="student-evaluations-title" className="flex items-center gap-2 font-semibold">
          <ClipboardCheck className="h-4 w-4 text-primary" aria-hidden />
          Evaluaciones
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Resultados académicos simulados.</p>
      </div>
      <ul className="divide-y">
        {evaluations.map((evaluation) => (
          <li key={evaluation.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{evaluation.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {evaluation.courseName} · {evaluation.statusLabel}
              </p>
            </div>
            <Badge variant="outline" className="whitespace-nowrap text-muted-foreground">
              {evaluation.resultLabel}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
