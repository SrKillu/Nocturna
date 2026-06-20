import { BellOff } from 'lucide-react';
import { V2EmptyState } from '@/components/v2/states/v2-empty-state';

export function V2NotificationsEmptyState({ filtered }: { filtered: boolean }) {
  return <V2EmptyState icon={BellOff} title={filtered ? 'No encontramos notificaciones' : 'Sin notificaciones'} description={filtered ? 'Ajusta la búsqueda o los filtros para ampliar los resultados.' : 'Las señales mock visibles para tu rol aparecerán aquí.'} />;
}
