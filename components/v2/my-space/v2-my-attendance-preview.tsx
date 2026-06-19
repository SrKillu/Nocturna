import { CalendarCheck, CalendarClock, CalendarX2 } from 'lucide-react';

import type { MySpaceV2Attendance } from '@/lib/types/my-space-v2';

interface V2MyAttendancePreviewProps {
  attendance: MySpaceV2Attendance;
}

export function V2MyAttendancePreview({ attendance }: V2MyAttendancePreviewProps) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="my-attendance-title">
      <div className="border-b px-4 py-3">
        <h2 id="my-attendance-title" className="font-semibold">
          Mi asistencia
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{attendance.trendLabel}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        <div className="rounded-md border bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">Porcentaje</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{attendance.percent}%</p>
        </div>
        <div className="rounded-md border bg-muted/20 p-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarCheck className="h-3.5 w-3.5" aria-hidden />
            Presente
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{attendance.presentCount}</p>
        </div>
        <div className="rounded-md border bg-muted/20 p-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" aria-hidden />
            Tardías
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{attendance.lateCount}</p>
        </div>
        <div className="rounded-md border bg-muted/20 p-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarX2 className="h-3.5 w-3.5" aria-hidden />
            Ausencias
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{attendance.absentCount}</p>
        </div>
      </div>
    </section>
  );
}
