import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { V2GradebookGradeBadge } from '@/components/v2/gradebook/v2-gradebook-grade-badge';
import {
  V2GradebookStatusBadge,
  V2GradebookTrendBadge,
} from '@/components/v2/gradebook/v2-gradebook-status-badge';
import type { GradebookV2Record } from '@/lib/types/gradebook-v2';

export function V2GradebookTable({
  records,
}: {
  records: readonly GradebookV2Record[];
}) {
  return (
    <div className="hidden overflow-hidden rounded-md border bg-card xl:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="px-4">Estudiante</TableHead>
            <TableHead>Curso / sección</TableHead>
            <TableHead className="text-center">Promedio mock</TableHead>
            <TableHead>Última evaluación</TableHead>
            <TableHead className="text-center">Pendientes</TableHead>
            <TableHead>Estado académico</TableHead>
            <TableHead>Tendencia</TableHead>
            <TableHead className="pr-4">Próxima acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="px-4 py-3">
                <p className="font-medium">{record.studentName}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {record.studentCode}
                </p>
              </TableCell>
              <TableCell>
                <p>{record.courseName}</p>
                <p className="text-xs text-muted-foreground">{record.sectionLabel}</p>
              </TableCell>
              <TableCell className="text-center">
                <V2GradebookGradeBadge grade={record.averageGrade} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {record.lastEvaluationLabel}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {record.pendingEvaluations}
              </TableCell>
              <TableCell>
                <V2GradebookStatusBadge status={record.status} />
              </TableCell>
              <TableCell>
                <V2GradebookTrendBadge trend={record.trend} />
                <p className="mt-1 text-xs text-muted-foreground">{record.trendLabel}</p>
              </TableCell>
              <TableCell className="pr-4 text-sm text-muted-foreground">
                {record.nextAction}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
