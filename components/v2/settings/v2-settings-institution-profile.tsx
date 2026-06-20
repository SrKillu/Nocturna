import { Building2 } from 'lucide-react';

import { V2SettingsPanel } from '@/components/v2/settings/v2-settings-panel';
import type { SettingsV2Panel } from '@/lib/types/settings-v2';

export function V2SettingsInstitutionProfile({ panel }: { panel: SettingsV2Panel }) {
  return <V2SettingsPanel panel={panel} icon={Building2} />;
}
