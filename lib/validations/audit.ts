import { z } from 'zod';

export const AUDIT_EVENTS = [
  'login_success',
  'login_failed',
  'token_refresh',
  'logout',
  'permission_denied',
] as const;
export type AuditEvent = (typeof AUDIT_EVENTS)[number];

export const auditEventSchema = z.object({
  event: z.enum(AUDIT_EVENTS),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type AuditEventInput = z.infer<typeof auditEventSchema>;
