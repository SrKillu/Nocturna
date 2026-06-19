import { BookOpenCheck } from 'lucide-react';

import { V2EmptyState } from '@/components/v2/states/v2-empty-state';

interface V2CourseEmptyStateProps {
  filtered: boolean;
}

export function V2CourseEmptyState({ filtered }: V2CourseEmptyStateProps) {
  return (
    <V2EmptyState
      icon={BookOpenCheck}
      title={filtered ? 'No encontramos cursos' : 'Aún no hay cursos'}
      description={
        filtered
          ? 'Ajusta la búsqueda o los filtros para ampliar los resultados.'
          : 'Los cursos disponibles para esta institución aparecerán aquí.'
      }
    />
  );
}
