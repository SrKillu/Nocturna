import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  V2AttendanceAlertBadge,
  V2AttendanceStatusBadge,
} from '@/components/v2/attendance/v2-attendance-status-badge';
import type { AttendanceV2Record } from '@/lib/types/attendance-v2';

export function V2AttendanceTable({
  records,
}: {
  records: readonly AttendanceV2Record[];
}) {
  return (
    <div className="hidden overflow-hidden rounded-md border bg-card lg:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="px-4">Estudiante</TableHead>
            <TableHead>Curso / sección</TableHead>
            <TableHead>Última sesión</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Asistencia</TableHead>
            <TableHead>Seguimiento</TableHead>
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
              <TableCell className="text-sm text-muted-foreground">
                {record.lastSessionLabel}
              </TableCell>
              <TableCell>
                <V2AttendanceStatusBadge status={record.status} />
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {record.attendancePercent}%
              </TableCell>
              <TableCell>
                <V2AttendanceAlertBadge alert={record.alert} />
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
