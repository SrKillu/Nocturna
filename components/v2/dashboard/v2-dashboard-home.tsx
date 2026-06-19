import { Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { V2ActivityPanel } from '@/components/v2/dashboard/v2-activity-panel';
import { V2KpiStrip } from '@/components/v2/dashboard/v2-kpi-strip';
import { V2WorkQueue } from '@/components/v2/dashboard/v2-work-queue';
import type { Capabilities } from '@/lib/types/auth';
import type { DashboardV2ViewModel } from '@/lib/types/dashboard-v2';

interface V2DashboardHomeProps {
  dashboard: DashboardV2ViewModel;
  capabilities: Capabilities;
}

export function V2DashboardHome({
  dashboard,
  capabilities,
}: V2DashboardHomeProps) {
  const primaryActionVisible =
    dashboard.primaryAction &&
    (!dashboard.primaryAction.requiredCapability ||
      capabilities[dashboard.primaryAction.requiredCapability] === true);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{dashboard.heading}</h1>
            <Badge variant="outline">Vista previa C2</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{dashboard.summary}</p>
        </div>
        {primaryActionVisible ? (
          <span className="flex items-center gap-2 rounded-md border bg-muted/25 px-3 py-2 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            {dashboard.primaryAction?.label} · próximamente
          </span>
        ) : null}
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
        <V2WorkQueue items={dashboard.workQueue} capabilities={capabilities} />
        <V2ActivityPanel title={dashboard.activityTitle} items={dashboard.activity} />
      </div>

      <V2KpiStrip metrics={dashboard.metrics} />
    </div>
  );
}
