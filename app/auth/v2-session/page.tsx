import { redirect } from 'next/navigation';
import { SessionV2ValidationError, validateSessionV2 } from '@/lib/auth/session';
import type { AuthMeResponse } from '@/lib/types/auth';
import {
  V2SessionPanel,
  V2SessionProblemPanel,
} from '@/components/auth/v2-session-panel';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'default-no-store';

export default async function AuthV2SessionPage() {
  try {
    const session = await validateSessionV2();
    const response: AuthMeResponse = {
      profile: session.profile,
      memberships: session.memberships,
      activeMembership: session.activeMembership,
      membershipRequired: session.membershipRequired,
      capabilities: session.activeMembership?.capabilities ?? {},
    };

    return <V2SessionPanel session={response} />;
  } catch (err) {
    if (err instanceof SessionV2ValidationError) {
      if (err.code === 'SESSION_NOT_AUTHENTICATED') {
        redirect('/login?error=not_authenticated');
      }

      return <V2SessionProblemPanel code={err.code} />;
    }

    return <V2SessionProblemPanel code="UNKNOWN" />;
  }
}
