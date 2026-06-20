import { BookOpenCheck, BriefcaseBusiness } from 'lucide-react';

import { V2StaffRoleBadge } from '@/components/v2/staff/v2-staff-role-badge';
import {
  V2StaffStatusBadge,
  V2StaffWorkloadBadge,
} from '@/components/v2/staff/v2-staff-status-badge';
import type { StaffV2ListItem } from '@/lib/types/staff-v2';

export function V2StaffMobileList({
  staff,
}: {
  staff: readonly StaffV2ListItem[];
}) {
  return (
    <ul className="divide-y overflow-hidden rounded-md border bg-card lg:hidden">
      {staff.map((person) => (
        <li key={person.id} className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{person.displayName}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {person.staffCode}
              </p>
            </div>
            <V2StaffStatusBadge status={person.status} />
          </div>
          <div className="flex flex-wrap gap-2">
            <V2StaffRoleBadge role={person.role} />
            <V2StaffWorkloadBadge workload={person.workload} />
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <BriefcaseBusiness
                className="h-4 w-4 text-muted-foreground"
                aria-hidden
              />
              {person.areaLabel}
            </p>
            <p className="flex items-center gap-2">
              <BookOpenCheck
                className="h-4 w-4 text-muted-foreground"
                aria-hidden
              />
              {person.assignmentLabel}
            </p>
          </div>
          <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
            <span>{person.workloadLabel}</span>
            <span>{person.nextAction}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
