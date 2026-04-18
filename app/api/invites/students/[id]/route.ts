import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/api/auth';
import { revokeStudentInvite } from '@/lib/services/invites.service';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth();
    requireRole(ctx, ['admin', 'super_admin', 'teacher']);
    await revokeStudentInvite(ctx, params.id);
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
