import { ChartNoAxesColumnIncreasing } from 'lucide-react';

import { V2EmptyState } from '@/components/v2/states/v2-empty-state';

export function V2GradebookEmptyState({ filtered }: { filtered: boolean }) {
  return (
    <V2EmptyState
      icon={ChartNoAxesColumnIncreasing}
      title={filtered ? 'No encontramos calificaciones' : 'Aún no hay calificaciones'}
      description={
        filtered
          ? 'Ajusta la búsqueda o los filtros para ampliar los resultados.'
          : 'Los registros mock visibles para tus cursos aparecerán aquí.'
      }
    />
  );
}
