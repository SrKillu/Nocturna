import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { validateSessionLoose, SessionValidationError, sessionErrorToApiError } from '@/lib/auth/session';
import { consumeInvite } from '@/lib/services/invites.service';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

const bodySchema = z.object({
  token: z.string().uuid('Token inválido'),
});

export async function POST(request: NextRequest) {
  try {
    // Usamos validateSessionLoose: un usuario recién registrado sin institución
    // debe poder consumir una invitación para unirse a su tenant.
    let ctx;
    try {
      ctx = await validateSessionLoose();
    } catch (err) {
      if (err instanceof SessionValidationError) throw sessionErrorToApiError(err);
      throw err;
    }
    const body = await request.json().catch(() => ({}));
    const { token } = bodySchema.parse(body);
    const result = await consumeInvite(ctx, token);
    return NextResponse.json({ data: result });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
