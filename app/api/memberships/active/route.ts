import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import {
  ACTIVE_MEMBERSHIP_COOKIE,
  validateActiveMembershipIdForUser,
} from '@/lib/auth/active-membership';
import { ApiError, toApiErrorResponse } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const bodySchema = z.object({
  membershipId: z.string().uuid(),
});

const ACTIVE_MEMBERSHIP_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { membershipId } = bodySchema.parse(body);

    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new ApiError('UNAUTHENTICATED', 'User not authenticated');
    }

    const activeMembership = await validateActiveMembershipIdForUser(user, membershipId);
    if (!activeMembership) {
      throw new ApiError('MEMBERSHIP_REQUIRED', 'Active membership is not available');
    }

    const response = NextResponse.json({ data: { activeMembership } });
    response.cookies.set({
      name: ACTIVE_MEMBERSHIP_COOKIE,
      value: membershipId,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: ACTIVE_MEMBERSHIP_COOKIE_MAX_AGE,
    });

    return response;
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
