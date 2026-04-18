import type { AuthError } from '@supabase/supabase-js';

/**
 * Map raw Supabase auth errors (English, internal codes) to user-facing
 * Spanish copy. Keeps the form free from string branching.
 *
 * We NEVER echo the raw error.message back verbatim because it can leak
 * internal state (“email not confirmed” can be used to enumerate accounts).
 * Instead we collapse into a few safe buckets.
 */
export function supabaseErrorToMessage(
  error: AuthError | { message: string; status?: number; name?: string }
): string {
  const status = 'status' in error ? error.status : undefined;
  const raw = (error.message ?? '').toLowerCase();

  if (status === 429 || raw.includes('rate limit')) {
    return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
  }
  if (raw.includes('invalid login credentials') || status === 400) {
    return 'Correo o contraseña incorrectos.';
  }
  if (raw.includes('email not confirmed')) {
    return 'Tu correo aún no está confirmado. Revisa tu bandeja de entrada.';
  }
  if (raw.includes('network') || raw.includes('fetch')) {
    return 'No pudimos conectar con el servicio. Revisa tu conexión e inténtalo otra vez.';
  }
  if (status === 422) {
    return 'Revisa el correo y la contraseña.';
  }
  return 'No pudimos iniciar sesión. Inténtalo de nuevo en unos segundos.';
}
