'use client';

import { useMemo, useState } from 'react';
import { CalendarCheck } from 'lucide-react';

import { V2AttendanceEmptyState } from '@/components/v2/attendance/v2-attendance-empty-state';
import { V2AttendanceFilters } from '@/components/v2/attendance/v2-attendance-filters';
import { V2AttendanceHeader } from '@/components/v2/attendance/v2-attendance-header';
import { V2AttendanceMobileList } from '@/components/v2/attendance/v2-attendance-mobile-list';
import { V2AttendanceSessionList } from '@/components/v2/attendance/v2-attendance-session-list';
import { V2AttendanceSummary } from '@/components/v2/attendance/v2-attendance-summary';
import { V2AttendanceTable } from '@/components/v2/attendance/v2-attendance-table';
import {
  filterAttendanceV2,
  type AttendanceV2FilterState,
  type AttendanceV2Fixture,
} from '@/lib/types/attendance-v2';

const initialFilters: AttendanceV2FilterState = {
  query: '',
  courseId: 'all',
  section: 'all',
  period: 'all',
  status: 'all',
};

export function V2AttendancePage({
  attendance,
}: {
  attendance: AttendanceV2Fixture;
}) {
  const [filters, setFilters] = useState<AttendanceV2FilterState>(initialFilters);
  const filteredRecords = useMemo(
    () => filterAttendanceV2(attendance.records, filters),
    [attendance.records, filters]
  );
  const courseOptions = useMemo(() => {
    const courses = new Map<string, string>();
    attendance.records.forEach((record) =>
      courses.set(record.courseId, record.courseName)
    );
    return Array.from(courses, ([courseId, courseName]) => ({
      courseId,
      courseName,
    }));
  }, [attendance.records]);
  const sectionOptions = useMemo(
    () => Array.from(new Set(attendance.records.map((record) => record.sectionLabel))),
    [attendance.records]
  );
  const hasFilters = Object.entries(filters).some(
    ([key, value]) => value !== initialFilters[key as keyof AttendanceV2FilterState]
  );

  return (
    <div className="space-y-5">
      <V2AttendanceHeader />
      <V2AttendanceSummary summary={attendance.summary} />
      <V2AttendanceFilters
        filters={filters}
        courseOptions={courseOptions}
        sectionOptions={sectionOptions}
        onChange={setFilters}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">{filteredRecords.length}</span>{' '}
          {filteredRecords.length === 1 ? 'registro visible' : 'registros visibles'}
        </p>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarCheck className="h-4 w-4" aria-hidden />
          Datos académicos de demostración
        </span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.55fr)]">
        <div>
          {filteredRecords.length === 0 ? (
            <div className="rounded-md border bg-card p-4">
              <V2AttendanceEmptyState filtered={hasFilters} />
            </div>
          ) : (
            <>
              <V2AttendanceTable records={filteredRecords} />
              <V2AttendanceMobileList records={filteredRecords} />
            </>
          )}
        </div>
        {attendance.sessions.length === 0 ? (
          <div className="rounded-md border bg-card p-4">
            <V2AttendanceEmptyState filtered={false} />
          </div>
        ) : (
          <V2AttendanceSessionList sessions={attendance.sessions} />
        )}
      </div>
    </div>
  );
}
