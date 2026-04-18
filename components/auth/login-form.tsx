'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { supabaseErrorToMessage } from '@/lib/auth/error-map';
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

interface LoginFormProps {
  nextPath: string;
}

/**
 * Client-side login form.
 *   * Uses `react-hook-form` + Zod for typed validation (same schema as the
 *     server API).
 *   * Calls `supabase.auth.signInWithPassword` which stores the session
 *     cookies via Supabase SSR — we never handle tokens manually.
 *   * Surface errors both inline (field + global) and via toast.
 *   * Refreshes the router so the subsequent navigation is made with the
 *     new session cookies attached.
 */
export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(values: LoginInput): Promise<void> {
    setGlobalError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      const msg = supabaseErrorToMessage(error);
      setGlobalError(msg);
      toast.error('No pudimos iniciar sesión', { description: msg });
      return;
    }
    toast.success('Bienvenido·a de vuelta');
    router.replace(nextPath);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
        <CardDescription>
          Accede a tu institución con tu correo y contraseña.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tu@institución.edu"
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
            {errors.email ? (
              <p id="email-error" className="text-xs text-destructive">
                Introduce un correo válido.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="password">Contraseña</Label>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password')}
            />
            {errors.password ? (
              <p id="password-error" className="text-xs text-destructive">
                Introduce tu contraseña.
              </p>
            ) : null}
          </div>

          {globalError ? (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {globalError}
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Accediendo…
              </>
            ) : (
              'Entrar'
            )}
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
  );
}
