import { redirect } from 'next/navigation';
import { validateSessionV2 } from '@/lib/auth/session';
import type { AuthMeResponse } from '@/lib/types/auth';
import { V2SessionPanel } from '@/components/auth/v2-session-panel';

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
  } catch {
    redirect('/login?error=not_authenticated');
  }
}
