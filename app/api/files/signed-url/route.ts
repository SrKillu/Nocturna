import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { signedUrlQuerySchema } from '@/lib/validations/files';
import { issueDownloadUrl } from '@/lib/services/files.service';
import { enforceCombinedRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    enforceCombinedRateLimit({
      rule: RATE_LIMITS.fileDownload,
      request,
      userId: ctx.userId,
    });

    const input = signedUrlQuerySchema.parse({
      path: request.nextUrl.searchParams.get('path') ?? '',
    });

    const issued = await issueDownloadUrl(ctx, input.path);
    return NextResponse.json({ data: issued });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
