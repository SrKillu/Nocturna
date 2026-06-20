import { BriefcaseBusiness } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { StaffV2WorkloadItem } from '@/lib/types/staff-v2';

export function V2StaffWorkloadPanel({
  workload,
}: {
  workload: readonly StaffV2WorkloadItem[];
}) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="staff-workload-title">
      <div className="border-b px-4 py-3">
        <h2 id="staff-workload-title" className="flex items-center gap-2 font-semibold">
          <BriefcaseBusiness className="h-4 w-4 text-primary" aria-hidden />
          Carga docente mock
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Distribución ilustrativa sin reasignaciones reales.
        </p>
      </div>
      <ul className="divide-y">
        {workload.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-medium">{item.areaLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.assignedPeople} personas · {item.assignedGroups} grupos mock
              </p>
            </div>
            <Badge variant="outline">{item.statusLabel}</Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
