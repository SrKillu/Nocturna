import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { downloadQuerySchema } from '@/lib/validations/files';
import { resolveSignedDownload } from '@/lib/services/files.service';
import { enforceCombinedRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

/**
 * GET /api/files/download?bucket=<bucket>&path=<path>
 *
 * Returns a 302 redirect to a short-lived (60s) signed URL. The URL is NEVER
 * included in a JSON response body so it cannot leak to logs, service workers,
 * or analytics that capture API payloads.
 *
 * Cache-Control: no-store ensures intermediary caches cannot hold onto the
 * redirect location either.
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    enforceCombinedRateLimit({
      rule: RATE_LIMITS.fileDownload,
      request,
      userId: ctx.userId,
    });
    const input = downloadQuerySchema.parse({
      bucket: request.nextUrl.searchParams.get('bucket') ?? '',
      path: request.nextUrl.searchParams.get('path') ?? '',
    });

    const signedUrl = await resolveSignedDownload(ctx, input.bucket, input.path);
    const res = NextResponse.redirect(signedUrl, 302);
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('Referrer-Policy', 'no-referrer');
    return res;
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
