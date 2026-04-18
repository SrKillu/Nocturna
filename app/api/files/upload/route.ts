import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { uploadRequestSchema } from '@/lib/validations/files';
import { issueUploadUrl } from '@/lib/services/files.service';
import { recordAudit } from '@/lib/services/audit.service';
import { enforceCombinedRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

/**
 * POST /api/files/upload
 * Body: { bucket, mimeType, size, taskId?, originalName?, sha256? }
 *
 * Issues a signed upload URL bound to a freshly-generated server-side path
 * (random UUID filename, caller's tenant + user prefix). Registers a pending
 * file_objects row. Client MUST call /api/files/confirm after uploading.
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
    const input = uploadRequestSchema.parse(body);

    const issued = await issueUploadUrl(ctx, input);

    void recordAudit(ctx, {
      action: 'file.upload_url.issued',
      entityType: 'file_object',
      entityId: issued.fileId,
      metadata: {
        bucket: input.bucket,
        path: issued.path,
        mimeType: input.mimeType,
        size: input.size,
        sha256: input.sha256 ?? null,
        originalName: input.originalName ?? null,
        taskId: input.taskId ?? null,
      },
    });

    return NextResponse.json({ data: issued }, { status: 201 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
