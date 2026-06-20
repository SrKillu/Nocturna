import {
  V2StaffStatusBadge,
  V2StaffWorkloadBadge,
} from '@/components/v2/staff/v2-staff-status-badge';
import { V2StaffRoleBadge } from '@/components/v2/staff/v2-staff-role-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { StaffV2ListItem } from '@/lib/types/staff-v2';

export function V2StaffTable({ staff }: { staff: readonly StaffV2ListItem[] }) {
  return (
    <div className="hidden overflow-hidden rounded-md border bg-card lg:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="px-4">Persona</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Área</TableHead>
            <TableHead>Asignación mock</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Carga</TableHead>
            <TableHead className="pr-4">Próxima acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.map((person) => (
            <TableRow key={person.id}>
              <TableCell className="px-4 py-3">
                <p className="font-medium">{person.displayName}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {person.staffCode}
                </p>
              </TableCell>
              <TableCell>
                <V2StaffRoleBadge role={person.role} />
              </TableCell>
              <TableCell>{person.areaLabel}</TableCell>
              <TableCell>{person.assignmentLabel}</TableCell>
              <TableCell>
                <V2StaffStatusBadge status={person.status} />
              </TableCell>
              <TableCell>
                <V2StaffWorkloadBadge workload={person.workload} />
                <p className="mt-1 text-xs text-muted-foreground">
                  {person.workloadLabel}
                </p>
              </TableCell>
              <TableCell className="pr-4 text-sm text-muted-foreground">
                {person.nextAction}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
