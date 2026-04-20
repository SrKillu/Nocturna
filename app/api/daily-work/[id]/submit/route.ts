import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import {
  submitDailyWork,
  submitDailyWorkSchema,
} from '@/lib/services/daily-work.service';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth();
    const body = await request.json().catch(() => ({}));
    const input = submitDailyWorkSchema.parse(body);
    const data = await submitDailyWork(ctx, params.id, input);
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
