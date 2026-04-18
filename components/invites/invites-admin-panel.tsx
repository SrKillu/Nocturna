'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { InviteQrCard } from '@/components/invites/invite-qr-card';
import { inviteStatus, type TeacherInviteRow } from '@/lib/invites/types';

interface Props {
  initialInvites: TeacherInviteRow[];
}

export function InvitesAdminPanel({ initialInvites }: Props) {
  const [invites, setInvites] = useState<TeacherInviteRow[]>(initialInvites);
  const [emailHint, setEmailHint] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await apiFetch('/api/invites/teachers', {
        method: 'POST',
        body: JSON.stringify({
          emailHint: emailHint.trim() || null,
          expiresInDays,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        data?: TeacherInviteRow;
        error?: { message?: string };
      };
      if (!res.ok || !json.data) {
        toast.error('No se pudo generar el QR', { description: json.error?.message });
        return;
      }
      setInvites((prev) => [json.data as TeacherInviteRow, ...prev]);
      toast.success('Invitación creada');
      setEmailHint('');
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: string) {
    if (!window.confirm('¿Revocar esta invitación? No podrá utilizarse.')) return;
    setRevokingId(id);
    try {
      const res = await apiFetch(`/api/invites/teachers/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        toast.error('No se pudo revocar');
        return;
      }
      setInvites((prev) =>
        prev.map((i) => (i.id === id ? { ...i, revoked: true } : i))
      );
      toast.success('Invitación revocada');
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Invitaciones para profesores</CardTitle>
        <CardDescription>
          Generá un QR que conviertirá en profesor al usuario que lo escanee.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form
          onSubmit={create}
          className="grid gap-3 rounded-md border bg-muted/30 p-4 sm:grid-cols-[minmax(0,1fr)_120px_auto] sm:items-end"
        >
          <div className="space-y-1.5">
            <Label htmlFor="t-email">Email sugerido (opcional)</Label>
            <Input
              id="t-email"
              type="email"
              placeholder="profesor@ejemplo.com"
              value={emailHint}
              onChange={(e) => setEmailHint(e.target.value)}
              disabled={creating}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-exp">Expira en (días)</Label>
            <Input
              id="t-exp"
              type="number"
              min={1}
              max={30}
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              disabled={creating}
            />
          </div>
          <Button type="submit" disabled={creating}>
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando
              </>
            ) : (
              <>
                <Plus className="mr-1.5 h-4 w-4" /> Generar QR
              </>
            )}
          </Button>
        </form>

        {invites.length === 0 ? (
          <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            Todavía no hay invitaciones activas para profesores.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {invites.map((inv) => (
              <InviteQrCard
                key={inv.id}
                token={inv.token}
                status={inviteStatus(inv)}
                expiresAt={inv.expires_at}
                title={inv.email_hint ?? 'Invitación sin email'}
                subtitle={`Creada ${new Date(inv.created_at).toLocaleDateString('es', {
                  day: '2-digit',
                  month: 'short',
                })}`}
                onRevoke={() => revoke(inv.id)}
                revoking={revokingId === inv.id}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
