import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { confirmUploadSchema } from '@/lib/validations/files';
import { confirmUpload } from '@/lib/services/files.service';
import { recordAudit } from '@/lib/services/audit.service';
import { enforceCombinedRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

/**
 * POST /api/files/confirm
 * Body: { fileId: UUID }
 *
 * Runs the magic-byte verification on a just-uploaded object and flips its
 * scan_status to clean | blocked. Clients MUST call this after completing
 * the signed-URL upload; otherwise the file remains unusable.
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    enforceCombinedRateLimit({
      rule: RATE_LIMITS.fileUpload,
      request,
      userId: ctx.userId,
    });
    const body = await request.json();
    const input = confirmUploadSchema.parse(body);
    const result = await confirmUpload(ctx, input.fileId);

    void recordAudit(ctx, {
      action: `file.confirm.${result.scanStatus}`,
      entityType: 'file_object',
      entityId: result.fileId,
      metadata: { path: result.path },
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
