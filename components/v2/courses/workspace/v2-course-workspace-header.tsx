import Link from 'next/link';
import { ArrowLeft, CalendarDays, MapPin, UserRound, UsersRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { V2CourseStatusBadge } from '@/components/v2/courses/v2-course-status-badge';
import type { CourseV2Workspace } from '@/lib/types/courses-v2';

interface V2CourseWorkspaceHeaderProps {
  course: CourseV2Workspace;
}

export function V2CourseWorkspaceHeader({ course }: V2CourseWorkspaceHeaderProps) {
  return (
    <header className="space-y-4">
      <Link
        href="/v2/courses"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a cursos
      </Link>

      <div className="rounded-md border bg-card">
        <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{course.name}</h1>
              <V2CourseStatusBadge status={course.status} />
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{course.code}</p>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{course.summary}</p>
          </div>
          <Badge variant="outline" className="w-fit whitespace-nowrap">
            Workspace C5
          </Badge>
        </div>

        <dl className="grid gap-3 p-5 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <UserRound className="h-3.5 w-3.5" aria-hidden />
              Docente
            </dt>
            <dd className="mt-1 font-medium">{course.teacherName}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <UsersRound className="h-3.5 w-3.5" aria-hidden />
              Estudiantes
            </dt>
            <dd className="mt-1 font-medium">{course.studentCount}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              Periodo
            </dt>
            <dd className="mt-1 font-medium">{course.termLabel}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              Ubicación
            </dt>
            <dd className="mt-1 font-medium">{course.roomLabel}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Próxima acción</dt>
            <dd className="mt-1 font-medium">{course.nextAction}</dd>
          </div>
        </dl>
      </div>
    </header>
  );
}
