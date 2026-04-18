import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/api/auth';
import { lookupInvite } from '@/lib/services/invites.service';
import { ConsumeInviteClient } from '@/components/invites/consume-invite-client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, UserPlus } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: { token: string };
}

/**
 * Pantalla pantalla pública-pero-autenticada que recibe el token del QR.
 *   * El middleware ya se encarga de redirigir a /login si el usuario no
 *     está autenticado, preservando `next=/invite/<token>`.
 */
export default async function InviteConsumePage({ params }: PageProps) {
  const ctx = await requireAuth().catch(() => null);
  if (!ctx) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${params.token}`)}`);
  }

  const preview = await lookupInvite(params.token);
  if (!preview) notFound();

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <PageHeader
        title="Invitación"
        description="Revisá los detalles y aceptala para completar el alta."
      />

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            {preview.kind === 'teacher' ? (
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserPlus className="h-5 w-5" />
              </span>
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <GraduationCap className="h-5 w-5" />
              </span>
            )}
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                {preview.kind === 'teacher'
                  ? 'Invitación como profesor'
                  : 'Invitación a un curso'}
              </p>
              <p className="truncate text-base font-semibold">
                {preview.kind === 'teacher'
                  ? preview.institutionName ?? 'Institución'
                  : preview.courseName ?? 'Curso'}
              </p>
              {preview.kind === 'student' ? (
                <p className="truncate text-xs text-muted-foreground">
                  {preview.institutionName ?? ''}
                </p>
              ) : null}
            </div>
            <div className="ml-auto">
              <StatusBadge status={preview.status} />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Expira el{' '}
            {new Date(preview.expires_at).toLocaleString('es', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>

          <ConsumeInviteClient token={params.token} status={preview.status} kind={preview.kind} />
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: 'active' | 'expired' | 'used' | 'revoked' }) {
  switch (status) {
    case 'active':
      return <Badge>Activa</Badge>;
    case 'expired':
      return <Badge variant="outline">Expirada</Badge>;
    case 'used':
      return <Badge variant="secondary">Usada</Badge>;
    case 'revoked':
      return <Badge variant="destructive">Revocada</Badge>;
  }
}
