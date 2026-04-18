import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth, requireRole } from '@/lib/api/auth';
import {
  createStudentInvite,
  createStudentInviteSchema,
  listStudentInvites,
} from '@/lib/services/invites.service';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    requireRole(ctx, ['admin', 'super_admin', 'teacher']);
    const courseId = request.nextUrl.searchParams.get('courseId') ?? undefined;
    const data = await listStudentInvites(ctx, { courseId });
    return NextResponse.json({ data });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    requireRole(ctx, ['admin', 'super_admin', 'teacher']);
    const body = await request.json().catch(() => ({}));
    const input = createStudentInviteSchema.parse(body);
    const data = await createStudentInvite(ctx, input);
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
