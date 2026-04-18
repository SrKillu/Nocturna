import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { uploadRequestSchema } from '@/lib/validations/files';
import { issueUploadUrl } from '@/lib/services/files.service';
import { recordAudit } from '@/lib/services/audit.service';
import { enforceCombinedRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

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

    // Fire-and-forget audit.
    void recordAudit(ctx, {
      action: 'file.upload_url.issued',
      entityType: 'task',
      entityId: input.taskId,
      metadata: {
        path: issued.path,
        mimeType: input.mimeType,
        size: input.size,
        sha256: input.sha256 ?? null,
      },
    });

    return NextResponse.json({ data: issued }, { status: 201 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
