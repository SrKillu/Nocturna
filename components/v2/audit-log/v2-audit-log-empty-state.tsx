import { ListX } from 'lucide-react';
import { V2EmptyState } from '@/components/v2/states/v2-empty-state';

export function V2AuditLogEmptyState({ filtered }: { filtered: boolean }) {
  return <V2EmptyState icon={ListX} title={filtered ? 'No encontramos eventos' : 'Sin eventos de auditoría'} description={filtered ? 'Ajusta la búsqueda o los filtros para ampliar los resultados.' : 'La actividad institucional mock aparecerá aquí.'} />;
}
