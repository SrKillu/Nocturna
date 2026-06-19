import { BookOpenCheck, CalendarDays } from 'lucide-react';

import {
  V2AttendanceAlertBadge,
  V2AttendanceStatusBadge,
} from '@/components/v2/attendance/v2-attendance-status-badge';
import type { AttendanceV2Record } from '@/lib/types/attendance-v2';

export function V2AttendanceMobileList({
  records,
}: {
  records: readonly AttendanceV2Record[];
}) {
  return (
    <ul className="divide-y overflow-hidden rounded-md border bg-card lg:hidden">
      {records.map((record) => (
        <li key={record.id} className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{record.studentName}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {record.studentCode}
              </p>
            </div>
            <V2AttendanceStatusBadge status={record.status} />
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex min-w-0 items-start gap-2">
              <BookOpenCheck
                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <div className="min-w-0">
                <p className="truncate">{record.courseName}</p>
                <p className="text-xs text-muted-foreground">{record.sectionLabel}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarDays
                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <div>
                <p>{record.lastSessionLabel}</p>
                <p className="text-xs text-muted-foreground">
                  Promedio {record.attendancePercent}%
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <V2AttendanceAlertBadge alert={record.alert} />
            <p className="text-xs font-medium text-muted-foreground">
              {record.nextAction}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
