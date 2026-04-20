'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api/client';
import { createClient as createBrowserSupabase } from '@/lib/supabase/client';

interface Props {
  token: string;
  status: 'active' | 'expired' | 'used' | 'revoked';
  kind: 'teacher' | 'student';
}

export function ConsumeInviteClient({ token, status, kind }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function accept() {
    setLoading(true);
    try {
      const res = await apiFetch('/api/invites/consume', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        data?: { kind: 'teacher' | 'student'; courseId: string | null };
        error?: { message?: string };
      };
      if (!res.ok || !json.data) {
        toast.error('No se pudo aceptar la invitación', {
          description: json.error?.message,
        });
        return;
      }
      if (json.data.kind === 'teacher') {
        toast.success('¡Listo! Ahora sos profesor de la institución.');
        // El hook Custom Access Token re-emite el JWT en el próximo refresh.
        // Forzamos un refresh de sesión desde el cliente para que cookie y
        // claims queden sincronizados antes de volver al dashboard.
        try {
          const sb = createBrowserSupabase();
          await sb.auth.refreshSession();
        } catch {
          /* soft-fail: el siguiente request hará el refresh automático. */
        }
        router.refresh();
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 400);
      } else if (json.data.courseId) {
        toast.success('Inscripción completada');
        // Forzamos refresh de la capa RSC para invalidar el cache de /courses
        // antes del push, para que la página destino vea el nuevo enrollment.
        router.refresh();
        setTimeout(() => {
          router.push(`/courses/${json.data!.courseId}`);
        }, 200);
      } else {
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }

  if (status !== 'active') {
    return (
      <div className="rounded-md border border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground">
        Esta invitación ya no está disponible ({status}).
      </div>
    );
  }

  return (
    <Button size="lg" className="w-full" onClick={accept} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Procesando…
        </>
      ) : kind === 'teacher' ? (
        'Unirme como profesor'
      ) : (
        'Inscribirme al curso'
      )}
    </Button>
  );
}
