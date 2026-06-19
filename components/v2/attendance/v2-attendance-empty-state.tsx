import { CalendarX2 } from 'lucide-react';

import { V2EmptyState } from '@/components/v2/states/v2-empty-state';

export function V2AttendanceEmptyState({ filtered }: { filtered: boolean }) {
  return (
    <V2EmptyState
      icon={CalendarX2}
      title={filtered ? 'No encontramos registros' : 'Aún no hay sesiones'}
      description={
        filtered
          ? 'Ajusta la búsqueda o los filtros para ampliar los resultados.'
          : 'Las sesiones visibles para tus cursos aparecerán aquí.'
      }
    />
  );
}
