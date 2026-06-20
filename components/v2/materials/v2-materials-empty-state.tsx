import { FileX2 } from 'lucide-react';

import { V2EmptyState } from '@/components/v2/states/v2-empty-state';

export function V2MaterialsEmptyState({ filtered }: { filtered: boolean }) {
  return (
    <V2EmptyState
      icon={FileX2}
      title={filtered ? 'No encontramos materiales' : 'Aún no hay materiales'}
      description={
        filtered
          ? 'Ajusta la búsqueda o los filtros para ampliar los resultados.'
          : 'Los materiales visibles para tus cursos aparecerán aquí.'
      }
    />
  );
}
