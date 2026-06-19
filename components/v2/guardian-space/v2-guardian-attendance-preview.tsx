import { CalendarCheck } from 'lucide-react';

import type { GuardianAttendanceV2 } from '@/lib/types/guardian-space-v2';

interface V2GuardianAttendancePreviewProps {
  attendance: readonly GuardianAttendanceV2[];
}

export function V2GuardianAttendancePreview({
  attendance,
}: V2GuardianAttendancePreviewProps) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="guardian-attendance-title">
      <div className="border-b px-4 py-3">
        <h2 id="guardian-attendance-title" className="flex items-center gap-2 font-semibold">
          <CalendarCheck className="h-4 w-4 text-primary" aria-hidden />
          Asistencia
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Resumen del período por estudiante.
        </p>
      </div>
      <ul className="divide-y">
        {attendance.map((item) => (
          <li key={item.studentId} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.studentName}</p>
              <p className="truncate text-xs text-muted-foreground">{item.trendLabel}</p>
            </div>
            <span className="text-lg font-semibold tabular-nums">{item.percent}%</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
