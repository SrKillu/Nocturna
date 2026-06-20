import { V2SettingsAcademicConfig } from '@/components/v2/settings/v2-settings-academic-config';
import { V2SettingsBrandingPanel } from '@/components/v2/settings/v2-settings-branding-panel';
import { V2SettingsEmptyState } from '@/components/v2/settings/v2-settings-empty-state';
import { V2SettingsHeader } from '@/components/v2/settings/v2-settings-header';
import { V2SettingsInstitutionProfile } from '@/components/v2/settings/v2-settings-institution-profile';
import { V2SettingsIntegrationsPanel } from '@/components/v2/settings/v2-settings-integrations-panel';
import { V2SettingsNotificationsPanel } from '@/components/v2/settings/v2-settings-notifications-panel';
import { V2SettingsRolesPanel } from '@/components/v2/settings/v2-settings-roles-panel';
import { V2SettingsSecurityPanel } from '@/components/v2/settings/v2-settings-security-panel';
import { V2SettingsSummary } from '@/components/v2/settings/v2-settings-summary';
import type { SettingsV2Fixture, SettingsV2Panel } from '@/lib/types/settings-v2';

const panelComponents: Record<
  SettingsV2Panel['id'],
  (props: { panel: SettingsV2Panel }) => JSX.Element
> = {
  'institution-profile': V2SettingsInstitutionProfile,
  'academic-config': V2SettingsAcademicConfig,
  branding: V2SettingsBrandingPanel,
  security: V2SettingsSecurityPanel,
  roles: V2SettingsRolesPanel,
  integrations: V2SettingsIntegrationsPanel,
  notifications: V2SettingsNotificationsPanel,
};

export function V2SettingsPage({ settings }: { settings: SettingsV2Fixture }) {
  return (
    <div className="space-y-5">
      <V2SettingsHeader />
      <V2SettingsSummary summary={settings.summary} />

      {settings.panels.length === 0 ? (
        <V2SettingsEmptyState />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {settings.panels.map((panel) => {
            const Panel = panelComponents[panel.id];
            return <Panel key={panel.id} panel={panel} />;
          })}
        </div>
      )}

      <p className="rounded-md border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        {settings.disclaimer}
      </p>
    </div>
  );
}
