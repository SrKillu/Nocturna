import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { V2EvaluationGradeBadge } from '@/components/v2/evaluations/v2-evaluation-grade-badge';
import {
  V2EvaluationStatusBadge,
  V2EvaluationTypeBadge,
} from '@/components/v2/evaluations/v2-evaluation-status-badge';
import type { EvaluationV2ListItem } from '@/lib/types/evaluations-v2';

export function V2EvaluationsTable({
  evaluations,
}: {
  evaluations: readonly EvaluationV2ListItem[];
}) {
  return (
    <div className="hidden overflow-hidden rounded-md border bg-card xl:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="px-4">Evaluación</TableHead>
            <TableHead>Curso / sección</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Fecha límite</TableHead>
            <TableHead>Entregas</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-center">Promedio</TableHead>
            <TableHead className="pr-4">Próxima acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {evaluations.map((evaluation) => (
            <TableRow key={evaluation.id}>
              <TableCell className="px-4 py-3 font-medium">{evaluation.title}</TableCell>
              <TableCell>
                <p>{evaluation.courseName}</p>
                <p className="text-xs text-muted-foreground">{evaluation.sectionLabel}</p>
              </TableCell>
              <TableCell>
                <V2EvaluationTypeBadge type={evaluation.type} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {evaluation.deadlineLabel}
              </TableCell>
              <TableCell>
                <p className="tabular-nums">
                  {evaluation.submittedCount}/{evaluation.expectedCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  {evaluation.pendingReviewCount} por revisar
                </p>
              </TableCell>
              <TableCell>
                <V2EvaluationStatusBadge status={evaluation.status} />
              </TableCell>
              <TableCell className="text-center">
                <V2EvaluationGradeBadge averageGrade={evaluation.averageGrade} />
              </TableCell>
              <TableCell className="pr-4 text-sm text-muted-foreground">
                {evaluation.nextAction}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
