import { AlertCircle } from 'lucide-react';

/**
 * Renders the dismissable error banner shown above the login form based on
 * the `error` query string emitted by middleware / auth callback redirects.
 * Centralising the mapping makes it trivial to tune copy per reason code.
 */
const ERROR_COPY: Record<string, { title: string; description: string }> = {
  not_authenticated: {
    title: 'Inicia sesión para continuar',
    description: 'Tu sesión expiró o aún no has iniciado sesión.',
  },
  invalid_profile: {
    title: 'Perfil no válido',
    description:
      'Tu usuario no tiene un perfil asociado. Contacta al administrador de tu institución.',
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

export function LoginAlert({ code }: { code: string }) {
  const info = ERROR_COPY[code];
  if (!info) return null;
  return (
    <div
      role="alert"
      className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>
        <p className="font-medium">{info.title}</p>
        <p className="text-destructive/80">{info.description}</p>
      </div>
    </div>
  );
}
