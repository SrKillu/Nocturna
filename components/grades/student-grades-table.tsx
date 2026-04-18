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
import { formatRelativeDate } from '@/lib/utils/date';

/**
 * Read-only view used by students. Shows their own submissions with the
 * grade (if any) and the teacher feedback, newest first.
 */
export function StudentGradesTable({ items }: { items: GradeListItem[] }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tarea</TableHead>
            <TableHead className="hidden md:table-cell">Curso</TableHead>
            <TableHead className="hidden md:table-cell">Entregada</TableHead>
            <TableHead className="text-right">Nota</TableHead>
            <TableHead className="hidden lg:table-cell">Feedback</TableHead>
            <TableHead aria-label="Estado" />
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
              <TableCell className="hidden md:table-cell text-muted-foreground">
                {formatRelativeDate(it.submitted_at)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {it.score !== null ? (
                  <span className="font-medium">
                    {it.score} <span className="text-muted-foreground">/ {it.max_score}</span>
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Sin nota</span>
                )}
              </TableCell>
              <TableCell className="hidden lg:table-cell max-w-md">
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {it.feedback ?? '—'}
                </p>
              </TableCell>
              <TableCell>
                {it.status === 'graded' ? (
                  <Badge variant="secondary">Calificada</Badge>
                ) : it.status === 'late' ? (
                  <Badge variant="destructive">Tarde</Badge>
                ) : (
                  <Badge variant="outline">Enviada</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
