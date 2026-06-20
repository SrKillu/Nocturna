import { FileBarChart } from 'lucide-react';
import { V2EmptyState } from '@/components/v2/states/v2-empty-state';

export function V2ReportsEmptyState({ filtered }: { filtered: boolean }) {
  return <V2EmptyState icon={FileBarChart} title={filtered ? 'No encontramos reportes' : 'Aún no hay reportes'} description={filtered ? 'Ajusta la búsqueda o los filtros para ampliar los resultados.' : 'Los reportes mock disponibles para tu alcance aparecerán aquí.'} />;
}
