import { UsersRound } from 'lucide-react';

import { V2EmptyState } from '@/components/v2/states/v2-empty-state';

export function V2GuardianEmptyState() {
  return (
    <V2EmptyState
      icon={UsersRound}
      title="No hay estudiantes asociados"
      description="Cuando exista una asociación académica disponible, aparecerá en este espacio."
    />
  );
}
