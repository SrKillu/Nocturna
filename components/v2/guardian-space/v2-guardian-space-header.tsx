import { Badge } from '@/components/ui/badge';
import type { GuardianSpaceV2ViewModel } from '@/lib/types/guardian-space-v2';

interface V2GuardianSpaceHeaderProps {
  guardianSpace: GuardianSpaceV2ViewModel;
}

export function V2GuardianSpaceHeader({
  guardianSpace,
}: V2GuardianSpaceHeaderProps) {
  const alertCount = guardianSpace.students.reduce(
    (total, student) => total + student.alertCount,
    0
  );

  return (
    <header className="rounded-md border bg-card">
      <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Espacio del encargado
            </h1>
            <Badge variant="outline">Fundación C9</Badge>
          </div>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
            {guardianSpace.summary}
          </p>
        </div>
        <Badge variant="outline" className="w-fit whitespace-nowrap">
          {guardianSpace.periodLabel}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Estudiantes asociados</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {guardianSpace.students.length}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Alertas abiertas</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{alertCount}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Próximas acciones</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {guardianSpace.nextActions.length}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Comunicados</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {guardianSpace.communications.length}
          </p>
        </div>
      </div>
    </header>
  );
}
