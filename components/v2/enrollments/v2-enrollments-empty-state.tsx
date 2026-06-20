import { ClipboardList } from 'lucide-react';
import { V2EmptyState } from '@/components/v2/states/v2-empty-state';

export function V2EnrollmentsEmptyState({ filtered }: { filtered: boolean }) {
  return <V2EmptyState icon={ClipboardList} title={filtered ? 'No encontramos matrículas' : 'Aún no hay matrículas mock'} description={filtered ? 'Ajusta la búsqueda o los filtros para ampliar los resultados.' : 'Las asignaciones estudiante-curso de demostración aparecerán aquí.'} />;
}
