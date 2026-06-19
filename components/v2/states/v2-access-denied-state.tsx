import Link from 'next/link';
import { LockKeyhole } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface V2AccessDeniedStateProps {
  institutionName: string;
  canSwitchInstitution?: boolean;
}

export function V2AccessDeniedState({
  institutionName,
  canSwitchInstitution = false,
}: V2AccessDeniedStateProps) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-destructive/10 text-destructive">
        <LockKeyhole className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="text-xl font-semibold">Acceso no disponible</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Tu membresía en {institutionName} no incluye acceso a esta sección.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/v2/dashboard">Volver al dashboard</Link>
        </Button>
        {canSwitchInstitution ? (
          <Button asChild variant="outline">
            <Link href="/auth/v2-session">Cambiar institución</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
