import { BookX } from 'lucide-react';

import { V2EmptyState } from '@/components/v2/states/v2-empty-state';

export function V2LibraryEmptyState({ filtered }: { filtered: boolean }) {
  return (
    <V2EmptyState
      icon={BookX}
      title={filtered ? 'No encontramos recursos' : 'Aún no hay recursos'}
      description={
        filtered
          ? 'Ajusta la búsqueda o los filtros para ampliar los resultados.'
          : 'Las colecciones visibles para tu institución aparecerán aquí.'
      }
    />
  );
}
