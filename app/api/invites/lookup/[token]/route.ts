import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { lookupInvite } from '@/lib/services/invites.service';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
) {
  try {
    // Requerimos login para ver el preview (evita abuso de enumeración).
    await requireAuth();
    const preview = await lookupInvite(params.token);
    if (!preview) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Invitación no encontrada' } },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: preview });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
