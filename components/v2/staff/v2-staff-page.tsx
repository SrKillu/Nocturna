'use client';

import { useMemo, useState } from 'react';
import { Info } from 'lucide-react';

import { V2StaffEmptyState } from '@/components/v2/staff/v2-staff-empty-state';
import { V2StaffFilters } from '@/components/v2/staff/v2-staff-filters';
import { V2StaffHeader } from '@/components/v2/staff/v2-staff-header';
import { V2StaffInvitationsPanel } from '@/components/v2/staff/v2-staff-invitations-panel';
import { V2StaffMobileList } from '@/components/v2/staff/v2-staff-mobile-list';
import { V2StaffSummary } from '@/components/v2/staff/v2-staff-summary';
import { V2StaffTable } from '@/components/v2/staff/v2-staff-table';
import { V2StaffWorkloadPanel } from '@/components/v2/staff/v2-staff-workload-panel';
import {
  filterStaffV2,
  type StaffV2FilterState,
  type StaffV2Fixture,
} from '@/lib/types/staff-v2';

const initialFilters: StaffV2FilterState = {
  query: '',
  role: 'all',
  status: 'all',
  area: 'all',
  assignmentId: 'all',
};

export function V2StaffPage({ staff }: { staff: StaffV2Fixture }) {
  const [filters, setFilters] = useState(initialFilters);
  const filtered = useMemo(
    () => filterStaffV2(staff.staff, filters),
    [staff.staff, filters]
  );
  const assignmentOptions = useMemo(() => {
    const values = new Map<string, string>();
    staff.staff.forEach((person) =>
      values.set(person.assignmentId, person.assignmentLabel)
    );
    return Array.from(values, ([assignmentId, assignmentLabel]) => ({
      assignmentId,
      assignmentLabel,
    }));
  }, [staff.staff]);
  const hasFilters = Object.entries(filters).some(
    ([key, value]) => value !== initialFilters[key as keyof StaffV2FilterState]
  );

  return (
    <div className="space-y-5">
      <V2StaffHeader />
      <V2StaffSummary summary={staff.summary} />
      <V2StaffFilters
        filters={filters}
        assignmentOptions={assignmentOptions}
        onChange={setFilters}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">{filtered.length}</span>{' '}
          {filtered.length === 1 ? 'persona visible' : 'personas visibles'}
        </p>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-4 w-4" aria-hidden />
          {staff.disclaimer}
        </span>
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-md border bg-card p-4">
          <V2StaffEmptyState filtered={hasFilters} />
        </div>
      ) : (
        <>
          <V2StaffTable staff={filtered} />
          <V2StaffMobileList staff={filtered} />
        </>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        <V2StaffWorkloadPanel workload={staff.workload} />
        <V2StaffInvitationsPanel invitations={staff.invitations} />
      </div>
    </div>
  );
}
