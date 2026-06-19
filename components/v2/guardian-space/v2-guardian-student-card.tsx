import { BellRing, CalendarCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { GuardianStudentV2 } from '@/lib/types/guardian-space-v2';

interface V2GuardianStudentCardProps {
  student: GuardianStudentV2;
}

export function V2GuardianStudentCard({ student }: V2GuardianStudentCardProps) {
  return (
    <li className="rounded-md border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{student.name}</p>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {student.code}
          </p>
        </div>
        <Badge variant="outline" className="whitespace-nowrap">
          {student.levelLabel} · {student.sectionLabel}
        </Badge>
      </div>
      <p className="mt-4 text-sm font-medium">{student.academicStatus}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarCheck className="h-4 w-4" aria-hidden />
          Asistencia {student.attendancePercent}%
        </span>
        <span className="flex items-center gap-1.5">
          <BellRing className="h-4 w-4" aria-hidden />
          {student.alertCount === 0
            ? 'Sin alertas'
            : `${student.alertCount} alertas`}
        </span>
      </div>
    </li>
  );
}
