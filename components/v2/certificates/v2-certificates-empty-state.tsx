import { ScrollText } from 'lucide-react';

import { V2EmptyState } from '@/components/v2/states/v2-empty-state';

export function V2CertificatesEmptyState({ filtered }: { filtered: boolean }) {
  return (
    <V2EmptyState
      icon={ScrollText}
      title={
        filtered
          ? 'No encontramos certificados'
          : 'Aún no hay certificados mock'
      }
      description={
        filtered
          ? 'Ajusta la búsqueda o los filtros para ampliar los resultados.'
          : 'Los registros de elegibilidad simulada aparecerán aquí.'
      }
    />
  );
}
