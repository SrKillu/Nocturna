import { ShieldCheck, UserCog } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

export function V2StaffHeader() {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Personal</h1>
          <Badge variant="outline">Fundación C16</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Consulta personal y asignaciones mock de la institución activa.
        </p>
      </div>
      <span className="flex items-center gap-2 rounded-md border bg-muted/25 px-3 py-2 text-sm font-medium text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
        <UserCog className="h-4 w-4 text-primary" aria-hidden />
        Gestión no habilitada
      </span>
    </header>
  );
}
