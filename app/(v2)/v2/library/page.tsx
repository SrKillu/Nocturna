import { redirect } from 'next/navigation';

import { V2LibraryPage } from '@/components/v2/library/v2-library-page';
import { V2AccessDeniedState } from '@/components/v2/states/v2-access-denied-state';
import { V2ProblemState } from '@/components/v2/states/v2-problem-state';
import { SessionV2ValidationError, validateSessionV2 } from '@/lib/auth/session';
import { getMockLibraryV2 } from '@/lib/mocks/library-v2';
import { canAccessLibraryV2 } from '@/lib/types/library-v2';

export default async function LibraryV2Page() {
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

  const activeMembership = session.memberships.find(
    (membership) =>
      membership.membershipId === session.activeMembership?.membershipId
  );

  if (!activeMembership) {
    return <V2ProblemState code="INSTITUTION_UNAVAILABLE" />;
  }

  if (
    !canAccessLibraryV2(
      session.activeMembership.roleKey,
      session.activeMembership.capabilities
    )
  ) {
    return (
      <V2AccessDeniedState
        institutionName={activeMembership.institutionName}
        canSwitchInstitution={session.memberships.length > 1}
      />
    );
  }

  return (
    <V2LibraryPage library={getMockLibraryV2(session.activeMembership.roleKey)} />
  );
}
