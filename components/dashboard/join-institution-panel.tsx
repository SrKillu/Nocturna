'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, QrCode, Sparkles, Ticket } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
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

/**
 * Panel que se muestra dentro del dashboard cuando el usuario todavía no
 * pertenece a ninguna institución. Permite pegar un código de invitación
 * (mismo flujo que /auth/pending) sin sacarlo del shell autenticado.
 */
export function JoinInstitutionPanel({ role }: { role: 'student' | 'teacher' | 'admin' | 'super_admin' }) {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = token.trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t)) {
      toast.error('El código no es válido');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/invites/consume', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: t }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        data?: { kind: 'teacher' | 'student'; courseId: string | null };
        error?: { message?: string };
      };
      if (!res.ok || !json.data) {
        toast.error(json.error?.message ?? 'No se pudo aceptar la invitación');
        return;
      }
      try {
        const sb = createClient();
        await sb.auth.refreshSession();
      } catch {
        /* noop */
      }
      router.refresh();
      if (json.data.kind === 'student' && json.data.courseId) {
        toast.success('¡Listo! Te inscribimos al curso.');
        setTimeout(() => {
          window.location.href = `/courses/${json.data!.courseId}`;
        }, 300);
      } else {
        toast.success('¡Bienvenido!');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 300);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <CardTitle className="text-lg">¡Bienvenido a Nocturna!</CardTitle>
              <CardDescription>
                Aún no perteneces a ninguna institución. Pegá el código de invitación
                que recibiste para empezar.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="j-token" className="flex items-center gap-1.5">
                <Ticket className="h-3.5 w-3.5" /> Código de invitación
              </Label>
              <Input
                id="j-token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
                className="font-mono text-xs"
                autoFocus
              />
            </div>
            <Button type="submit" disabled={loading || !token.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validando…
                </>
              ) : (
                'Unirme'
              )}
            </Button>
          </form>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border bg-card p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <QrCode className="h-4 w-4 text-primary" /> ¿Tenés un QR?
              </div>
              <p className="text-xs text-muted-foreground">
                Escaneá el QR con la cámara del teléfono y tocá el enlace.
                Te lleva directo al consumo de la invitación.
              </p>
            </div>
            <div className="rounded-md border bg-card p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-primary" /> ¿Sos {role === 'teacher' ? 'profesor' : 'estudiante'}?
              </div>
              <p className="text-xs text-muted-foreground">
                {role === 'teacher'
                  ? 'Pedile a un admin de tu institución que te envíe un QR de profesor.'
                  : 'Tu docente puede generar un QR por curso desde su panel de invitaciones.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
