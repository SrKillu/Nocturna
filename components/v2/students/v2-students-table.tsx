import { BookOpenCheck, CalendarCheck } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { V2StudentEmptyState } from '@/components/v2/students/v2-student-empty-state';
import {
  V2StudentRiskBadge,
  V2StudentStatusBadge,
} from '@/components/v2/students/v2-student-status-badge';
import type { StudentV2ListItem } from '@/lib/types/students-v2';

interface V2StudentsTableProps {
  students: readonly StudentV2ListItem[];
  filtered: boolean;
}

export function V2StudentsTable({ students, filtered }: V2StudentsTableProps) {
  if (students.length === 0) {
    return (
      <div className="rounded-md border bg-card p-4">
        <V2StudentEmptyState filtered={filtered} />
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-md border bg-card" aria-label="Listado de estudiantes">
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="px-4">Estudiante</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Resumen académico</TableHead>
              <TableHead>Seguimiento</TableHead>
              <TableHead className="pr-4">Próxima acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="px-4 py-3">
                  <p className="font-medium">{student.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {student.code}
                  </p>
                </TableCell>
                <TableCell>
                  <p>{student.courseName}</p>
                  <p className="text-xs text-muted-foreground">{student.sectionLabel}</p>
                </TableCell>
                <TableCell>{student.levelLabel}</TableCell>
                <TableCell>
                  <V2StudentStatusBadge status={student.status} />
                </TableCell>
                <TableCell>
                  <p className="text-sm">{student.academicSummary}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Asistencia {student.attendancePercent}%
                  </p>
                </TableCell>
                <TableCell>
                  <V2StudentRiskBadge risk={student.risk} />
                </TableCell>
                <TableCell className="pr-4 text-sm text-muted-foreground">
                  {student.nextAction}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y lg:hidden">
        {students.map((student) => (
          <li key={student.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{student.name}</p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">{student.code}</p>
              </div>
              <V2StudentStatusBadge status={student.status} />
            </div>

            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex min-w-0 items-start gap-2">
                <BookOpenCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate">{student.courseName}</p>
                  <p className="text-xs text-muted-foreground">
                    {student.sectionLabel} · {student.levelLabel}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <p>{student.academicSummary}</p>
                  <p className="text-xs text-muted-foreground">
                    Asistencia {student.attendancePercent}%
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <V2StudentRiskBadge risk={student.risk} />
              <p className="text-xs font-medium text-muted-foreground">{student.nextAction}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
