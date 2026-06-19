import { UsersRound } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { V2CourseEmptyState } from '@/components/v2/courses/v2-course-empty-state';
import { V2CourseStatusBadge } from '@/components/v2/courses/v2-course-status-badge';
import type { CourseV2ListItem } from '@/lib/types/courses-v2';

interface V2CoursesTableProps {
  courses: readonly CourseV2ListItem[];
  filtered: boolean;
}

export function V2CoursesTable({ courses, filtered }: V2CoursesTableProps) {
  if (courses.length === 0) {
    return (
      <div className="rounded-md border bg-card p-4">
        <V2CourseEmptyState filtered={filtered} />
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-md border bg-card" aria-label="Listado de cursos">
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="px-4">Curso</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Docente</TableHead>
              <TableHead className="text-right">Estudiantes</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="pr-4">Próxima acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="px-4 py-3">
                  <p className="font-medium">{course.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {course.levelLabel} · {course.scheduleLabel} · {course.categoryLabel}
                  </p>
                </TableCell>
                <TableCell className="font-mono text-xs">{course.code}</TableCell>
                <TableCell>{course.teacherName}</TableCell>
                <TableCell className="text-right tabular-nums">{course.studentCount}</TableCell>
                <TableCell>
                  <V2CourseStatusBadge status={course.status} />
                </TableCell>
                <TableCell className="pr-4 text-sm text-muted-foreground">
                  {course.nextAction}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y md:hidden">
        {courses.map((course) => (
          <li key={course.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{course.name}</p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">{course.code}</p>
              </div>
              <V2CourseStatusBadge status={course.status} />
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Docente</p>
                <p className="truncate">{course.teacherName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Grupo</p>
                <p>{course.levelLabel} · {course.scheduleLabel}</p>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <UsersRound className="h-4 w-4" aria-hidden />
                <span>{course.studentCount} estudiantes</span>
              </div>
              <p className="text-right text-xs font-medium text-muted-foreground">
                {course.nextAction}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
