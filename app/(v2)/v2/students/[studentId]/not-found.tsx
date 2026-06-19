import Link from 'next/link';
import { UserRoundX } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function StudentProfileV2NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <UserRoundX className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="text-xl font-semibold">Estudiante no disponible</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        El perfil solicitado no existe o no está visible para tu membresía activa.
      </p>
      <Button asChild className="mt-5">
        <Link href="/v2/students">Volver a estudiantes</Link>
      </Button>
    </div>
  );
}
