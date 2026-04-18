import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import {
  createMaterial,
  createMaterialSchema,
  listMaterials,
} from '@/lib/services/materials.service';
import { toApiErrorResponse, ApiError } from '@/lib/errors';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth();
    const rows = await listMaterials(ctx, params.id);
    return NextResponse.json({ data: rows });
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
    const ct = request.headers.get('content-type') ?? '';
    if (!ct.toLowerCase().startsWith('multipart/form-data')) {
      throw new ApiError('VALIDATION_ERROR', 'Debe enviarse multipart/form-data');
    }
    const form = await request.formData();
    const input = createMaterialSchema.parse({
      title: form.get('title') ?? undefined,
      description: form.get('description') ?? null,
    });
    const raw = form.get('file');
    if (!(raw instanceof File) || raw.size === 0) {
      throw new ApiError('VALIDATION_ERROR', 'Archivo requerido');
    }
    const bytes = new Uint8Array(await raw.arrayBuffer());
    const row = await createMaterial(ctx, params.id, input, {
      name: raw.name || 'archivo',
      mime: raw.type || 'application/octet-stream',
      bytes,
      size: raw.size,
    });
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
