import { Eye, Settings } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

export function V2SettingsHeader() {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
          <Badge variant="outline">Fundación C20</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Consulta el estado mock de la configuración institucional.
        </p>
      </div>
      <span className="flex items-center gap-2 rounded-md border bg-muted/25 px-3 py-2 text-sm font-medium text-muted-foreground">
        <Eye className="h-4 w-4 text-primary" aria-hidden />
        Solo lectura · sin cambios reales
      </span>
    </header>
  );
}
