import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { Moon } from 'lucide-react';
import Link from 'next/link';

/**
 * Shared shell for every public auth page (/login, /signup).
 *
 *  * Centres the card and brings the Nocturna logo into every route.
 *  * Runs on the server: if a valid Supabase session already exists we
 *    bounce to /dashboard so authed users never see the login form.
 *  * Gracefully no-ops when Supabase creds are placeholders (placeholder
 *    mode), so the design still renders during local development.
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-accent/30 px-4 py-10">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-sm font-semibold text-foreground"
        aria-label="Ir al inicio"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Moon className="h-4 w-4" aria-hidden />
        </span>
        <span className="text-base tracking-tight">Nocturna</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 text-center text-xs text-muted-foreground">
        Al continuar aceptas nuestras condiciones de servicio y política de privacidad.
      </p>
    </main>
  );
}
