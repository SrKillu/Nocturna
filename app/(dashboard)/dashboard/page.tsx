import type { Metadata } from 'next';
import { validateSessionLoose } from '@/lib/auth/session';
import {
  getDashboardOverview,
  emptyOverview,
  type DashboardOverview,
} from '@/lib/services/dashboard.service';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';
import { WelcomeCard } from '@/components/dashboard/welcome-card';
import { KpiGrid } from '@/components/dashboard/kpi-grid';
import { CoursesCard } from '@/components/dashboard/courses-card';
import { TasksCard } from '@/components/dashboard/tasks-card';
import { ActivityCard } from '@/components/dashboard/activity-card';
import { JoinInstitutionPanel } from '@/components/dashboard/join-institution-panel';

export const metadata: Metadata = {
  title: 'Panel · Nocturna',
};

// Never cache: KPIs and activity must be fresh on every visit.
export const dynamic = 'force-dynamic';

export default async function DashboardHome() {
  const ctx = await validateSessionLoose();

  // ── Usuario sin tenant → onboarding inline ───────────────────────
  if (!ctx.institutionId) {
    return <JoinInstitutionPanel role={ctx.role} />;
  }

  let overview: DashboardOverview;
  try {
    overview = isSupabaseConfigured()
      ? await getDashboardOverview(ctx)
      : emptyOverview(ctx, null);
  } catch (err) {
    // If a single sub-query breaks (e.g. new migration not applied yet) we
    // prefer rendering an empty dashboard to a 500. The parent shell still
    // shows with all navigation intact.
    // eslint-disable-next-line no-console
    console.warn('[dashboard] overview failed', err);
    const supabase = createClient();
    const { data: institution } = await supabase
      .from('institutions')
      .select('name')
      .eq('id', ctx.institutionId)
      .maybeSingle();
    overview = emptyOverview(ctx, institution?.name ?? null);
  }

  return (
    <div className="space-y-6">
      <WelcomeCard
        name={overview.displayName}
        role={overview.role}
        institutionName={overview.institutionName}
      />
      <KpiGrid kpis={overview.kpis} role={overview.role} />
      <div className="grid gap-6 lg:grid-cols-2">
        <CoursesCard courses={overview.courses} />
        <TasksCard tasks={overview.tasks} role={overview.role} />
      </div>
      <ActivityCard items={overview.activity} />
    </div>
  );
}
