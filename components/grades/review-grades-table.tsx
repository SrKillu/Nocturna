'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { GradeListItem } from '@/lib/services/grades.service';
import { GradeCell } from './grade-cell';

/**
 * Teacher/Admin view — editable score + feedback per row.
 * The cell-level component owns its own submit state so each row is
 * independent and the whole table does not re-render on every save.
 */
export function ReviewGradesTable({ items }: { items: GradeListItem[] }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tarea</TableHead>
            <TableHead className="hidden md:table-cell">Curso</TableHead>
            <TableHead className="hidden lg:table-cell">Estudiante</TableHead>
            <TableHead className="hidden md:table-cell">Enviada</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="min-w-[280px]">Nota / Feedback</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((it) => (
            <TableRow key={it.submission_id} className="align-top">
              <TableCell>
                <Link
                  href={`/tasks/${it.task_id}`}
                  className="font-medium hover:underline"
                >
                  {it.task_title}
                </Link>
                <p className="text-xs text-muted-foreground md:hidden">{it.course_name}</p>
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">
                {it.course_name}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <p className="text-sm">{it.student_name ?? '—'}</p>
                <p className="text-xs text-muted-foreground">{it.student_email ?? ''}</p>
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">
                {new Date(it.submitted_at).toLocaleDateString('es')}
              </TableCell>
              <TableCell>
                {it.status === 'graded' ? (
                  <Badge variant="secondary">Calificada</Badge>
                ) : it.status === 'late' ? (
                  <Badge variant="destructive">Tarde</Badge>
                ) : (
                  <Badge variant="outline">Pendiente</Badge>
                )}
              </TableCell>
              <TableCell>
                <GradeCell
                  submissionId={it.submission_id}
                  maxScore={it.max_score}
                  initialScore={it.score}
                  initialFeedback={it.feedback}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
