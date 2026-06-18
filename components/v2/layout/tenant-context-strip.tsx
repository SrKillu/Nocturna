import { Building2, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { ActiveMembershipContext, MembershipSummary } from '@/lib/types/auth';

interface TenantContextStripProps {
  activeMembership: ActiveMembershipContext;
  membership: MembershipSummary;
}

const roleLabels: Record<ActiveMembershipContext['roleKey'], string> = {
  owner: 'Owner',
  admin: 'Administrador',
  teacher: 'Docente',
  assistant: 'Asistente',
  student: 'Estudiante',
  guardian: 'Encargado',
  support: 'Soporte',
};

export function TenantContextStrip({
  activeMembership,
  membership,
}: TenantContextStripProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-md border bg-muted/25 px-4 py-3 text-sm">
      <span className="flex min-w-0 items-center gap-2 font-medium">
        <Building2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span className="truncate">{membership.institutionName}</span>
      </span>
      <span className="flex items-center gap-2 text-muted-foreground">
        <ShieldCheck className="h-4 w-4" aria-hidden />
        {roleLabels[activeMembership.roleKey]}
      </span>
      <Badge
        variant="outline"
        className={
          activeMembership.institutionStatus === 'trial'
            ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
            : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
        }
      >
        {activeMembership.institutionStatus === 'trial' ? 'Periodo de prueba' : 'Institución activa'}
      </Badge>
    </div>
  );
}
