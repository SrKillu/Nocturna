import { Badge } from '@/components/ui/badge';
import type { MySpaceV2ViewModel } from '@/lib/types/my-space-v2';

interface V2MySpaceHeaderProps {
  mySpace: MySpaceV2ViewModel;
}

export function V2MySpaceHeader({ mySpace }: V2MySpaceHeaderProps) {
  return (
    <header className="rounded-md border bg-card">
      <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Mi espacio académico</h1>
            <Badge variant="outline">Fundación C8</Badge>
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {mySpace.studentCode}
          </p>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
            {mySpace.summary}
          </p>
        </div>
        <Badge variant="outline" className="w-fit whitespace-nowrap">
          {mySpace.periodLabel}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Cursos actuales</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{mySpace.courses.length}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Próximas acciones</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {mySpace.nextActions.length}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Asistencia</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {mySpace.attendance.percent}%
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Evaluaciones recientes</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {mySpace.evaluations.length}
          </p>
        </div>
      </div>
    </header>
  );
}
