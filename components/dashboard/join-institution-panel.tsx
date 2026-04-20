'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Loader2,
  QrCode,
  Sparkles,
  Ticket,
  CheckCircle2,
} from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { UserRole } from '@/lib/types/database';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Traducción de códigos/mensajes del endpoint `/api/invites/consume` a frases
 * accionables para el usuario final. Mantenemos el fallback original en
 * `catch`-all para no ocultar mensajes nuevos.
 */
function friendlyError(
  payload: { code?: string; message?: string } | undefined
): string {
  const code = payload?.code ?? '';
  const msg = (payload?.message ?? '').toLowerCase();
  if (code === 'NOT_FOUND' || msg.includes('no encontrada')) {
    return 'Código inválido o inexistente.';
  }
  if (msg.includes('revocada')) return 'Invitación revocada.';
  if (msg.includes('ya utilizada') || msg.includes('ya usada')) {
    return 'Esta invitación ya fue usada.';
  }
  if (msg.includes('expirada') || msg.includes('expir')) {
    return 'Invitación expirada.';
  }
  if (msg.includes('otra institución')) {
    return 'Esa invitación es para otra institución.';
  }
  if (code === 'VALIDATION_ERROR') return 'El código no es válido.';
  return payload?.message ?? 'No se pudo aceptar la invitación.';
}

interface Props {
  role: UserRole;
}

export function JoinInstitutionPanel({ role }: Props) {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [qrLoading, setQrLoading] = useState(false);

  const valid = UUID_RE.test(token.trim());
  const qrValid = UUID_RE.test(qrToken.trim());

  const consume = useCallback(
    async (rawToken: string): Promise<boolean> => {
      const t = rawToken.trim();
      if (!UUID_RE.test(t)) {
        toast.error('El código no es válido');
        return false;
      }
      const res = await apiFetch('/api/invites/consume', {
        method: 'POST',
        body: JSON.stringify({ token: t }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        data?: { kind: 'teacher' | 'student'; courseId: string | null };
        error?: { message?: string; code?: string };
      };
      if (!res.ok || !json.data) {
        toast.error(friendlyError(json.error));
        return false;
      }

      // Forzamos un refresh del JWT para que el próximo request lleve el
      // nuevo `institution_id` en app_metadata. Hacemos polling defensivo
      // hasta 10 × 200ms para cubrir la propagación del Custom Access Token
      // Hook de Supabase.
      try {
        const sb = createClient();
        await sb.auth.refreshSession();
        for (let i = 0; i < 10; i += 1) {
          const { data } = await sb.auth.getSession();
          const tk = data.session?.access_token;
          if (!tk) break;
          try {
            const [, payloadB64] = tk.split('.');
            // atob no maneja url-safe b64; normalizamos.
            const decoded = JSON.parse(
              atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
            ) as {
              institution_id?: string;
              app_metadata?: { institution_id?: string };
            };
            if (decoded.institution_id || decoded.app_metadata?.institution_id) {
              break;
            }
          } catch {
            break;
          }
          await new Promise((r) => setTimeout(r, 200));
          await sb.auth.refreshSession();
        }
      } catch {
        /* el próximo request refrescará automáticamente. */
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
      return true;
    },
    [router]
  );

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await consume(token);
    } finally {
      setLoading(false);
    }
  }

  async function submitFromQr() {
    if (qrLoading) return;
    setQrLoading(true);
    try {
      const ok = await consume(qrToken);
      if (ok) setQrModalOpen(false);
    } finally {
      setQrLoading(false);
    }
  }

  /** Permite pegar el link completo (/invite/<token>) o solo el UUID. */
  function normalizeQrInput(raw: string): string {
    const trimmed = raw.trim();
    // Intentamos extraer un UUID al final del string (ej. URL de QR).
    const m = trimmed.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    );
    return m?.[0] ?? trimmed;
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <CardTitle className="text-lg">¡Bienvenido a Nocturna!</CardTitle>
              <CardDescription>
                Aún no perteneces a ninguna institución. Pegá el código de
                invitación que recibiste para empezar.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Código manual */}
          <form
            onSubmit={submitManual}
            className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
          >
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
                aria-invalid={token.length > 0 && !valid}
                autoFocus
              />
              {token.length > 0 && !valid ? (
                <p className="text-xs text-destructive">
                  Debe tener formato UUID (ej. 00000000-0000-0000-0000-000000000000).
                </p>
              ) : null}
            </div>
            <Button type="submit" disabled={loading || !valid}>
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
            {/* Acción QR */}
            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              className="rounded-md border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <QrCode className="h-4 w-4 text-primary" /> ¿Tenés un QR?
              </div>
              <p className="text-xs text-muted-foreground">
                Escaneá el QR con la cámara de tu teléfono y pegá acá el enlace o
                el código que te muestra.
              </p>
              <p className="mt-2 text-xs font-medium text-primary">
                Abrir pegador de QR →
              </p>
            </button>

            <div className="rounded-md border bg-card p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-primary" /> ¿Sos{' '}
                {role === 'teacher' ? 'profesor' : 'estudiante'}?
              </div>
              <p className="text-xs text-muted-foreground">
                {role === 'teacher'
                  ? 'Pedí a un admin de tu institución que te envíe un QR de profesor.'
                  : 'Tu docente puede generar un QR por curso desde su panel de invitaciones.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal QR paste */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" /> Código del QR
            </DialogTitle>
            <DialogDescription>
              Pegá el enlace completo (por ej. <code>/invite/xxxx-...</code>) o
              solo el código que muestra el QR. Extraemos el token
              automáticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="j-qr">Enlace o código</Label>
            <Input
              id="j-qr"
              value={qrToken}
              onChange={(e) => setQrToken(normalizeQrInput(e.target.value))}
              placeholder="https://…/invite/00000000-0000-0000-0000-000000000000"
              className="font-mono text-xs"
              aria-invalid={qrToken.length > 0 && !qrValid}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {qrValid ? (
                <span className="inline-flex items-center gap-1 text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Código válido
                </span>
              ) : qrToken.length > 0 ? (
                'Debe contener un UUID con formato válido.'
              ) : (
                'Podés pegar el link del QR o solo el token.'
              )}
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setQrModalOpen(false)} disabled={qrLoading}>
              Cancelar
            </Button>
            <Button onClick={submitFromQr} disabled={qrLoading || !qrValid}>
              {qrLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validando…
                </>
              ) : (
                'Aceptar invitación'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
