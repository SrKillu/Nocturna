import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { AuthenticatedContext } from '@/lib/types/auth';

/**
 * Append a row to public.audit_log using the caller's JWT context.
 * Never throws — audit failures must not break business logic.
 * institution_id comes from the DEFAULT (auth.institution_id()), so the
 * client cannot spoof it.
 */
export async function recordAudit(
  ctx: AuthenticatedContext,
  params: {
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.from('audit_log').insert({
      institution_id: ctx.institutionId,
      actor_id: ctx.userId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      metadata: params.metadata ?? {},
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[audit] failed to write audit_log', err);
  }
}
