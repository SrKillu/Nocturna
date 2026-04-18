import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import {
  deleteMaterial,
  getMaterialSignedUrl,
} from '@/lib/services/materials.service';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth();
    const { url } = await getMaterialSignedUrl(ctx, params.id, 60);
    if (request.nextUrl.searchParams.get('json') === '1') {
      return NextResponse.json({ data: { url } });
    }
    return NextResponse.redirect(url, 302);
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth();
    await deleteMaterial(ctx, params.id);
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
