'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, LogOut, Moon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api/client';
import { createClient } from '@/lib/supabase/client';

export type V2ProblemCode =
  | 'PROFILE_NOT_FOUND'
  | 'PROFILE_INACTIVE'
  | 'INSTITUTION_UNAVAILABLE'
  | 'UNKNOWN';

interface V2ProblemStateProps {
  code: V2ProblemCode;
}

function problemCopy(code: V2ProblemCode): { title: string; description: string } {
  if (code === 'PROFILE_INACTIVE') {
    return {
      title: 'Tu perfil institucional no está activo',
      description: 'Un administrador debe reactivar tu perfil antes de continuar.',
    };
  }

  if (code === 'PROFILE_NOT_FOUND') {
    return {
      title: 'Tu perfil institucional no está configurado',
      description: 'Tu sesión existe, pero todavía no tiene un perfil disponible en Nocturna.',
    };
  }

  if (code === 'INSTITUTION_UNAVAILABLE') {
    return {
      title: 'La institución no está disponible',
      description: 'Este espacio está suspendido o archivado. Contacta al administrador institucional.',
    };
  }

  return {
    title: 'No pudimos abrir tu espacio de trabajo',
    description: 'Cierra sesión y vuelve a intentarlo. Si continúa, contacta al administrador.',
  };
}

export function V2ProblemState({ code }: V2ProblemStateProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const copy = problemCopy(code);

  async function logout(): Promise<void> {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    const supabase = createClient();
    await apiFetch('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ scope: 'local' }),
    }).catch(() => undefined);
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    router.replace('/login');
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Moon className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="font-semibold">Nocturna</p>
            <p className="text-sm text-muted-foreground">Espacio institucional V2</p>
          </div>
        </div>

        <section className="rounded-md border bg-card p-6 shadow-sm">
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </span>
          <h1 className="text-xl font-semibold">{copy.title}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{copy.description}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-6"
            disabled={isLoggingOut}
            onClick={logout}
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <LogOut className="h-4 w-4" aria-hidden />
            )}
            Cerrar sesión
          </Button>
        </section>
      </div>
    </main>
  );
}
