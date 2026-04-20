'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Moon, Ticket } from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function PendingPage() {
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
      const res = await apiFetch('/api/invites/consume', {
        method: 'POST',
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

      // Refrescamos la sesión en el cliente para que el JWT refleje la nueva
      // institución/rol tras el cambio en app_metadata.
      try {
        const sb = createClient();
        await sb.auth.refreshSession();
      } catch {
        /* el próximo request refresca automáticamente. */
      }

      router.refresh();
      if (json.data.kind === 'student' && json.data.courseId) {
        toast.success('¡Listo! Te inscribimos al curso.');
        setTimeout(() => {
          window.location.href = `/courses/${json.data!.courseId}`;
        }, 400);
      } else {
        toast.success('¡Bienvenido!');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 400);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-accent/30 px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 flex items-center justify-center gap-2 text-sm font-semibold"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Moon className="h-4 w-4" />
          </span>
          Nocturna
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Necesitás una invitación</CardTitle>
            <CardDescription>
              Tu cuenta está lista pero todavía no pertenecés a ninguna institución.
              Pegá el código de la invitación que recibiste para continuar.
            </CardDescription>
          </CardHeader>
          <form onSubmit={submit}>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="p-token" className="flex items-center gap-1.5">
                  <Ticket className="h-3.5 w-3.5" /> Código de invitación
                </Label>
                <Input
                  id="p-token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="00000000-0000-0000-0000-000000000000"
                  className="font-mono text-xs"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  También podés escanear el QR recibido — te redirigirá automáticamente.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading || !token.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validando…
                  </>
                ) : (
                  'Aceptar invitación'
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Si querés usar otra cuenta,{' '}
                <a href="/api/auth/logout" className="font-medium text-primary hover:underline">
                  cerrar sesión
                </a>
                .
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}
