import { UsersRound } from 'lucide-react';

import { V2EmptyState } from '@/components/v2/states/v2-empty-state';

interface V2StudentEmptyStateProps {
  filtered: boolean;
}

export function V2StudentEmptyState({ filtered }: V2StudentEmptyStateProps) {
  return (
    <V2EmptyState
      icon={UsersRound}
      title={filtered ? 'No encontramos estudiantes' : 'Aún no hay estudiantes'}
      description={
        filtered
          ? 'Ajusta la búsqueda o los filtros para ampliar los resultados.'
          : 'Los estudiantes visibles para esta institución aparecerán aquí.'
      }
    />
  );
}
