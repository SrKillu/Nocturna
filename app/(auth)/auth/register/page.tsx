'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Moon, Ticket, UserRound, GraduationCap } from 'lucide-react';
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
import { cn } from '@/lib/utils';

type Role = 'student' | 'teacher';

interface InvitePreview {
  kind: 'teacher' | 'student';
  institutionName: string | null;
  courseName: string | null;
  status: 'active' | 'expired' | 'used' | 'revoked';
}

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  const initialRole = (searchParams.get('role') === 'teacher' ? 'teacher' : 'student') as Role;

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [role, setRole] = useState<Role>(initialRole);
  const [tokenInput, setTokenInput] = useState<string>(tokenFromUrl ?? '');
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  const effectiveToken = tokenInput.trim() || null;
  const isByInvite = !!effectiveToken && preview?.status === 'active';

  // Preview del invite (auth-less): usamos la ruta pública de lookup limitada.
  // Para evitar crear una ruta auth-less, simplemente NO mostramos preview si el
  // usuario no está logueado; confiamos en que el endpoint de register valide.
  // Si querés preview, puede añadirse más tarde en /api/invites/lookup/[token]
  // con rate-limit y sin auth.
  useEffect(() => {
    setPreview(null);
  }, [effectiveToken]);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.fullName.trim() || !form.email.trim() || form.password.length < 8) {
        toast.error('Completá nombre, email y contraseña (mín. 8 caracteres).');
        return;
      }
      setLoading(true);
      try {
        const payload = {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          role,
          token: effectiveToken,
        };
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = (await res.json().catch(() => ({}))) as {
          data?: {
            userId: string;
            role: Role;
            institutionId: string | null;
            enrolledCourseId: string | null;
            tokenConsumed: boolean;
          };
          error?: { message?: string };
        };
        if (!res.ok || !json.data) {
          toast.error(json.error?.message ?? 'No se pudo completar el registro');
          return;
        }

        // Iniciamos sesión automáticamente con las credenciales recién creadas.
        const sb = createClient();
        const { error: loginErr } = await sb.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (loginErr) {
          toast.message('Cuenta creada', {
            description: 'Iniciamos sesión manual: por favor, inicia sesión.',
          });
          router.push('/login');
          return;
        }

        // Decidimos a dónde enviar al usuario en función del resultado.
        if (json.data.enrolledCourseId) {
          toast.success('¡Bienvenido! Inscripción completada.');
          router.replace(`/courses/${json.data.enrolledCourseId}`);
        } else if (json.data.institutionId) {
          toast.success('¡Cuenta lista!');
          router.replace('/dashboard');
        } else {
          toast.message('Cuenta creada', {
            description: 'Necesitás un código de invitación para continuar.',
          });
          router.replace('/auth/pending');
        }
        router.refresh();
      } finally {
        setLoading(false);
      }
    },
    [form, role, effectiveToken, router]
  );

  const hasToken = !!effectiveToken;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-accent/30 px-4 py-10">
      <div className="w-full max-w-lg">
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
            <CardTitle>Crear cuenta</CardTitle>
            <CardDescription>
              {hasToken
                ? 'Completá tus datos para aceptar la invitación.'
                : 'Uníte como estudiante o profesor. Si tenés un código de invitación, pegálo abajo.'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={submit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="r-name">Nombre completo</Label>
                <Input
                  id="r-name"
                  required
                  minLength={2}
                  value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-email">Email</Label>
                <Input
                  id="r-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-password">Contraseña</Label>
                <Input
                  id="r-password"
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  autoComplete="new-password"
                />
                <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
              </div>

              {/* Selector de rol — oculto si vienen con token (el invite define el rol). */}
              {!hasToken ? (
                <div className="space-y-2">
                  <Label>¿Cómo querés unirte?</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <RoleCard
                      icon={<GraduationCap className="h-4 w-4" />}
                      title="Estudiante"
                      desc="Aprenderé en cursos"
                      active={role === 'student'}
                      onClick={() => setRole('student')}
                    />
                    <RoleCard
                      icon={<UserRound className="h-4 w-4" />}
                      title="Profesor"
                      desc="Enseñaré y corregiré"
                      active={role === 'teacher'}
                      onClick={() => setRole('teacher')}
                    />
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="r-token" className="flex items-center gap-1.5">
                  <Ticket className="h-3.5 w-3.5" />
                  {hasToken ? 'Invitación detectada' : 'Código de invitación (opcional)'}
                </Label>
                <Input
                  id="r-token"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="00000000-0000-0000-0000-000000000000"
                  readOnly={!!tokenFromUrl}
                  className={cn(
                    hasToken &&
                      'border-primary bg-primary/5 font-mono text-xs text-primary'
                  )}
                />
                {hasToken ? (
                  <p className="text-xs text-muted-foreground">
                    El rol y la institución se tomarán de esta invitación.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Si no tenés código todavía, podrés pegarlo después.
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando cuenta…
                  </>
                ) : (
                  'Crear cuenta'
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                ¿Ya tenés cuenta?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Iniciar sesión
                </Link>
              </p>
              <p className="text-center text-xs text-muted-foreground">
                ¿Querés crear una institución nueva?{' '}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                  Registrá tu institución
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}

function RoleCard({
  icon,
  title,
  desc,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors',
        active
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/40 hover:bg-muted/40'
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-md',
          active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
      >
        {icon}
      </span>
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs text-muted-foreground">{desc}</span>
    </button>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageInner />
    </Suspense>
  );
}
