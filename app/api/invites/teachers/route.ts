import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth, requireRole } from '@/lib/api/auth';
import {
  createTeacherInvite,
  createTeacherInviteSchema,
  listTeacherInvites,
} from '@/lib/services/invites.service';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const ctx = await requireAuth();
    requireRole(ctx, ['admin', 'super_admin']);
    const data = await listTeacherInvites(ctx);
    return NextResponse.json({ data });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    requireRole(ctx, ['admin', 'super_admin']);
    const body = await request.json().catch(() => ({}));
    const input = createTeacherInviteSchema.parse(body);
    const data = await createTeacherInvite(ctx, input);
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
