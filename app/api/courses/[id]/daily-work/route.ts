import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import {
  createDailyWork,
  createDailyWorkSchema,
  listDailyWorks,
} from '@/lib/services/daily-work.service';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth();
    const data = await listDailyWorks(ctx, params.id);
    return NextResponse.json({ data });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth();
    const body = await request.json().catch(() => ({}));
    const input = createDailyWorkSchema.parse(body);
    const data = await createDailyWork(ctx, params.id, input);
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
