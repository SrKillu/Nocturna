import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { auditEventSchema } from '@/lib/validations/audit';
import { recordAudit } from '@/lib/services/audit.service';
import { enforceCombinedRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

/**
 * Authenticated audit-event sink.
 *   POST /api/audit/log { event, metadata? }
 *
 * Accepted events: login_success, token_refresh, logout, permission_denied,
 * login_failed (for post-auth failures only; unauthenticated failed logins
 * are not accepted here to avoid giving an anonymous oracle).
 *
 * Rate-limited by user+IP so a compromised token can't spam audit_log.
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    enforceCombinedRateLimit({
      rule: RATE_LIMITS.authEvent,
      request,
      userId: ctx.userId,
    });
    const body = await request.json();
    const input = auditEventSchema.parse(body);

    await recordAudit(ctx, {
      action: `auth.${input.event}`,
      entityType: 'session',
      entityId: ctx.userId,
      metadata: input.metadata ?? {},
    });

    return NextResponse.json({ data: { ok: true } }, { status: 201 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
