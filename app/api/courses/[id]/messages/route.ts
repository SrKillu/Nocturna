import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import {
  listMessages,
  sendMessage,
  sendMessageSchema,
} from '@/lib/services/messages.service';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth();
    const since = request.nextUrl.searchParams.get('since') ?? undefined;
    const limitRaw = request.nextUrl.searchParams.get('limit');
    const limit = limitRaw ? Math.max(1, Math.min(100, Number(limitRaw))) : undefined;
    const data = await listMessages(ctx, params.id, { since, limit });
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
    const body = await request.json();
    const input = sendMessageSchema.parse(body);
    const msg = await sendMessage(ctx, params.id, input);
    return NextResponse.json({ data: msg }, { status: 201 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
