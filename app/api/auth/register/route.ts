import { NextResponse, type NextRequest } from 'next/server';
import { publicRegisterSchema } from '@/lib/validations/auth';
import { registerPublicUser } from '@/lib/services/auth.service';
import { enforceRateLimit, RATE_LIMITS, clientIp } from '@/lib/rate-limit';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(RATE_LIMITS.authSignup, `ip:${clientIp(request)}`);
    const body = await request.json().catch(() => ({}));
    const input = publicRegisterSchema.parse(body);
    const result = await registerPublicUser(input);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
