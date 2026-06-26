'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  LogOut,
  Moon,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import { apiFetch } from '@/lib/api/client';
import { createClient } from '@/lib/supabase/client';
import type { AuthMeResponse, MembershipSummary } from '@/lib/types/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface V2SessionPanelProps {
  session: AuthMeResponse;
}

type V2SessionProblemCode = 'PROFILE_NOT_FOUND' | 'PROFILE_INACTIVE' | 'UNKNOWN';

interface V2SessionProblemPanelProps {
  code: V2SessionProblemCode;
}

function membershipLabel(membership: MembershipSummary): string {
  return `${membership.institutionName} · ${membership.roleKey}`;
}

function problemDescription(code: V2SessionProblemCode): string {
  if (code === 'PROFILE_INACTIVE') {
    return 'Tu cuenta existe, pero tu perfil institucional no está activo.';
  }

  return 'Tu cuenta existe, pero tu perfil institucional no está activo o no está configurado.';
}

async function logoutAndReturnToLogin(router: ReturnType<typeof useRouter>): Promise<void> {
  const supabase = createClient();
  await apiFetch('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ scope: 'local' }),
  }).catch(() => undefined);
  await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
  router.replace('/login');
  router.refresh();
}

export function V2SessionProblemPanel({ code }: V2SessionProblemPanelProps) {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Moon className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-normal">Nocturna</h1>
            <p className="text-sm text-muted-foreground">Sesión institucional</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-1 h-5 w-5 text-destructive" aria-hidden />
              <div>
                <CardTitle>No se pudo activar tu perfil institucional.</CardTitle>
                <CardDescription>{problemDescription(code)}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cierra sesión y contacta al administrador de tu institución si el problema continúa.
            </p>
            <Button type="button" variant="outline" onClick={() => logoutAndReturnToLogin(router)}>
              <LogOut className="mr-2 h-4 w-4" aria-hidden />
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export function V2SessionPanel({ session }: V2SessionPanelProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState(session.activeMembership?.membershipId ?? null);
  const [isPending, startTransition] = useTransition();
  const activeMemberships = session.memberships.filter(
    (membership) =>
      membership.status === 'active' &&
      (membership.institutionStatus === 'active' || membership.institutionStatus === 'trial')
  );

  useEffect(() => {
    if (!session.activeMembership?.membershipId) return;

    void apiFetch('/api/memberships/active', {
      method: 'POST',
      body: JSON.stringify({ membershipId: session.activeMembership.membershipId }),
    }).catch(() => undefined);
  }, [session.activeMembership?.membershipId]);

  async function activateMembership(membershipId: string): Promise<void> {
    const res = await apiFetch('/api/memberships/active', {
      method: 'POST',
      body: JSON.stringify({ membershipId }),
    });

    if (!res.ok) {
      toast.error('No se pudo activar esa membresía');
      return;
    }

    setActiveId(membershipId);
    toast.success('Contexto activado');
    startTransition(() => {
      router.replace('/v2/dashboard');
      router.refresh();
    });
  }

  async function logout(): Promise<void> {
    await logoutAndReturnToLogin(router);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Moon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h1 className="text-xl font-semibold tracking-normal">Nocturna</h1>
              <p className="text-sm text-muted-foreground">{session.profile.email}</p>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" aria-hidden />
            Salir
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Sesión activa</CardTitle>
                <CardDescription>
                  {session.profile.fullName ?? session.profile.email}
                </CardDescription>
              </div>
              <Badge variant={session.membershipRequired ? 'secondary' : 'default'}>
                {session.membershipRequired ? 'Requiere contexto' : 'Contexto activo'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {session.activeMembership ? (
              <div className="rounded-md border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
                  {membershipLabel(
                    session.memberships.find(
                      (membership) =>
                        membership.membershipId === session.activeMembership?.membershipId
                    ) ?? {
                      membershipId: session.activeMembership.membershipId,
                      institutionId: session.activeMembership.institutionId,
                      institutionName: session.activeMembership.institutionId,
                      roleKey: session.activeMembership.roleKey,
                      status: session.activeMembership.membershipStatus,
                      institutionStatus: session.activeMembership.institutionStatus,
                    }
                  )}
                </div>
                <div className="mt-4">
                  <Button asChild>
                    <Link href="/v2/dashboard">
                      Continuar al dashboard
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : null}

            {activeMemberships.length > 0 ? (
              <div className="grid gap-3">
                {activeMemberships.map((membership) => {
                  const selected = activeId === membership.membershipId;
                  return (
                    <div
                      key={membership.membershipId}
                      className="flex items-center justify-between gap-3 rounded-md border p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{membershipLabel(membership)}</p>
                        <p className="text-xs text-muted-foreground">{membership.status}</p>
                      </div>
                      <Button
                        type="button"
                        variant={selected ? 'secondary' : 'outline'}
                        disabled={selected || isPending}
                        onClick={() => activateMembership(membership.membershipId)}
                      >
                        {selected ? (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden />
                            Activa
                          </>
                        ) : isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                            Activando
                          </>
                        ) : (
                          'Activar'
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                No hay membresías activas disponibles.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
