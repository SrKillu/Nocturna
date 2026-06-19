import { NextResponse } from 'next/server';
import { validateSessionV2 } from '@/lib/auth/session';
import { toApiErrorResponse } from '@/lib/errors';
import type { AuthMeResponse } from '@/lib/types/auth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await validateSessionV2();
    const response: AuthMeResponse = {
      profile: session.profile,
      memberships: session.memberships,
      activeMembership: session.activeMembership,
      membershipRequired: session.membershipRequired,
      capabilities: session.activeMembership?.capabilities ?? {},
    };

    return NextResponse.json({ data: response });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
