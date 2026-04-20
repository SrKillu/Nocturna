import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/api/auth';
import {
  deleteDailyWork,
  listDailyWorkSubmissions,
} from '@/lib/services/daily-work.service';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth();
    requireRole(ctx, ['admin', 'super_admin', 'teacher']);
    const data = await listDailyWorkSubmissions(ctx, params.id);
    return NextResponse.json({ data });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth();
    requireRole(ctx, ['admin', 'super_admin', 'teacher']);
    await deleteDailyWork(ctx, params.id);
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
