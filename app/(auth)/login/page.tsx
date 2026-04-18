import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';
import { LoginAlert } from '@/components/auth/login-alert';
import { sanitizeNextParam } from '@/lib/security/next-param';

export const metadata: Metadata = {
  title: 'Iniciar sesión · Nocturna',
  description: 'Accede a tu institución Nocturna.',
};

/**
 * Server Component. Reads (sanitised) search params, renders the client form.
 * The auth layout has already redirected away anyone with a live session, so
 * we know the caller is unauthenticated by this point.
 */
export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; redirectTo?: string; error?: string };
}) {
  const next = sanitizeNextParam(searchParams.next ?? searchParams.redirectTo, '/dashboard');
  const errorCode = typeof searchParams.error === 'string' ? searchParams.error : null;

  return (
    <div className="space-y-4">
      {errorCode ? <LoginAlert code={errorCode} /> : null}
      <LoginForm nextPath={next} />
    </div>
  );
}
