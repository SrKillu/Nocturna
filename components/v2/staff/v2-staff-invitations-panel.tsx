import { MailWarning } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { StaffV2InvitationPreview } from '@/lib/types/staff-v2';

export function V2StaffInvitationsPanel({
  invitations,
}: {
  invitations: readonly StaffV2InvitationPreview[];
}) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="staff-invitations-title">
      <div className="border-b px-4 py-3">
        <h2 id="staff-invitations-title" className="flex items-center gap-2 font-semibold">
          <MailWarning className="h-4 w-4 text-primary" aria-hidden />
          Invitaciones pendientes mock
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Vista informativa sin correos, enlaces ni envíos reales.
        </p>
      </div>
      <ul className="divide-y">
        {invitations.map((invitation) => (
          <li
            key={invitation.id}
            className="flex items-start justify-between gap-3 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium">
                {invitation.roleLabel} · {invitation.areaLabel}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Solicitud mock · {invitation.requestedLabel}
              </p>
            </div>
            <Badge variant="outline">{invitation.statusLabel}</Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
