import { redirect } from 'next/navigation';

import { V2DashboardHome } from '@/components/v2/dashboard/v2-dashboard-home';
import { V2ProblemState } from '@/components/v2/states/v2-problem-state';
import { SessionV2ValidationError, validateSessionV2 } from '@/lib/auth/session';
import { getMockDashboardV2 } from '@/lib/mocks/dashboard-v2';
import { dashboardVariantForRole } from '@/lib/types/dashboard-v2';

export default async function V2DashboardPage() {
  let session;

  try {
    session = await validateSessionV2();
  } catch (error) {
    if (error instanceof SessionV2ValidationError) {
      if (error.code === 'SESSION_NOT_AUTHENTICATED') {
        redirect('/login?error=not_authenticated');
      }

      return <V2ProblemState code={error.code} />;
    }

    return <V2ProblemState code="UNKNOWN" />;
  }

  if (!session.activeMembership) {
    redirect('/auth/v2-session');
  }

  const variant = dashboardVariantForRole(session.activeMembership.roleKey);
  const dashboard = getMockDashboardV2(variant);

  return (
    <V2DashboardHome
      dashboard={dashboard}
      capabilities={session.activeMembership.capabilities}
    />
  );
}
