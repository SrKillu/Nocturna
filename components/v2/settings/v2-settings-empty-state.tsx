import { Settings2 } from 'lucide-react';

import { V2EmptyState } from '@/components/v2/states/v2-empty-state';

export function V2SettingsEmptyState() {
  return (
    <V2EmptyState
      icon={Settings2}
      title="Sin configuración disponible"
      description="La configuración mock de la institución aparecerá aquí."
    />
  );
}
