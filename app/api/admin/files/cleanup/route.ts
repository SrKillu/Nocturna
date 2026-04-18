import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/api/auth';
import { cleanupOrphans } from '@/lib/services/files.service';
import { recordAudit } from '@/lib/services/audit.service';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

/**
 * POST /api/admin/files/cleanup
 * Admin-only. Removes pending-for-too-long uploads and orphan submission files.
 * Intended to be hit by a scheduled job / manual admin action.
 */
export async function POST() {
  try {
    const ctx = await requireAuth();
    requireRole(ctx, ['admin', 'super_admin']);
    const result = await cleanupOrphans(ctx, { olderThanHours: 24 });

    void recordAudit(ctx, {
      action: 'files.cleanup',
      entityType: 'institution',
      entityId: ctx.institutionId,
      metadata: { removed: result.removed },
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
