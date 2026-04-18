'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Moon } from 'lucide-react';

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  not_authenticated: {
    title: 'Inicia sesión para continuar',
    description: 'Tu sesión expiró o aún no has iniciado sesión.',
  },
  invalid_profile: {
    title: 'Perfil no válido',
    description: 'Tu usuario no tiene un perfil asociado. Contacta al administrador de tu institución.',
  },
  inactive_account: {
    title: 'Cuenta desactivada',
    description: 'Tu cuenta fue desactivada. Contacta al administrador de tu institución.',
  },
  missing_tenant: {
    title: 'Sin institución asignada',
    description: 'Tu usuario no está vinculado a ninguna institución activa.',
  },
  session_expired: {
    title: 'Sesión expirada',
    description: 'Por seguridad, vuelve a iniciar sesión.',
  },
  invalid_callback: {
    title: 'Enlace inválido',
    description: 'El enlace usado para iniciar sesión no es válido o expiró.',
  },
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard';
  const errorCode = searchParams.get('error');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!errorCode) return;
    const info = ERROR_MESSAGES[errorCode];
    if (info) toast.error(info.title, { description: info.description });
  }, [errorCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error('No pudimos iniciar sesión', { description: error.message });
      return;
    }
    toast.success('Bienvenido de vuelta');
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-accent/30 px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-sm font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Moon className="h-4 w-4" />
          </span>
          Nocturna
        </Link>

        {errorCode && ERROR_MESSAGES[errorCode] && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <p className="font-medium">{ERROR_MESSAGES[errorCode].title}</p>
            <p className="text-destructive/80">{ERROR_MESSAGES[errorCode].description}</p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
            <CardDescription>Accede a tu institución con tu correo y contraseña.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Accediendo…' : 'Entrar'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                ¿Aún no tienes institución?{' '}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                  Crear una
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}
