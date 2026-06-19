import Link from 'next/link';
import { ArrowLeft, BookOpenCheck, CalendarDays, GraduationCap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  V2StudentRiskBadge,
  V2StudentStatusBadge,
} from '@/components/v2/students/v2-student-status-badge';
import type { StudentV2Profile } from '@/lib/types/students-v2';

interface V2StudentProfileHeaderProps {
  student: StudentV2Profile;
}

export function V2StudentProfileHeader({ student }: V2StudentProfileHeaderProps) {
  return (
    <header className="space-y-4">
      <Link
        href="/v2/students"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a estudiantes
      </Link>

      <div className="rounded-md border bg-card">
        <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{student.name}</h1>
              <V2StudentStatusBadge status={student.status} />
              <V2StudentRiskBadge risk={student.risk} />
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{student.code}</p>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              {student.summaryDetail}
            </p>
          </div>
          <Badge variant="outline" className="w-fit whitespace-nowrap">
            Perfil C7
          </Badge>
        </div>

        <dl className="grid gap-3 p-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <GraduationCap className="h-3.5 w-3.5" aria-hidden />
              Nivel y sección
            </dt>
            <dd className="mt-1 font-medium">
              {student.levelLabel} · {student.sectionLabel}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <BookOpenCheck className="h-3.5 w-3.5" aria-hidden />
              Curso principal
            </dt>
            <dd className="mt-1 font-medium">{student.courseName}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              Periodo
            </dt>
            <dd className="mt-1 font-medium">{student.periodLabel}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Resumen académico</dt>
            <dd className="mt-1 font-medium">{student.academicSummary}</dd>
          </div>
        </dl>
      </div>
    </header>
  );
}
