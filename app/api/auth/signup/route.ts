import { NextResponse, type NextRequest } from 'next/server';
import { institutionSignupSchema } from '@/lib/validations/auth';
import { bootstrapInstitutionAndAdmin } from '@/lib/services/auth.service';
import { enforceRateLimit, RATE_LIMITS, clientIp } from '@/lib/rate-limit';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Anti-abuse: signup is public, so we rate-limit by IP aggressively.
    enforceRateLimit(RATE_LIMITS.authSignup, `ip:${clientIp(request)}`);

    const body = await request.json();
    const input = institutionSignupSchema.parse(body);
    const result = await bootstrapInstitutionAndAdmin(input);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
