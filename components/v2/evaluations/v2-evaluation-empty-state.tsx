import { ClipboardX } from 'lucide-react';

import { V2EmptyState } from '@/components/v2/states/v2-empty-state';

export function V2EvaluationEmptyState({ filtered }: { filtered: boolean }) {
  return (
    <V2EmptyState
      icon={ClipboardX}
      title={filtered ? 'No encontramos evaluaciones' : 'Aún no hay evaluaciones'}
      description={
        filtered
          ? 'Ajusta la búsqueda o los filtros para ampliar los resultados.'
          : 'Las evaluaciones visibles para tus cursos aparecerán aquí.'
      }
    />
  );
}
