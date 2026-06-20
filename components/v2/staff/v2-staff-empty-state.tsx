import { UserCog } from 'lucide-react';

import { V2EmptyState } from '@/components/v2/states/v2-empty-state';

export function V2StaffEmptyState({ filtered }: { filtered: boolean }) {
  return (
    <V2EmptyState
      icon={UserCog}
      title={filtered ? 'No encontramos personal' : 'Aún no hay personal mock'}
      description={
        filtered
          ? 'Ajusta la búsqueda o los filtros para ampliar los resultados.'
          : 'Los registros institucionales de demostración aparecerán aquí.'
      }
    />
  );
}
