import { ClipboardCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { CourseV2EvaluationPreview } from '@/lib/types/courses-v2';

interface V2CourseEvaluationsPreviewProps {
  evaluations: readonly CourseV2EvaluationPreview[];
}

export function V2CourseEvaluationsPreview({
  evaluations,
}: V2CourseEvaluationsPreviewProps) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="course-evaluations-title">
      <div className="border-b px-4 py-3">
        <h2 id="course-evaluations-title" className="flex items-center gap-2 font-semibold">
          <ClipboardCheck className="h-4 w-4 text-primary" aria-hidden />
          Evaluaciones
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Actividad académica reciente.</p>
      </div>
      <ul className="divide-y">
        {evaluations.map((evaluation) => (
          <li key={evaluation.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{evaluation.title}</p>
              <p className="truncate text-xs text-muted-foreground">{evaluation.detail}</p>
            </div>
            <Badge variant="outline" className="whitespace-nowrap text-muted-foreground">
              {evaluation.status === 'active' ? 'Disponible' : 'Borrador'}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
