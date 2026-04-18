import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { consumeInvite } from '@/lib/services/invites.service';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

const bodySchema = z.object({
  token: z.string().uuid('Token inválido'),
});

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    const body = await request.json().catch(() => ({}));
    const { token } = bodySchema.parse(body);
    const result = await consumeInvite(ctx, token);
    return NextResponse.json({ data: result });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
