import type { LucideIcon } from 'lucide-react';

import { V2SettingsStatusBadge } from '@/components/v2/settings/v2-settings-status-badge';
import type { SettingsV2Panel } from '@/lib/types/settings-v2';

export function V2SettingsPanel({
  panel,
  icon: Icon,
}: {
  panel: SettingsV2Panel;
  icon: LucideIcon;
}) {
  const titleId = `settings-${panel.id}-title`;

  return (
    <section className="rounded-md border bg-card" aria-labelledby={titleId}>
      <div className="border-b px-4 py-3">
        <h2 id={titleId} className="flex items-center gap-2 font-semibold">
          <Icon className="h-4 w-4 text-primary" aria-hidden />
          {panel.title}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {panel.description}
        </p>
      </div>
      <dl className="divide-y">
        {panel.fields.map((field) => (
          <div
            key={field.id}
            className="flex items-start justify-between gap-4 px-4 py-3"
          >
            <div>
              <dt className="text-sm font-medium">{field.label}</dt>
              {field.detail ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {field.detail}
                </p>
              ) : null}
            </div>
            <dd className="flex max-w-[60%] flex-wrap items-center justify-end gap-2 text-right text-sm text-muted-foreground">
              <span>{field.value}</span>
              {field.status ? (
                <V2SettingsStatusBadge status={field.status} />
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
