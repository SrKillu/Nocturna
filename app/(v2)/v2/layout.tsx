import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { V2AppShell } from '@/components/v2/layout/v2-app-shell';
import { V2ProblemState } from '@/components/v2/states/v2-problem-state';
import { SessionV2ValidationError, validateSessionV2 } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'default-no-store';

export default async function V2Layout({ children }: { children: ReactNode }) {
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

  const activeMembershipSummary = session.memberships.find(
    (membership) => membership.membershipId === session.activeMembership?.membershipId
  );

  if (!activeMembershipSummary) {
    return <V2ProblemState code="INSTITUTION_UNAVAILABLE" />;
  }

  return (
    <V2AppShell
      profile={session.profile}
      memberships={session.memberships}
      activeMembership={session.activeMembership}
      activeMembershipSummary={activeMembershipSummary}
    >
      {children}
    </V2AppShell>
  );
}
